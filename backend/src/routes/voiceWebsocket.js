const { WebSocketServer } = require('ws');
const pool = require('../db');
const { GeminiLiveSession } = require('../services/geminiLiveService');

/**
 * Manages VoiceLink Telephony WebSocket audio streams:
 * - Listens for incoming connections from VoiceLink cloud
 * - Pairs call stream with GeminiLiveSession
 * - Bidirectionally streams G.711 A-law 8kHz audio frames
 * - Saves live call transcripts & duration on hangup
 */

const activeSessions = new Map(); // callId -> { ws, geminiSession, startTime, transcript: [] }

function initVoiceWebsocketServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Matches /api/voice/stream, /ws/voice, /ws/voicelink, or /api/voice/media-stream
    if (pathname.startsWith('/api/voice/stream') || pathname.startsWith('/ws/voice') || pathname.startsWith('/ws/voicelink')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const queryCallId = url.searchParams.get('callId') || url.searchParams.get('custom_id');
    console.log(`[voice-ws] new VoiceLink WebSocket connection from ${req.socket.remoteAddress}, callId: ${queryCallId || 'unassigned'}`);

    let currentCallId = queryCallId ? parseInt(queryCallId, 10) : null;
    let geminiSession = null;
    let callStartTime = Date.now();
    let transcriptChunks = [];

    // Fetch default or specified Voice Agent configuration
    async function loadAgent(agentId) {
      try {
        if (agentId) {
          const { rows } = await pool.query('SELECT * FROM coexistence.voice_agents WHERE id = $1', [agentId]);
          if (rows[0]) return rows[0];
        }
        const { rows } = await pool.query('SELECT * FROM coexistence.voice_agents WHERE is_default = true LIMIT 1');
        return rows[0] || {
          name: 'Default Agent',
          system_prompt: 'You are a helpful AI phone assistant for ForgeGrowth CRM. Speak concisely and naturally.',
          voice_name: 'Aoede',
          gemini_model: 'gemini-3.1-flash-live-preview',
          temperature: 0.7,
        };
      } catch (e) {
        return {};
      }
    }

    async function startBridge(callId, agentId) {
      currentCallId = callId;
      const agent = await loadAgent(agentId);

      // Update call record to in-progress
      await pool.query(
        'UPDATE coexistence.voice_calls SET status = $1, started_at = COALESCE(started_at, NOW()), updated_at = NOW() WHERE id = $2',
        ['in-progress', currentCallId]
      ).catch(() => {});

      geminiSession = new GeminiLiveSession({
        callId: currentCallId,
        agent,
        onAudioOut: (alawBuf) => {
          if (ws.readyState === ws.OPEN) {
            // Send binary A-law 8kHz audio frame back to VoiceLink
            ws.send(alawBuf);
          }
        },
        onTranscript: ({ speaker, text }) => {
          transcriptChunks.push(`[${speaker.toUpperCase()}]: ${text}`);
        },
        onError: (err) => {
          console.error(`[voice-ws] bridge error on call ${currentCallId}:`, err.message);
        },
        onClose: () => {
          console.log(`[voice-ws] Gemini Live session ended for call ${currentCallId}`);
        },
      });

      await geminiSession.start().catch((err) => {
        console.error(`[voice-ws] failed to start Gemini session:`, err.message);
      });

      activeSessions.set(currentCallId, { ws, geminiSession, startTime: callStartTime, transcript: transcriptChunks });
    }

    if (currentCallId) {
      await startBridge(currentCallId);
    }

    ws.on('message', async (data, isBinary) => {
      try {
        if (isBinary || Buffer.isBuffer(data)) {
          // Direct binary G.711 A-law audio from VoiceLink
          if (geminiSession) {
            geminiSession.sendUserAudio(data);
          }
        } else {
          // JSON control packet from VoiceLink (e.g. event=start, event=media)
          const str = data.toString('utf8');
          try {
            const parsed = JSON.parse(str);
            if (parsed.event === 'start' || parsed.type === 'start') {
              const callId = parsed.call_id || parsed.custom_id || currentCallId;
              if (callId && !geminiSession) {
                await startBridge(parseInt(callId, 10), parsed.agent_id);
              }
            } else if (parsed.event === 'media' && parsed.media?.payload) {
              const rawAlaw = Buffer.from(parsed.media.payload, 'base64');
              if (geminiSession) {
                geminiSession.sendUserAudio(rawAlaw);
              }
            }
          } catch (_) {
            // Raw text or non-json audio
          }
        }
      } catch (err) {
        console.error('[voice-ws] error handling audio message:', err.message);
      }
    });

    ws.on('close', async () => {
      console.log(`[voice-ws] VoiceLink connection closed for call ${currentCallId || 'unknown'}`);
      if (geminiSession) {
        geminiSession.stop();
      }

      if (currentCallId) {
        const durationSecs = Math.max(1, Math.round((Date.now() - callStartTime) / 1000));
        const finalTranscript = transcriptChunks.join('\n');

        await pool.query(
          `UPDATE coexistence.voice_calls SET
            status = 'completed',
            duration_seconds = $1,
            transcript = $2,
            ended_at = NOW(),
            updated_at = NOW()
          WHERE id = $3`,
          [durationSecs, finalTranscript || null, currentCallId]
        ).catch((err) => console.error('[voice-ws] failed to save call wrapup:', err.message));

        activeSessions.delete(currentCallId);
      }
    });

    ws.on('error', (err) => {
      console.error(`[voice-ws] WebSocket error:`, err.message);
    });
  });

  console.log('[voice-ws] VoiceLink WebSocket media server initialized on /api/voice/stream');
  return wss;
}

module.exports = {
  initVoiceWebsocketServer,
  activeSessions,
};
