import { NextResponse } from 'next/server';
import { metaConfig, parseMetaPayload, metaRouteFor, ingestMetaMessage, verifySignature } from '@/server/meta';

/** Webhook verification (Meta setup handshake). Never reveals what mismatched. */
export async function GET(req: Request) {
  const cfg = metaConfig();
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (cfg && mode === 'subscribe' && token && challenge && token === cfg.appSecret) {
    // NOTE: the page-subscription handshake reuses the app secret as the
    // verify token. Use one strong secret for both (see README).
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Verification failed.' }, { status: 403 });
}

/**
 * Receives Messenger + Instagram messages. Guards, in order:
 * 1. Server must be configured (else 503 so Meta retries later).
 * 2. HMAC-SHA256 signature must validate (else 401).
 * 3. Each recipient routes to exactly one linked workspace (unknown ignored).
 * 4. Duplicate mids are skipped (plus a unique DB constraint).
 * Always 200 after validation so Meta stops retrying handled batches.
 * Public comments, mentions and tags arrive in a later phase (messages only).
 */
export async function POST(req: Request) {
  const cfg = metaConfig();
  if (!cfg) {
    return NextResponse.json({ error: 'Meta messaging is not configured.' }, { status: 503 });
  }
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get('x-hub-signature-256'), cfg.appSecret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }
  let payload: unknown = null;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }
  let stored = 0;
  let duplicates = 0;
  for (const msg of parseMetaPayload(payload)) {
    try {
      const route = await metaRouteFor(msg.recipientId);
      if (!route) {
        console.error('meta webhook: unknown recipient, ignored');
        continue;
      }
      const r = await ingestMetaMessage(route.workspaceId, route.channel, route.pageRowId, msg.recipientId, msg);
      if (r.duplicate) duplicates += 1;
      else stored += 1;
    } catch (e) {
      console.error('meta webhook: message skipped', e);
    }
  }
  return NextResponse.json({ received: true, stored, duplicates });
}
