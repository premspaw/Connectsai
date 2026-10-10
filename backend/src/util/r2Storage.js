// Cloudflare R2 Storage Adapter for Backend Express Server
// S3-compatible, Zero-Egress Object Storage for WhatsApp Inbound Media, Outbound Attachments, and Media Library Assets.

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd8945011e8c1b69f5204fd69b2bf12cf';
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || 'ad3d7102c9b4a9fd2141779cec364038';
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '56d1eab4f23727d928fb46912cb9d9683785de8307f8df152888fb538e0a5d34';
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || 'connects-ai-media';
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || '';

let _s3 = null;
function getS3Client() {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _s3;
}

/**
 * Upload buffer directly to Cloudflare R2
 */
async function uploadToR2(objectKey, buffer, mimeType = 'application/octet-stream') {
  const s3 = getS3Client();
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
    Body: buffer,
    ContentType: mimeType,
  }));
  return {
    key: objectKey,
    bucket: R2_BUCKET,
    publicUrl: R2_PUBLIC_DOMAIN ? `${R2_PUBLIC_DOMAIN}/${objectKey}` : `/api/media/${encodeURIComponent(objectKey)}`,
  };
}

/**
 * Download object buffer from Cloudflare R2
 */
async function getFromR2(objectKey) {
  const s3 = getS3Client();
  const res = await s3.send(new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
  }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return {
    buffer: Buffer.concat(chunks),
    mimeType: res.ContentType || 'application/octet-stream',
    sizeBytes: res.ContentLength,
  };
}

/**
 * Delete object from Cloudflare R2
 */
async function deleteFromR2(objectKey) {
  const s3 = getS3Client();
  await s3.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
  }));
  return { ok: true };
}

/**
 * Check health status of Cloudflare R2 connection
 */
async function status() {
  try {
    const s3 = getS3Client();
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      MaxKeys: 10,
    }));
    return {
      connected: true,
      provider: 'Cloudflare R2',
      bucket: R2_BUCKET,
      accountId: R2_ACCOUNT_ID.slice(0, 8) + '...',
      egress: 'Zero Egress Fees ($0.00)',
      objectCount: res.KeyCount || 0,
    };
  } catch (err) {
    return {
      connected: false,
      provider: 'Cloudflare R2',
      bucket: R2_BUCKET,
      error: err.message,
    };
  }
}

module.exports = {
  uploadToR2,
  getFromR2,
  deleteFromR2,
  status,
  getS3Client,
  R2_BUCKET,
};
