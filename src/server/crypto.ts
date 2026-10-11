import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Token vault: AES-256-GCM with a server-secret-derived key. Every value gets
// a fresh random IV. Stored format: v1:<iv>:<cipher>:<tag> (all base64).
// OAuth state tokens are HMAC-signed and verified, never trusted blindly.

function vaultKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('Server secret is not configured.');
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', vaultKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${enc.toString('base64')}:${tag.toString('base64')}`;
}

export function decryptSecret(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') throw new Error('Unknown secret format.');
  const decipher = createDecipheriv('aes-256-gcm', vaultKey(), Buffer.from(parts[1], 'base64'));
  decipher.setAuthTag(Buffer.from(parts[3], 'base64'));
  return decipher.update(parts[2], 'base64', 'utf8') + decipher.final('utf8');
}

/** Masks a token for logs/audits (first 4 + length only). Never the value. */
export function maskSecret(value: string): string {
  if (value.length <= 8) return '••••';
  return `${value.slice(0, 4)}••••(${value.length})`;
}

/** Signs an OAuth state payload. Format: base64url(json).base64url(sig). */
export function signState(payload: Record<string, string>): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('Server secret is not configured.');
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret).update(body, 'utf8').digest('base64url');
  return `${body}.${sig}`;
}

/** Verifies an OAuth state token. Returns the payload or null. Pure. */
export function verifyState(token: string): Record<string, string> | null {
  try {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret || typeof token !== 'string') return null;
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = createHmac('sha256', secret).update(body, 'utf8').digest();
    const actual = Buffer.from(sig, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as unknown;
    if (typeof payload !== 'object' || payload === null) return null;
    return payload as Record<string, string>;
  } catch {
    return null;
  }
}
