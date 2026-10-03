const WebSocket = require('ws');
const pool = require('../db');
const { decrypt } = require('../util/crypto');
const { alawToPcm, pcmToAlaw, resamplePcm } = require('./audioCodec');
const { getVertexAccessToken, loadServiceAccount } = require('./vertexAiService');

/**
 * Gemini Live Bidirectional Voice Bridge:
 * Connects to Google's Gemini Live / Vertex AI API via WebSocket and streams
 * audio between VoiceLink G.711 A-law 8kHz and Gemini Live PCM (16kHz in, 24kHz out).
 */

async function getGeminiApiKey() {
  // 1. Check environment variable
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  // 2. Check AI Models database table
  try {
    const { rows } = await pool.query(
      "SELECT api_key_encrypted FROM coexistence.ai_models WHERE provider = 'gemini' AND api_key_encrypted IS NOT NULL ORDER BY id DESC LIMIT 1"
    );
    if (rows[0]?.api_key_encrypted) {
      return decrypt(rows[0].api_key_encrypted);
    }
  } catch (err) {
    console.error('[gemini-live] getGeminiApiKey DB error:', err.message);
  }
  return null;
}

/**
 * Creates a Gemini Live Session for an active phone call
 */
class GeminiLiveSession {
  constructor({ callId, agent = {}, onAudioOut, onTranscript, onError, onClose }) {
    this.callId = callId;
    this.agent = agent;
    this.onAudioOut = onAudioOut || (() => {});
    this.onTranscript = onTranscript || (() => {});
    this.onError = onError || (() => {});
    this.onClose = onClose || (() => {});
    this.ws = null;
    this.isConnected = false;
    this.fullTranscript = [];
  }

  async start() {
    const sa = loadServiceAccount();
    let wsUrl = '';
    let wsOptions = {};

    if (sa) {
      try {
        const token = await getVertexAccessToken();
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || sa.project_id || 'project-c0b5ea74-5ba2-4e68-8ab';
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        wsUrl = `wss://${location}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;
        wsOptions = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        console.log(`[gemini-live] Using Vertex AI Google Cloud authenticated session (${projectId})`);
      } catch (e) {
        console.warn('[gemini-live] Vertex AI token generation fallback to API key:', e.message);
      }
    }

    if (!wsUrl) {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        throw new Error('No Gemini API key or GCP Service Account found. Please check gcp-service-account.json or GEMINI_API_KEY.');
      }
      wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    }

    let kbContext = '';
    try {
      const { rows } = await pool.query(
        'SELECT title, content FROM coexistence.knowledge_bases WHERE is_active = TRUE ORDER BY id ASC'
      );
      if (rows.length > 0) {
        kbContext = '\n\n=== VERIFIED COMPANY KNOWLEDGE BASE ===\n' +
          rows.map(r => `--- ${r.title} ---\n${r.content}`).join('\n\n') +
          '\n\nSTRICT INSTRUCTION: Speak naturally in short spoken sentences. Ground your answers strictly in the Verified Knowledge Base above. Never invent facts.';
      }
    } catch (e) {}

    const modelName = this.agent.gemini_model || process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash';
    const voiceName = this.agent.voice_name || 'Aoede';
    const basePrompt = this.agent.system_prompt || 
      'You are a friendly, concise AI phone agent for Connects AI CRM. Speak in natural conversational tones without markdown or bullet points.';
    const systemPrompt = `${basePrompt}${kbContext}`;

    this.ws = new WebSocket(wsUrl, wsOptions);

    this.ws.on('open', () => {
      console.log(`[gemini-live] connected for call ${this.callId}`);
      this.isConnected = true;

      // Send initial setup payload
      const setupMsg = {
        setup: {
          model: `models/${modelName.replace(/^models\//, '')}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName,
                },
              },
            },
            temperature: Number(this.agent.temperature || 0.7),
          },
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
        },
      };

      this.ws.send(JSON.stringify(setupMsg));
    });

    this.ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString('utf8'));

        // Handle server content / streaming model turn
        if (msg.serverContent) {
          const { modelTurn, interrupted } = msg.serverContent;

          if (interrupted) {
            console.log(`[gemini-live] user barge-in / interrupted for call ${this.callId}`);
          }

          if (modelTurn?.parts) {
            for (const part of modelTurn.parts) {
              // Received audio from Gemini Live
              if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                const pcm24k = Buffer.from(part.inlineData.data, 'base64');
                // Downsample 24kHz -> 8kHz PCM, then encode to G.711 A-law
                const pcm8k = resamplePcm(pcm24k, 24000, 8000);
                const alawBuf = pcmToAlaw(pcm8k);
                this.onAudioOut(alawBuf);
              }

              // Received text transcript chunk
              if (part.text) {
                this.fullTranscript.push({ speaker: 'agent', text: part.text, timestamp: new Date().toISOString() });
                this.onTranscript({ speaker: 'agent', text: part.text });
              }
            }
          }
        }
      } catch (err) {
        console.error('[gemini-live] message parse error:', err.message);
      }
    });

    this.ws.on('error', (err) => {
      console.error(`[gemini-live] error on call ${this.callId}:`, err.message);
      this.onError(err);
    });

    this.ws.on('close', (code, reason) => {
      console.log(`[gemini-live] closed for call ${this.callId} (${code})`);
      this.isConnected = false;
      this.onClose(code, reason);
    });
  }

  /**
   * Receives incoming G.711 A-law audio chunk from VoiceLink and pipes to Gemini
   * @param {Buffer} alawChunk 8kHz A-law buffer
   */
  sendUserAudio(alawChunk) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // 1. Decode G.711 A-law 8kHz -> 16-bit PCM 8kHz
    const pcm8k = alawToPcm(alawChunk);
    // 2. Upsample 8kHz -> 16kHz PCM for Gemini Live
    const pcm16k = resamplePcm(pcm8k, 8000, 16000);

    const realtimeChunk = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: pcm16k.toString('base64'),
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(realtimeChunk));
  }

  stop() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.isConnected = false;
  }
}

module.exports = {
  GeminiLiveSession,
  getGeminiApiKey,
};
