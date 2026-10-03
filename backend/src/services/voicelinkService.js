const pool = require('../db');
const { encrypt, decrypt, maskSecret } = require('../util/crypto');

/**
 * Service managing VoiceLink Telephony API integration:
 * - Authentication & Token Minting (POST /v1/auth/login)
 * - Bot provisioning & DID Routing
 * - Outbound call initiation
 */

async function getConfig() {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM coexistence.voicelink_config ORDER BY id DESC LIMIT 1'
    );
    const row = rows[0] || {};
    const envToken = process.env.VOICELINK_RESELLER_TOKEN || '';
    const dbToken = row.access_token_encrypted ? decrypt(row.access_token_encrypted) : '';
    const token = dbToken || envToken;

    const envUser = process.env.VOICELINK_RESELLER_USERNAME || '';
    const envPass = process.env.VOICELINK_RESELLER_PASSWORD || '';
    const dbPass = row.reseller_password_encrypted ? decrypt(row.reseller_password_encrypted) : '';

    return {
      id: row.id || null,
      apiBaseUrl: row.api_base_url || process.env.VOICELINK_API_BASE || 'https://app.voicelink.co.in/api',
      mode: row.mode || process.env.VOICELINK_MODE || 'live',
      resellerUsername: row.reseller_username || envUser,
      hasPassword: Boolean(dbPass || envPass),
      accessToken: token,
      accessTokenMasked: token ? maskSecret(token) : '',
      webhookSecret: row.webhook_secret_encrypted ? decrypt(row.webhook_secret_encrypted) : (process.env.VOICELINK_WEBHOOK_SECRET || ''),
      didNumber: row.did_number || process.env.VOICELINK_DEFAULT_DID || '',
      wsBaseUrl: row.ws_base_url || process.env.WS_BASE_URL || '',
      isActive: row.is_active ?? true,
      lastTestedAt: row.last_tested_at || null,
      lastTestError: row.last_test_error || null,
      rawPassword: dbPass || envPass,
    };
  } catch (err) {
    console.error('[voicelink] getConfig error:', err.message);
    return {
      apiBaseUrl: process.env.VOICELINK_API_BASE || 'https://app.voicelink.co.in/api',
      mode: process.env.VOICELINK_MODE || 'live',
      resellerUsername: process.env.VOICELINK_RESELLER_USERNAME || '',
      accessToken: process.env.VOICELINK_RESELLER_TOKEN || '',
      accessTokenMasked: maskSecret(process.env.VOICELINK_RESELLER_TOKEN || ''),
      wsBaseUrl: process.env.WS_BASE_URL || '',
      didNumber: process.env.VOICELINK_DEFAULT_DID || '',
      rawPassword: process.env.VOICELINK_RESELLER_PASSWORD || '',
      isActive: true,
    };
  }
}

async function saveConfig(data) {
  const current = await getConfig();
  const apiBaseUrl = (data.apiBaseUrl || current.apiBaseUrl || 'https://app.voicelink.co.in/api').replace(/\/+$/, '');
  const mode = data.mode || current.mode || 'live';
  const resellerUsername = data.resellerUsername !== undefined ? data.resellerUsername : current.resellerUsername;
  const rawPass = data.resellerPassword !== undefined ? data.resellerPassword : current.rawPassword;
  const rawToken = data.accessToken !== undefined ? data.accessToken : current.accessToken;
  const rawSecret = data.webhookSecret !== undefined ? data.webhookSecret : current.webhookSecret;
  const didNumber = data.didNumber !== undefined ? data.didNumber : current.didNumber;
  const wsBaseUrl = data.wsBaseUrl !== undefined ? data.wsBaseUrl : current.wsBaseUrl;
  const isActive = data.isActive !== undefined ? Boolean(data.isActive) : current.isActive;

  const passEnc = rawPass ? encrypt(rawPass) : null;
  const tokenEnc = rawToken ? encrypt(rawToken) : null;
  const secretEnc = rawSecret ? encrypt(rawSecret) : null;

  await pool.query(
    `INSERT INTO coexistence.voicelink_config (
      id, api_base_url, mode, reseller_username, reseller_password_encrypted,
      access_token_encrypted, webhook_secret_encrypted, did_number, ws_base_url, is_active, updated_at
    ) VALUES (
      COALESCE((SELECT id FROM coexistence.voicelink_config ORDER BY id DESC LIMIT 1), 1),
      $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      api_base_url = EXCLUDED.api_base_url,
      mode = EXCLUDED.mode,
      reseller_username = EXCLUDED.reseller_username,
      reseller_password_encrypted = COALESCE(EXCLUDED.reseller_password_encrypted, coexistence.voicelink_config.reseller_password_encrypted),
      access_token_encrypted = COALESCE(EXCLUDED.access_token_encrypted, coexistence.voicelink_config.access_token_encrypted),
      webhook_secret_encrypted = COALESCE(EXCLUDED.webhook_secret_encrypted, coexistence.voicelink_config.webhook_secret_encrypted),
      did_number = EXCLUDED.did_number,
      ws_base_url = EXCLUDED.ws_base_url,
      is_active = EXCLUDED.is_active,
      updated_at = NOW()
    RETURNING *`,
    [apiBaseUrl, mode, resellerUsername, passEnc, tokenEnc, secretEnc, didNumber, wsBaseUrl, isActive]
  );

  return getConfig();
}

