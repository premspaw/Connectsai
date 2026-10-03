const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

let cachedToken = null;
let tokenExpiresAt = 0;

function loadServiceAccount() {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'gcp-service-account.json'),
    path.resolve(__dirname, '../../../gcp-service-account.json'),
    path.resolve(__dirname, '../../gcp-service-account.json'),
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        console.error('[vertex-ai] Failed to parse service account JSON at', p, e.message);
      }
    }
  }
  if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
    } catch {}
  }
  return null;
}

/**
 * Mint or return cached Google Cloud OAuth2 Access Token
 */
async function getVertexAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt > now + 60) {
    return cachedToken;
  }

  const sa = loadServiceAccount();
  if (!sa) {
    throw new Error('Google Cloud Service Account not found. Please ensure gcp-service-account.json exists.');
  }

  const iat = now;
  const exp = now + 3600;

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claimSet = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat,
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claimSet}`);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${header}.${claimSet}.${signature}`;

  const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;

  return new Promise((resolve, reject) => {
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.access_token) {
            cachedToken = json.access_token;
            tokenExpiresAt = now + (json.expires_in || 3600);
            resolve(cachedToken);
          } else {
            reject(new Error(`OAuth error: ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Generate content using Google Cloud Vertex AI Gemini Models
 */
async function generateVertexContent({
  model = 'gemini-3.5-flash-lite',
  contents = [],
  systemInstruction = null,
  temperature = 0.7,
  maxOutputTokens = 65535,
  tools = null,
  thinkingLevel = 'MINIMAL',
}) {
  const token = await getVertexAccessToken();
  const sa = loadServiceAccount();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || sa?.project_id || 'project-c0b5ea74-5ba2-4e68-8ab';
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  // Fallback to supported Vertex model names
  const vertexModel = model === 'gemini-3.5-flash-lite' ? 'gemini-2.5-flash' : model;

  const generationConfig = {
    temperature,
    maxOutputTokens: Math.min(maxOutputTokens, 8192),
  };

  if (thinkingLevel && thinkingLevel !== 'OFF' && (vertexModel.includes('thinking') || vertexModel.includes('gemini-2.5-pro'))) {
    generationConfig.thinkingConfig = {
      thinkingLevel,
    };
  }

  const payload = {
    contents,
    generationConfig,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    ],
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const postBody = JSON.stringify(payload);
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${vertexModel}:generateContent`;

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody),
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const candidate = json.candidates?.[0];
            const text = candidate?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n') || '';
            resolve({
              text,
              raw: json,
              usage: json.usageMetadata,
            });
          } else {
            reject(new Error(`Vertex AI error (${res.statusCode}): ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postBody);
    req.end();
  });
}

module.exports = {
  getVertexAccessToken,
  generateVertexContent,
  loadServiceAccount,
};
