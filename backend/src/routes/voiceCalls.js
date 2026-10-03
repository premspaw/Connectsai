const { Router } = require('express');
const pool = require('../db');
const voicelinkService = require('../services/voicelinkService');

const router = Router();
const publicRouter = Router();

async function ensureVoiceTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coexistence.voicelink_config (
      id SERIAL PRIMARY KEY,
      api_base_url TEXT NOT NULL DEFAULT 'https://app.voicelink.co.in/api',
      mode TEXT NOT NULL DEFAULT 'live',
      reseller_username TEXT,
      reseller_password_encrypted TEXT,
      access_token_encrypted TEXT,
      webhook_secret_encrypted TEXT,
      did_number TEXT,
      ws_base_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_tested_at TIMESTAMPTZ,
      last_test_error TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS coexistence.voice_agents (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      system_prompt TEXT NOT NULL,
      voice_name TEXT NOT NULL DEFAULT 'Aoede',
      gemini_model TEXT NOT NULL DEFAULT 'gemini-3.1-flash-live-preview',
      temperature NUMERIC NOT NULL DEFAULT 0.7,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS coexistence.voice_calls (
      id SERIAL PRIMARY KEY,
      voicelink_call_id TEXT,
      phone_number TEXT NOT NULL,
      did_number TEXT,
      contact_id BIGINT,
      lead_id BIGINT,
      agent_id INTEGER REFERENCES coexistence.voice_agents(id) ON DELETE SET NULL,
      direction TEXT NOT NULL DEFAULT 'outbound',
      status TEXT NOT NULL DEFAULT 'queued',
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      transcript TEXT,
      summary TEXT,
      recording_url TEXT,
      error_message TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS voice_calls_phone_idx ON coexistence.voice_calls(phone_number);
    CREATE INDEX IF NOT EXISTS voice_calls_status_idx ON coexistence.voice_calls(status);
    CREATE INDEX IF NOT EXISTS voice_calls_created_at_idx ON coexistence.voice_calls(created_at DESC);
  `);
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * GET /api/voice/config
 * Retrieves VoiceLink configuration
 */
router.get('/voice/config', adminOnly, async (req, res) => {
  try {
    const config = await voicelinkService.getConfig();
    // Do not leak raw password to frontend
    res.json({
      apiBaseUrl: config.apiBaseUrl,
      mode: config.mode,
      resellerUsername: config.resellerUsername,
      hasPassword: config.hasPassword,
      accessTokenMasked: config.accessTokenMasked,
      hasToken: Boolean(config.accessToken),
      webhookSecret: config.webhookSecret,
      didNumber: config.didNumber,
      wsBaseUrl: config.wsBaseUrl,
      isActive: config.isActive,
      lastTestedAt: config.lastTestedAt,
      lastTestError: config.lastTestError,
    });
  } catch (err) {
    console.error('[voice-routes] get config error:', err.message);
    res.status(500).json({ error: 'Failed to load VoiceLink settings' });
  }
});

/**
 * POST /api/voice/config
 * Saves VoiceLink settings (username, password, did, etc.)
 */
router.post('/voice/config', adminOnly, async (req, res) => {
  try {
    const updated = await voicelinkService.saveConfig(req.body);
    res.json({
      success: true,
      apiBaseUrl: updated.apiBaseUrl,
      mode: updated.mode,
      resellerUsername: updated.resellerUsername,
      hasPassword: updated.hasPassword,
      accessTokenMasked: updated.accessTokenMasked,
      hasToken: Boolean(updated.accessToken),
      webhookSecret: updated.webhookSecret,
      didNumber: updated.didNumber,
      wsBaseUrl: updated.wsBaseUrl,
      isActive: updated.isActive,
    });
  } catch (err) {
    console.error('[voice-routes] save config error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to save VoiceLink settings' });
  }
});

/**
 * POST /api/voice/test-login
 * Validates VoiceLink credentials and mints Bearer token
 */
router.post('/voice/test-login', adminOnly, async (req, res) => {
  try {
    const current = await voicelinkService.getConfig();
    const username = req.body?.username || current.resellerUsername;
    const password = req.body?.password || current.rawPassword;
    const apiBaseUrl = req.body?.apiBaseUrl || current.apiBaseUrl;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required to test login' });
    }

    const token = await voicelinkService.mintToken(username, password, apiBaseUrl);
    await pool.query(
      'UPDATE coexistence.voicelink_config SET last_tested_at = NOW(), last_test_error = NULL WHERE id = $1',
      [current.id || 1]
    ).catch(() => {});

    res.json({
      success: true,
      message: 'VoiceLink authentication successful! Token minted.',
      tokenMasked: token.slice(0, 10) + '...' + token.slice(-6),
    });
  } catch (err) {
    console.error('[voice-routes] test-login failed:', err.message);
    const current = await voicelinkService.getConfig();
    if (current.id) {
      await pool.query(
        'UPDATE coexistence.voicelink_config SET last_tested_at = NOW(), last_test_error = $1 WHERE id = $2',
        [err.message, current.id]
      ).catch(() => {});
    }
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/voice/agents
 * Lists voice agent personas
 */
router.get('/voice/agents', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM coexistence.voice_agents ORDER BY is_default DESC, name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[voice-routes] list agents error:', err.message);
    res.status(500).json({ error: 'Failed to load voice agents' });
  }
});

/**
 * POST /api/voice/agents
 * Creates or updates a voice agent persona
 */
router.post('/voice/agents', adminOnly, async (req, res) => {
  try {
    const { id, name, description, systemPrompt, voiceName, geminiModel, temperature, isDefault } = req.body;
    if (!name || !systemPrompt) {
      return res.status(400).json({ error: 'Name and System Prompt are required' });
    }

    if (isDefault) {
      await pool.query('UPDATE coexistence.voice_agents SET is_default = false');
    }

    if (id) {
      const { rows } = await pool.query(
        `UPDATE coexistence.voice_agents SET
          name = $1, description = $2, system_prompt = $3, voice_name = $4,
          gemini_model = $5, temperature = $6, is_default = $7, updated_at = NOW()
        WHERE id = $8 RETURNING *`,
        [name, description, systemPrompt, voiceName || 'Aoede', geminiModel || 'gemini-3.1-flash-live-preview', temperature || 0.7, Boolean(isDefault), id]
      );
      return res.json(rows[0]);
    } else {
      const { rows } = await pool.query(
        `INSERT INTO coexistence.voice_agents (
          name, description, system_prompt, voice_name, gemini_model, temperature, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, description, systemPrompt, voiceName || 'Aoede', geminiModel || 'gemini-3.1-flash-live-preview', temperature || 0.7, Boolean(isDefault)]
      );
      return res.json(rows[0]);
    }
  } catch (err) {
    console.error('[voice-routes] save agent error:', err.message);
    res.status(500).json({ error: 'Failed to save voice agent' });
  }
});

