// Cloudflare R2 Storage Module (S3-compatible API with Zero Egress Fees)
// Handles Media Library, WhatsApp inbound/outbound audio & image archiving, and Knowledge Base attachments.

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadBucketCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';

function readEnv() {
  const out = {};
  const candidates = [
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
          const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
          if (m && !(m[1] in out)) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
      } catch {}
    }
  }
  return out;
}

const env = readEnv();

export const R2_CONFIG = {
  accountId: env.CLOUDFLARE_ACCOUNT_ID || 'd8945011e8c1b69f5204fd69b2bf12cf',
  accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID || 'ad3d7102c9b4a9fd2141779cec364038',
  secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '56d1eab4f23727d928fb46912cb9d9683785de8307f8df152888fb538e0a5d34',
  bucket: env.CLOUDFLARE_R2_BUCKET || 'connects-ai-media',
  publicDomain: env.CLOUDFLARE_R2_PUBLIC_DOMAIN || '',
  endpoint: env.CLOUDFLARE_R2_ENDPOINT || `https://${env.CLOUDFLARE_ACCOUNT_ID || 'd8945011e8c1b69f5204fd69b2bf12cf'}.r2.cloudflarestorage.com`,
};

let _s3 = null;
function getS3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto',
      endpoint: R2_CONFIG.endpoint,
      credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
      },
    });
  }
  return _s3;
}

/**
 * Test connection and return status info for UI and health dashboards
 */
export async function testConnection() {
  try {
    const s3 = getS3();
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucket,
      MaxKeys: 10,
    }));
    return {
      ok: true,
      connected: true,
      provider: 'Cloudflare R2',
      bucket: R2_CONFIG.bucket,
      accountId: R2_CONFIG.accountId.slice(0, 8) + '...',
      endpoint: R2_CONFIG.endpoint,
      egressCost: 'Free ($0.00)',
      objectCount: res.KeyCount || 0,
    };
  } catch (err) {
    return {
      ok: false,
      connected: false,
      provider: 'Cloudflare R2',
      bucket: R2_CONFIG.bucket,
      error: err.message,
    };
  }
}

/**
 * Upload a binary file / buffer to Cloudflare R2
 */
export async function uploadObject(key, buffer, mimeType = 'application/octet-stream') {
  const s3 = getS3();
  await s3.send(new PutObjectCommand({
    Bucket: R2_CONFIG.bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));
  return {
    key,
    bucket: R2_CONFIG.bucket,
    url: R2_CONFIG.publicDomain ? `${R2_CONFIG.publicDomain}/${key}` : `/api/media/${encodeURIComponent(key)}`,
  };
}

/**
 * Download / stream an object from Cloudflare R2
 */
export async function getObject(key) {
  const s3 = getS3();
  const res = await s3.send(new GetObjectCommand({
    Bucket: R2_CONFIG.bucket,
    Key: key,
  }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return {
    buffer: Buffer.concat(chunks),
    contentType: res.ContentType || 'application/octet-stream',
    contentLength: res.ContentLength,
  };
}

/**
 * Delete an object from Cloudflare R2
 */
export async function deleteObject(key) {
  const s3 = getS3();
  await s3.send(new DeleteObjectCommand({
    Bucket: R2_CONFIG.bucket,
    Key: key,
  }));
  return { ok: true };
}

/**
 * List objects in the Cloudflare R2 bucket with optional prefix
 */
export async function listObjects(prefix = '') {
  const s3 = getS3();
  const res = await s3.send(new ListObjectsV2Command({
    Bucket: R2_CONFIG.bucket,
    Prefix: prefix,
    MaxKeys: 100,
  }));
  return (res.Contents || []).map(item => ({
    key: item.Key,
    size: item.Size,
    lastModified: item.LastModified,
  }));
}
