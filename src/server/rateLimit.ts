import { InboxApiError } from '@/server/inboxStore';

// Local in-memory rate limiter for public guest endpoints.
// Production with multiple servers will need a shared store (e.g. Redis);
// for local single-instance use this is sufficient and dependency-free.
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function clientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'local';
  return ip.slice(0, 64);
}

/**
 * Throws 429 when key exceeds limit requests per windowMs.
 * Expired buckets are pruned opportunistically on each check.
 */
export function checkRateLimit(req: Request, scope: string, limit: number, windowMs: number): void {
  const now = Date.now();
  if (buckets.size > 5000) {
    const cutoff = now;
    const stale: string[] = [];
    buckets.forEach((b, k) => {
      if (b.resetAt <= cutoff) stale.push(k);
    });
    stale.forEach((k) => buckets.delete(k));
  }
  const key = `${scope}:${clientKey(req)}`;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new InboxApiError(429, 'Too many requests. Please wait a while and try again.');
  }
}

export function rateLimitKeyForTestOnly(): number {
  return buckets.size;
}
