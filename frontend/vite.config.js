import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getMockResponse, updateMockMessage } from './src/mockApi.js';
import * as driveStore from './server/driveStorage.js';
import * as r2Store from './server/r2Storage.js';

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { resolve({}); }
    });
  });
}

// Shape a stored file the way the Media Library page renders a row.
function toLibraryItem(r) {
  return {
    id: r.id,
    name: r.caption || r.fileName,
    originalName: r.fileName,
    mimeType: r.mimeType,
    mediaType: r.kind,
    type: r.kind,
    sizeBytes: r.sizeBytes,
    size: r.sizeBytes,
    createdAt: r.receivedAt,
    source: 'whatsapp_inbound',
    contactNumber: r.contactNumber,
    contactName: r.contactName,
    caption: r.caption,
    previewUrl: `/api/media/${encodeURIComponent(r.messageId)}`,
    url: `/api/media/${encodeURIComponent(r.messageId)}`,
    driveStatus: r.driveStatus,
    driveLink: r.driveLink,
    driveError: r.driveError || null,
    syncs: [],
    autoResync: false,
  };
}

// Google Drive storage + stored media. Returns true when the request was handled.
async function handleStorageRoutes(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  if (p === '/api/storage/r2/status' && req.method === 'GET') {
    sendJson(res, 200, await r2Store.testConnection());
    return true;
  }
  if (p === '/api/storage/r2/test' && req.method === 'POST') {
    const testKey = `test/r2-check-${Date.now()}.txt`;
    const testBuf = Buffer.from(`Cloudflare R2 verification at ${new Date().toISOString()}`);
    try {
      const up = await r2Store.uploadObject(testKey, testBuf, 'text/plain');
      sendJson(res, 200, { ok: true, message: 'Uploaded and verified with Cloudflare R2!', details: up });
    } catch (e) {
      sendJson(res, 500, { ok: false, error: e.message });
    }
    return true;
  }

  if (p === '/api/storage/drive/status' && req.method === 'GET') {
    sendJson(res, 200, await driveStore.status(req));
    return true;
  }
  if (p === '/api/storage/drive/config' && req.method === 'POST') {
    const body = await readBody(req);
    if (!String(body.clientId || '').trim()) { sendJson(res, 400, { error: 'Client ID is required' }); return true; }
    driveStore.saveClientConfig(body);
    sendJson(res, 200, await driveStore.status(req));
    return true;
  }
  if (p === '/api/storage/drive/connect' && req.method === 'GET') {
    try {
      res.writeHead(302, { Location: driveStore.buildAuthUrl(req) });
      res.end();
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<p style="font-family:sans-serif">${err.message}</p>`);
    }
    return true;
  }
  if (p === '/api/storage/drive/callback' && req.method === 'GET') {
    const code = url.searchParams.get('code');
    const oauthErr = url.searchParams.get('error');
    let payload;
    try {
      if (oauthErr) throw new Error(oauthErr === 'access_denied' ? 'Access was denied.' : oauthErr);
      const r = await driveStore.handleCallback(req, code);
      payload = { type: 'zerolens:drive:connected', email: r.email };
    } catch (err) {
      payload = { type: 'zerolens:drive:error', error: err.message };
    }
    const ok = payload.type.endsWith('connected');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><html><body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0">
<div style="text-align:center"><div style="font-size:42px">${ok ? '✅' : '⚠️'}</div>
<h2>${ok ? 'Google Drive connected' : 'Connection failed'}</h2>
<p style="color:#94a3b8">${ok ? (payload.email || '') : String(payload.error).replace(/</g, '&lt;')}</p>
<p style="color:#64748b;font-size:13px">You can close this window.</p></div>
<script>try{window.opener&&window.opener.postMessage(${JSON.stringify(payload)}, window.location.origin)}catch(e){}${ok ? 'setTimeout(()=>window.close(),1500)' : ''}</script>
</body></html>`);
    return true;
  }
  if (p === '/api/storage/drive/disconnect' && req.method === 'POST') {
    driveStore.disconnect();
    sendJson(res, 200, await driveStore.status(req));
    return true;
  }
  if (p === '/api/storage/drive/sync' && req.method === 'POST') {
    try {
      const r = await driveStore.syncPending();
      sendJson(res, 200, { ...r, status: await driveStore.status(req) });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  // Stored inbound media: list + delete for the Media Library.
  if (p === '/api/media-library' && req.method === 'GET') {
    sendJson(res, 200, { media: driveStore.listMedia().map(toLibraryItem) });
    return true;
  }
  const delMatch = p.match(/^\/api\/media-library\/([^/]+)$/);
  if (delMatch && req.method === 'DELETE') {
    sendJson(res, 200, { ok: driveStore.deleteMedia(decodeURIComponent(delMatch[1])) });
    return true;
  }

  // The file itself, for <img>/<audio>/<video> in Chats and the Media Library.
  const mediaMatch = p.match(/^\/api\/media\/([^/]+)$/);
  if (mediaMatch && req.method === 'GET') {
    const row = driveStore.findMedia(decodeURIComponent(mediaMatch[1]));
    const file = driveStore.localPathFor(row);
    if (!row || !file || !fs.existsSync(file)) {
      sendJson(res, 404, { error: 'Media not found' });
      return true;
    }
    const stat = fs.statSync(file);
    res.writeHead(200, {
      'Content-Type': row.mimeType,
      'Content-Length': stat.size,
      'Cache-Control': 'private, max-age=86400',
      'Content-Disposition': `inline; filename="${row.fileName}"`,
    });
    fs.createReadStream(file).pipe(res);
    return true;
  }
  return false;
}

let vertexTokenCache = null;
let vertexTokenExpiresAt = 0;

function loadGcpServiceAccount() {
  const rootPath = path.resolve(process.cwd(), '..');
  const candidates = [
    path.resolve(rootPath, 'gcp-service-account.json'),
    path.resolve(process.cwd(), 'gcp-service-account.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch {}
    }
  }
  return null;
}

async function getVertexToken() {
  const now = Math.floor(Date.now() / 1000);
  if (vertexTokenCache && vertexTokenExpiresAt > now + 60) {
    return vertexTokenCache;
  }
  const sa = loadGcpServiceAccount();
  if (!sa) throw new Error('gcp-service-account.json not found');

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claimSet = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claimSet}`);
  const jwt = `${header}.${claimSet}.${sign.sign(sa.private_key, 'base64url')}`;
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
            vertexTokenCache = json.access_token;
            vertexTokenExpiresAt = now + (json.expires_in || 3600);
            resolve(vertexTokenCache);
          } else {
            reject(new Error(body));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function callVertexAiGemini({ model = 'gemini-2.5-flash', contents, systemInstruction }) {
  const sa = loadGcpServiceAccount();
  const projectId = sa?.project_id || 'project-c0b5ea74-5ba2-4e68-8ab';
  const location = 'us-central1';
  const token = await getVertexToken();

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const payload = {
    contents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 800,
    },
  };

  const bodyStr = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`Vertex AI HTTP ${res.statusCode}: ${body}`));
            return;
          }
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve({ text, raw: json });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function mockApiPlugin() {
  return {
    name: 'mock-api-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/api')) {
          return next();
        }

        if (req.url.startsWith('/api/storage/') || req.url.startsWith('/api/media')) {
          handleStorageRoutes(req, res)
            .then(handled => { if (!handled) proceed(); })
            .catch(err => { if (!res.headersSent) sendJson(res, 500, { error: err.message }); });
          return;
        }
        proceed();

        function proceed() {

        // Server-Sent Events (SSE) support for Chats / real-time updates
        if (req.url.startsWith('/api/events')) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write(': connected\n\n');
          const interval = setInterval(() => {
            try { res.write(': keepalive\n\n'); } catch { clearInterval(interval); }
          }, 15000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        // Meta WhatsApp Webhook Verification Handshake & Inbound Receiver
        if (req.url.startsWith('/api/webhook/whatsapp') || req.url.startsWith('/api/webhook')) {
          if (req.method === 'GET') {
            const parsed = new URL(req.url, 'http://localhost');
            const mode = parsed.searchParams.get('hub.mode');
            const challenge = parsed.searchParams.get('hub.challenge');
            if (mode === 'subscribe' && challenge) {
              res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(challenge);
              return;
            }
          }
          if (req.method === 'POST') {
            const chunks = [];
            req.on('data', (c) => chunks.push(c));
            req.on('end', async () => {
              let bodyObj = null;
              try {
                const raw = Buffer.concat(chunks).toString('utf8');
                if (raw) bodyObj = JSON.parse(raw);
              } catch {}

              // 1. Acknowledge Meta webhook immediately
              if (!res.headersSent) {
                res.writeHead(200, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                res.end(JSON.stringify({ status: 'ok' }));
              }

              // 2. Process multi-turn AI response
              try {
                const entries = bodyObj?.entry || [];
                for (const ent of entries) {
                  for (const change of (ent?.changes || [])) {
                    const val = change?.value;
                    if (val?.messages) {
                      for (const m of val.messages) {
                        const from = String(m.from || '').replace(/\D/g, '');
                        const text = (m.text?.body || m.image?.caption || m.video?.caption || (m.type === 'interactive' ? m.interactive?.button_reply?.title : '') || '').trim();
                        const hasMedia = !!(m.image || m.audio || m.voice || m.video || m.document);
                        if (!from || (!text && !hasMedia)) continue;

                        const profileName = val.contacts?.find((c) => c.wa_id === from)?.profile?.name || `Customer`;
                        const displayMsg = text || (m.image ? (m.image.caption ? `📷 ${m.image.caption}` : '📷 [Customer sent an Image]') : (m.audio || m.voice ? '🎤 [Customer sent a Voice Note]' : (m.video ? '🎥 [Video]' : '📎 [Attachment]')));
                        
                        // 1. Record incoming customer message in history
                        getMockResponse('/webhook/whatsapp', 'POST', bodyObj);

                        // 2. Auto-sync and update Lead Record in CRM
                        if (globalThis.__mockLeads) {
                          let lead = globalThis.__mockLeads.find(l => l.phone === from || l.whatsapp_number === from);
                          if (!lead) {
                            lead = {
                              id: Date.now(),
                              name: profileName || `Customer +${from}`,
                              phone: from,
                              whatsapp_number: from,
                              email: '',
                              profession: 'Business Owner',
                              city: '',
                              stage: 'new',
                              source: 'WhatsApp Inbound',
                              created_at: new Date().toISOString(),
                              last_activity_at: new Date().toISOString(),
                              tags: ['WhatsApp Inbound', 'Live Lead'],
                              custom_fields: {},
                            };
                            globalThis.__mockLeads.unshift(lead);
                          }

                          lead.last_activity_at = new Date().toISOString();
                          if (profileName && (!lead.name || lead.name.startsWith('Customer +') || lead.name.startsWith('Client +'))) {
                            lead.name = profileName;
                          }

                          // Auto-detect email if customer typed it
                          const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                          if (emailMatch) {
                            lead.email = emailMatch[0];
                          }

                          // Advance pipeline stage dynamically
                          const lower = (text + ' ' + displayMsg).toLowerCase();
                          if (lower.includes('appointment') || lower.includes('book') || lower.includes('demo') || lower.includes('pm') || lower.includes('am') || lower.includes('slot')) {
                            lead.stage = 'hot';
                            if (!lead.tags.includes('Appointment Booked')) lead.tags.push('Appointment Booked');
                          } else if (lower.includes('clinic') || lower.includes('business') || lower.includes('cost') || lower.includes('price') || lower.includes('plan')) {
                            if (lead.stage === 'new' || lead.stage === 'contacted') lead.stage = 'engaged';
                          } else if (lead.stage === 'new') {
                            lead.stage = 'contacted';
                          }
                        }

                        // 3. Load active AI Agent configuration & Knowledge Base grounding
                        const agentsList = getMockResponse('/agents');
                        const activeAgent = Array.isArray(agentsList) 
                          ? (agentsList.find(a => a.isActive || a.is_active) || agentsList[0]) 
                          : null;

                        const modelToUse = activeAgent?.llmModel || 'gemini-2.5-flash';
                        const memoryLimit = Number(activeAgent?.contextWindowMessages || activeAgent?.context_window_messages || 20);
                        const baseSystemPrompt = activeAgent?.systemPrompt || activeAgent?.system_prompt || `You are the intelligent WhatsApp AI Assistant for Zerolens AI Studio (Connects AI).`;

                        // Load all active Knowledge Base documents (FAQs, links, pricing, studio facts)
                        const kbDocs = getMockResponse('/knowledge-bases');
                        let kbContext = '';
                        if (Array.isArray(kbDocs) && kbDocs.length > 0) {
                          kbContext = '\n\n=== VERIFIED KNOWLEDGE BASE & STUDIO GROUNDING FACTS ===\n' +
                            kbDocs.filter(d => d.is_active !== false).map(d => `--- ${d.title.toUpperCase()} ---\n${d.content}`).join('\n\n') +
                            '\n=== END OF KNOWLEDGE BASE ===';
                        }

                        // 4. Load complete conversation history respecting agent's configured limit
                        const existingData = getMockResponse(`/messages?contactNumber=${from}`);
                        const rawHistory = (existingData?.messages || []).slice(-memoryLimit);

                        // 5. Build cleanly alternating multi-turn contents for Vertex AI
                        const contents = [];
                        for (const msg of rawHistory) {
                          const isUser = msg.direction === 'incoming' || msg.direction === 'inbound';
                          const role = isUser ? 'user' : 'model';
                          const textPart = (msg.message_body || msg.text || '').trim();
                          if (!textPart) continue;

                          if (contents.length > 0 && contents[contents.length - 1].role === role) {
                            contents[contents.length - 1].parts[0].text += `\n${textPart}`;
                          } else {
                            contents.push({
                              role,
                              parts: [{ text: textPart }],
                            });
                          }
                        }

                        // Handle incoming Multimodal Media (Voice Note Audio & Images)
                        const userParts = [];
                        if (text) {
                          userParts.push({ text });
                        } else if (m.image) {
                          userParts.push({ text: 'Customer sent an image. Please inspect the visual in detail and reply helpfully and accurately.' });
                        } else if (m.audio || m.voice) {
                          userParts.push({ text: 'Customer sent a voice note. Please listen to their question and reply helpfully and accurately.' });
                        } else {
                          userParts.push({ text: 'Hello' });
                        }

                        const token = 'EAAkCURx3dQEBSqy41a0XbvLNGKQNwZBabHEZAn5I5mhMS6iJ7D48P0AKJ9yr6VvW6hIWdYHnFWUtK0cHNxUtNViApMK5SAJAB4pFyn96hnHuKMZC4LTivLKXxoFuMrdi6quDf2ND1NcB5UwBNBSrvGULCrvlcfwyrPdiOBs8t7ncsp85VeEMlaB3amCewZDZD';
                        const phoneId = '1299345543269323';

                        const mediaObj = m.image || m.audio || m.voice || m.video || m.document;
                        if (mediaObj?.id) {
                          try {
                            const metaMediaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaObj.id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            const mediaMeta = await metaMediaRes.json();
                            if (mediaMeta.url) {
                              const binRes = await fetch(mediaMeta.url, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              const arrBuf = await binRes.arrayBuffer();
                              const base64 = Buffer.from(arrBuf).toString('base64');
                              let mimeType = mediaMeta.mime_type || (m.image ? 'image/jpeg' : (m.audio || m.voice ? 'audio/ogg' : 'application/octet-stream'));
                              if (mimeType.includes(';')) {
                                mimeType = mimeType.split(';')[0].trim();
                              }
                              userParts.push({
                                inlineData: {
                                  mimeType,
                                  data: base64
                                }
                              });
                              console.log(`[Multimodal Ingest]: Loaded ${mimeType} (${arrBuf.byteLength} bytes) for Vertex AI Gemini.`);

                              // Archive to Cloudflare R2
                              const ext = mimeType.includes('png') ? 'png' : (mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : (mimeType.includes('ogg') ? 'ogg' : (mimeType.includes('mp4') ? 'mp4' : (mimeType.includes('pdf') ? 'pdf' : 'bin'))));
                              const ym = new Date().toISOString().slice(0,7).replace('-','');
                              const r2Key = `media/inbound/${from}/${ym}/${m.id || Date.now()}.${ext}`;
                              r2Store.uploadObject(r2Key, Buffer.from(arrBuf), mimeType)
                                .then(res => console.log(`[Cloudflare R2]: Inbound media saved to ${res.key}`))
                                .catch(err => console.warn('[Cloudflare R2 Upload Error]:', err.message));
                            }
                          } catch (mediaErr) {
                            console.warn('[Multimodal Media Fetch Error]:', mediaErr);
                          }
                        }

                        // Ensure last turn is user with all text + media parts
                        if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
                          contents.push({
                            role: 'user',
                            parts: userParts,
                          });
                        } else {
                          contents[contents.length - 1].parts = userParts;
                        }

                        const systemInstruction = `${baseSystemPrompt}${kbContext}

CUSTOMER CONTEXT:
• Customer Name: ${profileName}
• Customer Phone: +${from}

STRICT APPOINTMENT BOOKING, MULTIMODAL & LINKS INSTRUCTIONS:
1. Ground all answers strictly in the Verified Knowledge Base above (services, packages, pricing, booking rules). Zero hallucinations.
2. Official Zerolens AI Studio Links (Always use these exact URLs when links are requested):
   - Official Website: https://zerolens.ai
   - Direct Appointment Booking: https://zerolens.ai/book-demo
   - Instagram: https://instagram.com/zerolens.ai
   - Support WhatsApp: +91 86603 95136
3. Multimodal Voice & Visual Handling:
   - If the customer sends a Voice Note, understand their voice query and reply naturally and clearly.
   - If the customer sends an Image / Photo, inspect the image carefully, describe or acknowledge what is visible, and answer in the context of Zerolens AI Studio services.
4. Appointment Booking Flow:
   - Proactively ask what service or consultation they need (Dental/Medical Clinic, Ecommerce, Real Estate, Video Production, WhatsApp Automation).
   - Propose or confirm available consultation slots (Mon-Sat, 9:00 AM - 7:00 PM IST).
   - Direct them to https://zerolens.ai/book-demo for instant calendar booking if preferred.
5. Tone: Warm, helpful, professional, and concise (1-3 short paragraphs or bullet points). Use emojis tastefully.`;

                        // 6. Call Google Cloud Vertex AI with Agent Model
                        const aiRes = await callVertexAiGemini({
                          model: modelToUse,
                          contents,
                          systemInstruction,
                        });

                        const replyText = (aiRes.text || '').trim() || `Got it, ${profileName}! How else can I assist you with Zerolens AI Studio today?`;

                        // 7. Send reply to customer on WhatsApp via Meta Cloud API
                        const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            messaging_product: 'whatsapp',
                            recipient_type: 'individual',
                            to: from,
                            type: 'text',
                            text: { body: replyText },
                          }),
                        });
                        const metaJson = await metaRes.json();
                        console.log(`[Vertex AI 2-Way Reply to ${from}]:`, replyText, 'Meta ID:', metaJson?.messages?.[0]?.id);

                        // 6. Record outbound AI reply in conversation history
                        const messagesRes = getMockResponse(`/messages?contactNumber=${from}`);
                        if (messagesRes?.messages) {
                          messagesRes.messages.push({
                            id: Date.now(),
                            message_id: metaJson?.messages?.[0]?.id || `wamid.out_${Date.now()}`,
                            direction: 'outgoing',
                            contact_number: from,
                            wa_number: '918660395136',
                            message_body: replyText,
                            message_type: 'text',
                            timestamp: new Date().toISOString(),
                            status: 'delivered',
                          });
                        }
                      }
                    }
                  }
                }
              } catch (aiErr) {
                console.error('[Vertex AI Inbound Error]:', aiErr);
              }
            });
            return;
          }
        }

        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          const bodyBuf = Buffer.concat(chunks);
          const headers = { ...req.headers };
          headers.host = '127.0.0.1:3010';
          if (bodyBuf.length > 0) {
            headers['content-length'] = bodyBuf.length;
          }

          // Try proxying to backend at port 3010
          const clientReq = http.request({
            hostname: '127.0.0.1',
            port: 3010,
            path: req.url,
            method: req.method,
            headers,
          }, (backendRes) => {
            res.writeHead(backendRes.statusCode, backendRes.headers);
            backendRes.pipe(res);
          });

          const respondWithMock = () => {
            let bodyObj = null;
            try {
              if (bodyBuf.length > 0) bodyObj = JSON.parse(bodyBuf.toString('utf8'));
            } catch {}
            // Backend offline: return mock preview data with 200 OK
            const data = getMockResponse(req.url, req.method, bodyObj);
            if (!res.headersSent) {
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true',
              });
              res.end(JSON.stringify(data));
            }
          };

          clientReq.setTimeout(6000, () => {
            try { clientReq.destroy(); } catch {}
            respondWithMock();
          });

          clientReq.on('error', (err) => {
            try { clientReq.destroy(); } catch {}
            respondWithMock();
          });

          if (bodyBuf.length > 0) {
            clientReq.write(bodyBuf);
          }
          clientReq.end();
        });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 8080,
  },
});
