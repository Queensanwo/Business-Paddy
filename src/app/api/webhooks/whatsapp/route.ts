import { NextResponse } from 'next/server';
import {
  whatsappConfig,
  verifySignature,
  parseWebhookPayload,
  workspaceForNumber,
  ingestWhatsAppMessage,
} from '@/server/whatsapp';

/**
 * Webhook verification (Meta setup handshake). Compares Meta's verify token
 * against server config — never reveals which half mismatched.
 */
export async function GET(req: Request) {
  const cfg = whatsappConfig();
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (cfg && mode === 'subscribe' && token && challenge && token === cfg.verifyToken) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Verification failed.' }, { status: 403 });
}

/**
 * Receives WhatsApp messages. Guards, in order:
 * 1. Server must be configured (else 503 so Meta retries later).
 * 2. HMAC-SHA256 signature must validate (else 401).
 * 3. Each number routes to exactly one linked workspace (unknown numbers ignored).
 * 4. Duplicate provider IDs are skipped (plus a unique DB constraint).
 * Always 200 after validation so Meta stops retrying handled batches.
 */
export async function POST(req: Request) {
  const cfg = whatsappConfig();
  if (!cfg) {
    return NextResponse.json({ error: 'WhatsApp is not configured.' }, { status: 503 });
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
  for (const batch of parseWebhookPayload(payload)) {
    const route = await workspaceForNumber(batch.phoneNumberId);
    if (!route) {
      console.error('whatsapp webhook: unknown number, ignored');
      continue;
    }
    for (const msg of batch.messages) {
      try {
        const r = await ingestWhatsAppMessage(route.workspaceId, route.channelAccountId, msg);
        if (r.duplicate) duplicates += 1;
        else stored += 1;
      } catch (e) {
        console.error('whatsapp webhook: message skipped', e);
      }
    }
  }
  return NextResponse.json({ received: true, stored, duplicates });
}