/**
 * POST /api/voice/dial
 * Places an outbound AI phone call to any lead or contact
 */
router.post('/voice/dial', async (req, res) => {
  try {
    const { phoneNumber, didNumber, agentId, contactId, leadId, metadata } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await voicelinkService.placeOutboundCall({
      phoneNumber,
      didNumber,
      agentId: agentId ? parseInt(agentId, 10) : undefined,
      contactId: contactId ? parseInt(contactId, 10) : undefined,
      leadId: leadId ? parseInt(leadId, 10) : undefined,
      metadata: metadata || {},
    });

    res.json(result);
  } catch (err) {
    console.error('[voice-routes] dial error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to place call' });
  }
});

/**
 * GET /api/voice/calls
 * Lists call history & logs
 */
router.get('/voice/calls', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
    const offset = parseInt(req.query.offset || '0', 10);
    const phone = req.query.phone ? `%${req.query.phone}%` : null;

    const { rows } = await pool.query(
      `SELECT c.*, a.name as agent_name, a.voice_name
       FROM coexistence.voice_calls c
       LEFT JOIN coexistence.voice_agents a ON a.id = c.agent_id
       WHERE ($1::text IS NULL OR c.phone_number ILIKE $1)
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [phone, limit, offset]
    );

    res.json({ calls: rows });
  } catch (err) {
    console.error('[voice-routes] list calls error:', err.message);
    res.status(500).json({ error: 'Failed to load call history' });
  }
});

/**
 * GET /api/voice/calls/:id
 * Fetches single call details & transcript
 */
router.get('/voice/calls/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, a.name as agent_name, a.voice_name, a.system_prompt
       FROM coexistence.voice_calls c
       LEFT JOIN coexistence.voice_agents a ON a.id = c.agent_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Call not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[voice-routes] get call error:', err.message);
    res.status(500).json({ error: 'Failed to fetch call details' });
  }
});

/**
 * POST /api/voice/webhook
 * Public webhook receiver for VoiceLink call lifecycle events
 */
publicRouter.post('/voice/webhook', async (req, res) => {
  try {
    const payload = req.body || {};
    const event = payload.event || payload.type;
    const callId = payload.custom_id || payload.call_id;

    console.log(`[voice-webhook] received event: ${event} for call: ${callId}`);

    if (callId) {
      if (event === 'call.answered' || event === 'answered') {
        await pool.query(
          "UPDATE coexistence.voice_calls SET status = 'in-progress', started_at = COALESCE(started_at, NOW()), updated_at = NOW() WHERE id = $1 OR voicelink_call_id = $2",
          [parseInt(callId, 10) || 0, String(callId)]
        ).catch(() => {});
      } else if (event === 'call.ended' || event === 'call.completed' || event === 'hangup') {
        const duration = parseInt(payload.duration || '0', 10);
        await pool.query(
          "UPDATE coexistence.voice_calls SET status = 'completed', duration_seconds = COALESCE(NULLIF($1, 0), duration_seconds), ended_at = NOW(), recording_url = $2, updated_at = NOW() WHERE id = $3 OR voicelink_call_id = $4",
          [duration, payload.recording_url || null, parseInt(callId, 10) || 0, String(callId)]
        ).catch(() => {});
      } else if (event === 'call.failed' || event === 'busy' || event === 'no-answer') {
        await pool.query(
          "UPDATE coexistence.voice_calls SET status = $1, error_message = $2, ended_at = NOW(), updated_at = NOW() WHERE id = $3 OR voicelink_call_id = $4",
          [event === 'busy' ? 'busy' : event === 'no-answer' ? 'no-answer' : 'failed', payload.reason || payload.error || null, parseInt(callId, 10) || 0, String(callId)]
        ).catch(() => {});
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[voice-webhook] error:', err.message);
    res.status(200).json({ received: false, error: err.message });
  }
});

module.exports = {
  router,
  publicRouter,
  ensureVoiceTables,
};
