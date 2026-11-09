import { createHash, createHmac } from 'node:crypto';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { InboxApiError } from '@/server/inboxStore';

const directory = join(process.cwd(), 'data', 'uploads');
function validKey(key: string) {
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(key)) throw new InboxApiError(400, 'Invalid file key.');
  return key;
}
function config() {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKey || !secret) return null;
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.r2.cloudflarestorage.com') || url.username || url.password || url.search || url.pathname !== '/' || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) {
    throw new InboxApiError(503, 'Private R2 storage configuration is invalid.');
  }
  return { endpoint: url.origin, bucket, accessKey, secret };
}
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const hmac = (key: string | Buffer, value: string) => createHmac('sha256', key).update(value).digest();

/** AWS Signature V4, signed payloads, R2 region auto. Credentials never leave server headers. */
export function signObjectRequest(method: string, url: URL, bytes: Buffer, accessKey: string, secret: string, now = new Date()) {
  const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = timestamp.slice(0, 8);
  const hash = sha(bytes);
  const scope = `${day}/auto/s3/aws4_request`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonical = [method, url.pathname, '', `host:${url.host}\nx-amz-content-sha256:${hash}\nx-amz-date:${timestamp}\n`, signedHeaders, hash].join('\n');
  const signingKey = hmac(hmac(hmac(hmac('AWS4' + secret, day), 'auto'), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(`AWS4-HMAC-SHA256\n${timestamp}\n${scope}\n${sha(canonical)}`).digest('hex');
  return { 'x-amz-date': timestamp, 'x-amz-content-sha256': hash,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}` };
}
async function objectRequest(method: 'GET' | 'PUT' | 'DELETE', key: string, bytes = Buffer.alloc(0), mimeType = 'application/octet-stream') {
  const cfg = config();
  if (!cfg) throw new InboxApiError(503, 'Private file storage needs R2 configuration.');
  const url = new URL(`${cfg.endpoint}/${cfg.bucket}/${encodeURIComponent(validKey(key))}`);
  const response = await fetch(url, { method, headers: { ...signObjectRequest(method, url, bytes, cfg.accessKey, cfg.secret), 'Content-Type': mimeType },
    ...(method === 'PUT' ? { body: new Uint8Array(bytes) } : {}), signal: AbortSignal.timeout(20000), redirect: 'error' });
  if (!response.ok) throw new InboxApiError(response.status === 404 ? 404 : 503, response.status === 404 ? 'File not found.' : 'Private file storage is unavailable.');
  return response;
}
export function useObjectStorage() { return !!config(); }
export async function putStoredFile(key: string, bytes: Buffer, mimeType: string) {
  if (key.startsWith('r2_')) { await objectRequest('PUT', key, bytes, mimeType); return; }
  if (process.env.NODE_ENV === 'production') throw new InboxApiError(503, 'Configure private durable file storage before uploading.');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, validKey(key)), bytes);
}
export async function readStoredFile(key: string): Promise<Buffer> {
  if (key.startsWith('r2_')) {
    const response = await objectRequest('GET', key);
    if (Number(response.headers.get('content-length')) > 10 * 1024 * 1024) throw new InboxApiError(400, 'File exceeds the size limit.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 10 * 1024 * 1024) throw new InboxApiError(400, 'File exceeds the size limit.');
    return bytes;
  }
  return readFile(join(directory, validKey(key)));
}
export async function deleteStoredFile(key: string) {
  if (key.startsWith('r2_')) { await objectRequest('DELETE', key); return; }
  await unlink(join(directory, validKey(key)));
}