/**
 * Mints an access_token from VoiceLink by calling POST /v1/auth/login
 */
async function mintToken(username, password, apiBaseUrl = 'https://app.voicelink.co.in/api') {
  if (!username || !password) {
    throw new Error('Username and password are required to mint VoiceLink token');
  }
  const cleanBase = apiBaseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/v1/auth/login`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const body = await resp.json().catch(() => ({}));
  if (!resp.ok || !body.data?.access_token) {
    const errMsg = body.message || body.error || `VoiceLink login failed (HTTP ${resp.status})`;
    throw new Error(errMsg);
  }

  const token = body.data.access_token;
  // Save token back to database
  await saveConfig({ accessToken: token });
  return token;
}

/**
 * Gets a valid VoiceLink token (uses stored token or auto-mints from username/pass)
 */
async function getValidToken() {
  const config = await getConfig();
  if (config.accessToken) {
    return { token: config.accessToken, config };
  }
  if (config.resellerUsername && config.rawPassword) {
    const minted = await mintToken(config.resellerUsername, config.rawPassword, config.apiBaseUrl);
    return { token: minted, config };
  }
  throw new Error('VoiceLink is not configured. Please set Username & Password or Access Token in Voice Calling Settings.');
}

/**
 * Initiates an outbound voice call via VoiceLink
 */
async function placeOutboundCall({ phoneNumber, didNumber, agentId, contactId, leadId, metadata = {} }) {
  const { token, config } = await getValidToken();
  const cleanBase = config.apiBaseUrl.replace(/\/+$/, '');

  // Format phone number: digits only (national + country code, e.g. 919307512816 or 9307512816)
  const cleanPhone = String(phoneNumber).replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    throw new Error('Invalid phone number (must have at least 10 digits)');
  }

  const outgoingDid = didNumber || config.didNumber || undefined;

  // Insert initial call record in database
  const { rows } = await pool.query(
    `INSERT INTO coexistence.voice_calls (
      phone_number, did_number, agent_id, contact_id, lead_id, direction, status, metadata, started_at
    ) VALUES ($1, $2, $3, $4, $5, 'outbound', 'dialing', $6, NOW())
    RETURNING *`,
    [cleanPhone, outgoingDid, agentId || null, contactId || null, leadId || null, JSON.stringify(metadata)]
  );
  const callRecord = rows[0];

  try {
    const dialPayload = {
      to: cleanPhone,
      from: outgoingDid,
      caller_id: outgoingDid,
      custom_id: String(callRecord.id),
      webhook_url: `${config.wsBaseUrl || ''}/api/voice/webhook`,
    };

    const resp = await fetch(`${cleanBase}/v1/calls/outbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(dialPayload),
    });

    const resData = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const errTxt = resData.message || resData.error || `VoiceLink dial failed with HTTP ${resp.status}`;
      await pool.query(
        'UPDATE coexistence.voice_calls SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        ['failed', errTxt, callRecord.id]
      );
      throw new Error(errTxt);
    }

    const voicelinkCallId = resData.data?.call_id || resData.call_id || resData.id || `vl-${Date.now()}`;
    await pool.query(
      'UPDATE coexistence.voice_calls SET voicelink_call_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [voicelinkCallId, 'ringing', callRecord.id]
    );

    return {
      success: true,
      callId: callRecord.id,
      voicelinkCallId,
      status: 'ringing',
      phoneNumber: cleanPhone,
    };
  } catch (err) {
    console.error('[voicelink] placeOutboundCall error:', err.message);
    await pool.query(
      'UPDATE coexistence.voice_calls SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
      ['failed', err.message, callRecord.id]
    );
    throw err;
  }
}

module.exports = {
  getConfig,
  saveConfig,
  mintToken,
  getValidToken,
  placeOutboundCall,
};
