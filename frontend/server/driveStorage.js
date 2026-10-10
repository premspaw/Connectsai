// Media storage for incoming WhatsApp media (voice notes, images, video, documents).
//
// Every file is ALWAYS written to a local archive first (.data/media), so a
// message is never lost while Google Drive is disconnected, misconfigured or
// slow. When Drive is connected the file is mirrored into a "Zerolens WhatsApp
// Media" folder in the connected user's own Drive (15 GB free tier), and any
// files received while disconnected are uploaded on the next connect / sync.
//
// OAuth scope is `drive.file`: the app can only see files IT created, never the
// rest of the user's Drive.
//
// Persistence (all under frontend/.data, which is git-ignored):
//   drive-config.json  OAuth client id/secret entered in the UI (or from ../.env)
//   drive-token.json   refresh token + connected account email + folder id
//   media-index.json   one row per stored file
//   media/<id>.<ext>   the local copy

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const CONFIG_FILE = path.join(DATA_DIR, 'drive-config.json');
const TOKEN_FILE = path.join(DATA_DIR, 'drive-token.json');
const INDEX_FILE = path.join(DATA_DIR, 'media-index.json');
const FOLDER_NAME = 'Zerolens WhatsApp Media';
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
];

function ensureDirs() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, data) {
  ensureDirs();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readEnvFile() {
  const out = {};
  for (const p of [path.resolve(process.cwd(), '..', '.env'), path.resolve(process.cwd(), '.env')]) {
    try {
      for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !(m[1] in out)) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    } catch { /* missing .env is fine */ }
  }
  return out;
}

// UI-entered credentials win over .env so they can be changed without a restart.
function getClientConfig() {
  const saved = readJson(CONFIG_FILE, {});
  const env = readEnvFile();
  return {
    clientId: saved.clientId || env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: saved.clientSecret || env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    source: saved.clientId ? 'settings' : (env.GOOGLE_OAUTH_CLIENT_ID ? 'env' : null),
  };
}

export function saveClientConfig({ clientId, clientSecret }) {
  const cur = readJson(CONFIG_FILE, {});
  writeJson(CONFIG_FILE, {
    clientId: String(clientId || '').trim(),
    // Blank secret on an edit means "keep the stored one".
    clientSecret: String(clientSecret || '').trim() || cur.clientSecret || '',
  });
}

// The redirect URI must match one registered on the OAuth client EXACTLY, so it
// is derived from how the browser reached us and shown in the UI to copy.
export function redirectUriFor(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:8080';
  const proto = req.headers['x-forwarded-proto'] || (/^(localhost|127\.)/.test(host) ? 'http' : 'https');
  return `${proto}://${host}/api/storage/drive/callback`;
}

/* ------------------------------ index ------------------------------ */

function loadIndex() { return readJson(INDEX_FILE, []); }
function saveIndex(rows) { writeJson(INDEX_FILE, rows); }

const EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/amr': 'amr',
  'video/mp4': 'mp4', 'video/3gpp': '3gp', 'application/pdf': 'pdf',
};

function kindOf(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

export function findMedia(messageOrId) {
  return loadIndex().find(r => r.messageId === messageOrId || r.id === messageOrId) || null;
}

export function localPathFor(row) {
  return row?.localFile ? path.join(MEDIA_DIR, row.localFile) : null;
}

export function listMedia() {
  return loadIndex().sort((a, b) => (b.receivedAt || '').localeCompare(a.receivedAt || ''));
}

/* ------------------------------ OAuth ------------------------------ */

export function buildAuthUrl(req) {
  const { clientId } = getClientConfig();
  if (!clientId) throw new Error('Google OAuth Client ID is not configured yet.');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUriFor(req),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // always return a refresh token, even on reconnect
    include_granted_scopes: 'true',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

let accessCache = { token: null, exp: 0 };

async function tokenRequest(form) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form).toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.error || `Token request failed (${res.status})`);
  return json;
}

export async function handleCallback(req, code) {
  const { clientId, clientSecret } = getClientConfig();
  const tok = await tokenRequest({
    code, client_id: clientId, client_secret: clientSecret,
    redirect_uri: redirectUriFor(req), grant_type: 'authorization_code',
  });
  if (!tok.refresh_token) throw new Error('Google did not return a refresh token. Remove the app at myaccount.google.com/permissions and connect again.');
  accessCache = { token: tok.access_token, exp: Date.now() + (tok.expires_in - 60) * 1000 };

  let email = '';
  try {
    const u = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${tok.access_token}` } });
    email = (await u.json()).email || '';
  } catch { /* email is cosmetic */ }

  writeJson(TOKEN_FILE, { refreshToken: tok.refresh_token, email, connectedAt: new Date().toISOString(), folderId: null });
  await ensureFolder();
  // Anything that arrived while disconnected goes up now (don't block the popup).
  syncPending().catch(err => console.warn('[Drive] sync after connect failed:', err.message));
  return { email };
}

async function getAccessToken() {
  if (accessCache.token && Date.now() < accessCache.exp) return accessCache.token;
  const saved = readJson(TOKEN_FILE, null);
  if (!saved?.refreshToken) return null;
  const { clientId, clientSecret } = getClientConfig();
  try {
    const tok = await tokenRequest({
      refresh_token: saved.refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token',
    });
    accessCache = { token: tok.access_token, exp: Date.now() + (tok.expires_in - 60) * 1000 };
    return tok.access_token;
  } catch (err) {
    // invalid_grant = revoked, or expired (OAuth apps in "Testing" expire refresh tokens after 7 days).
    writeJson(TOKEN_FILE, { ...saved, lastError: err.message, lastErrorAt: new Date().toISOString() });
    throw err;
  }
}

export function disconnect() {
  const saved = readJson(TOKEN_FILE, null);
  if (saved?.refreshToken) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(saved.refreshToken)}`, { method: 'POST' }).catch(() => {});
  }
  try { fs.unlinkSync(TOKEN_FILE); } catch { /* already gone */ }
  accessCache = { token: null, exp: 0 };
}

async function ensureFolder() {
  const saved = readJson(TOKEN_FILE, null);
  if (!saved) return null;
  const token = await getAccessToken();
  if (saved.folderId) {
    const chk = await fetch(`https://www.googleapis.com/drive/v3/files/${saved.folderId}?fields=id,trashed`, { headers: { Authorization: `Bearer ${token}` } });
    if (chk.ok && !(await chk.json()).trashed) return saved.folderId;
  }
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Could not create Drive folder');
  writeJson(TOKEN_FILE, { ...saved, folderId: json.id, folderLink: json.webViewLink });
  return json.id;
}

/* ------------------------------ upload ------------------------------ */

async function uploadToDrive(row) {
  const token = await getAccessToken();
  if (!token) return false;
  const folderId = await ensureFolder();
  const buf = fs.readFileSync(localPathFor(row));
  const boundary = `zl${Date.now().toString(36)}`;
  const meta = {
    name: row.fileName,
    parents: [folderId],
    description: `WhatsApp ${row.kind} from ${row.contactName || ''} +${row.contactNumber} at ${row.receivedAt}${row.caption ? ` — "${row.caption}"` : ''}`,
    appProperties: { messageId: row.messageId, contactNumber: row.contactNumber },
  };
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${row.mimeType}\r\n\r\n`),
    buf,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Drive upload failed (${res.status})`);
  updateRow(row.id, { driveFileId: json.id, driveLink: json.webViewLink, driveStatus: 'uploaded', driveError: null, uploadedAt: new Date().toISOString() });
  return true;
}

function updateRow(id, patch) {
  const rows = loadIndex();
  const i = rows.findIndex(r => r.id === id);
  if (i >= 0) { rows[i] = { ...rows[i], ...patch }; saveIndex(rows); return rows[i]; }
  return null;
}

let syncing = false;
export async function syncPending() {
  if (syncing || !isConnected()) return { uploaded: 0, failed: 0 };
  syncing = true;
  let uploaded = 0, failed = 0;
  try {
    for (const row of loadIndex().filter(r => r.driveStatus !== 'uploaded')) {
      try { if (await uploadToDrive(row)) uploaded++; }
      catch (err) { failed++; updateRow(row.id, { driveStatus: 'failed', driveError: err.message }); }
    }
  } finally { syncing = false; }
  return { uploaded, failed };
}

export function isConnected() {
  return !!readJson(TOKEN_FILE, null)?.refreshToken;
}

/**
 * Store one incoming WhatsApp media file. Always saved locally; mirrored to
 * Drive in the background when connected. Returns the index row.
 */
export function archiveIncomingMedia({ buffer, mimeType, messageId, contactNumber, contactName, caption }) {
  ensureDirs();
  const existing = findMedia(messageId);
  if (existing) return existing;

  const clean = String(mimeType || 'application/octet-stream').split(';')[0].trim();
  const kind = kindOf(clean);
  const ext = EXT[clean] || clean.split('/')[1] || 'bin';
  const id = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const row = {
    id,
    messageId,
    kind,
    mimeType: clean,
    sizeBytes: buffer.length,
    contactNumber,
    contactName: contactName || '',
    caption: caption || '',
    fileName: `${stamp}_${contactNumber}_${kind}.${ext}`,
    localFile: `${id}.${ext}`,
    receivedAt: new Date().toISOString(),
    driveStatus: isConnected() ? 'uploading' : 'pending',
    driveFileId: null,
    driveLink: null,
  };
  fs.writeFileSync(path.join(MEDIA_DIR, row.localFile), buffer);
  const rows = loadIndex();
  rows.push(row);
  saveIndex(rows);

  if (isConnected()) {
    uploadToDrive(row).catch(err => {
      console.warn('[Drive] upload failed:', err.message);
      updateRow(row.id, { driveStatus: 'failed', driveError: err.message });
    });
  }
  return row;
}

export function deleteMedia(id) {
  const rows = loadIndex();
  const row = rows.find(r => r.id === id);
  if (!row) return false;
  try { fs.unlinkSync(localPathFor(row)); } catch { /* gone */ }
  saveIndex(rows.filter(r => r.id !== id));
  // The Drive copy is intentionally kept — Drive is the long-term archive.
  return true;
}

export async function status(req) {
  const cfg = getClientConfig();
  const saved = readJson(TOKEN_FILE, null);
  const rows = loadIndex();
  return {
    configured: !!(cfg.clientId && cfg.clientSecret),
    clientId: cfg.clientId,
    hasSecret: !!cfg.clientSecret,
    configSource: cfg.source,
    connected: !!saved?.refreshToken,
    email: saved?.email || '',
    connectedAt: saved?.connectedAt || null,
    folderLink: saved?.folderLink || null,
    lastError: saved?.lastError || null,
    redirectUri: redirectUriFor(req),
    totals: {
      files: rows.length,
      bytes: rows.reduce((n, r) => n + (r.sizeBytes || 0), 0),
      uploaded: rows.filter(r => r.driveStatus === 'uploaded').length,
      pending: rows.filter(r => r.driveStatus === 'pending' || r.driveStatus === 'uploading').length,
      failed: rows.filter(r => r.driveStatus === 'failed').length,
    },
  };
}
