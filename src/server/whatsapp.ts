import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/db';

const GRAPH_VERSION = 'v21.0';
const MAX_TEXT = 4000;

export interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  businessAccountId: string;
  verifyToken: string;
  appSecret: string;
}

/** Reads server-only config. Null when anything is missing — callers degrade. */
export function whatsappConfig(): WhatsAppConfig | null {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const appSecret = process.env.META_APP_SECRET;
  if (!token || !phoneNumberId || !businessAccountId || !verifyToken || !appSecret) return null;
  return { token, phoneNumberId, businessAccountId, verifyToken, appSecret };
}

/** Last-4 masking for UI display. Never exposes full values. */
export function maskId(value: string): string {
  return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`;
}

/**
 * Validates Meta's X-Hub-Signature-256 header (hex HMAC-SHA256 of the raw body).
 * Pure function — unit-tested without any credentials.
 */
export function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const m = /^sha256=([0-9a-f]{64})$/.exec(header.trim());
  if (!m) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  const actual = Buffer.from(m[1], 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export interface IncomingWhatsAppMessage {
  providerId: string;
  from: string;
  timestamp: number;
  type: string;
  text: string | null;
}

/**
 * Parses a WhatsApp webhook payload into per-number message batches.
 * Pure function — unknown shapes yield empty batches, never throws.
 */
export function parseWebhookPayload(payload: unknown): { phoneNumberId: string; messages: IncomingWhatsAppMessage[] }[] {
  const out: { phoneNumberId: string; messages: IncomingWhatsAppMessage[] }[] = [];
  try {
    const entries = (payload as { entry?: unknown })?.entry;
    if (!Array.isArray(entries)) return out;
    for (const entry of entries) {
      const changes = (entry as { changes?: unknown })?.changes;
      if (!Array.isArray(changes)) continue;
      for (const change of changes) {
        const value = (change as { value?: unknown })?.value as
          | { metadata?: { phone_number_id?: unknown }; messages?: unknown[] }
          | undefined;
        const phoneNumberId = value?.metadata?.phone_number_id;
        if (typeof phoneNumberId !== 'string' || !phoneNumberId) continue;
        const batch = { phoneNumberId, messages: [] as IncomingWhatsAppMessage[] };
        if (Array.isArray(value?.messages)) {
          for (const m of value.messages as Record<string, unknown>[]) {
            if (typeof m.id !== 'string' || typeof m.from !== 'string' || typeof m.type !== 'string') continue;
            const text =
              m.type === 'text'
                ? ((m.text as { body?: unknown } | undefined)?.body as string | undefined) ?? null
                : null;
            batch.messages.push({
              providerId: m.id,
              from: m.from,
              timestamp: typeof m.timestamp === 'string' ? Number(m.timestamp) || 0 : 0,
              type: m.type,
              text: typeof text === 'string' ? text : null,
            });
          }
        }
        out.push(batch);
      }
    }
  } catch {
    /* malformed payloads are ignored upstream */
  }
  return out;
}

/** Routes an inbound number to exactly one workspace via its linked ChannelAccount. */
export async function workspaceForNumber(phoneNumberId: string): Promise<{ workspaceId: string; channelAccountId: string } | null> {
  const row = await prisma.channelAccount.findFirst({
    where: { channel: 'WHATSAPP', providerAccountId: phoneNumberId },
    select: { id: true, workspaceId: true },
  });
  if (!row) return null;
  return { workspaceId: row.workspaceId, channelAccountId: row.id };
}

function displayText(msg: IncomingWhatsAppMessage): string {
  if (msg.type === 'text' && msg.text && msg.text.trim()) return msg.text;
  return `(WhatsApp ${msg.type} message — media download coming soon)`;
}

/**
 * Stores one inbound message with duplicate protection (provider message IDs
 * are unique). Reuses the customer's latest WhatsApp thread (reopening it
 * when resolved) so history stays in one place.
 */
export async function ingestWhatsAppMessage(
  workspaceId: string,
  channelAccountId: string,
  msg: IncomingWhatsAppMessage,
): Promise<{ duplicate: boolean; conversationId: string }> {
  const seen = await prisma.message.findUnique({
    where: { providerMessageId: msg.providerId },
    select: { id: true },
  });
  if (seen) return { duplicate: true, conversationId: '' };

  const digits = msg.from.replace(/\D/g, '');
  if (!digits) throw new Error('Sender number missing.');
  const contactDetail = `whatsapp:+${digits}`;

  let customer = await prisma.customer.findFirst({
    where: { workspaceId, contactDetail },
    select: { id: true, name: true },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { workspaceId, name: `WhatsApp ${digits}`, contactDetail },
      select: { id: true, name: true },
    });
  }

  let conv = await prisma.conversation.findFirst({
    where: { workspaceId, customerId: customer.id, channel: 'WHATSAPP' },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, status: true },
  });
  if (!conv) {
    const maxSort = await prisma.conversation.aggregate({
      where: { workspaceId },
      _max: { sortOrder: true },
    });
    conv = await prisma.conversation.create({
      data: {
        workspaceId,
        customerId: customer.id,
        channel: 'WHATSAPP',
        channelAccountId,
        status: 'NEW',
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        preview: displayText(msg).slice(0, 200),
      },
      select: { id: true, status: true },
    });
  } else if (conv.status === 'RESOLVED') {
    await prisma.conversation.update({ where: { id: conv.id }, data: { status: 'IN_PROGRESS' } });
  }

  const text = displayText(msg);
  try {
    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conv.id,
          kind: 'CUSTOMER',
          senderName: customer.name,
          text,
          providerMessageId: msg.providerId,
        },
      }),
      prisma.conversation.update({ where: { id: conv.id }, data: { preview: text.slice(0, 200) } }),
      prisma.auditLog.create({
        data: {
          workspaceId,
          action: 'whatsapp.received',
          entityType: 'Conversation',
          entityId: conv.id,
        },
      }),
    ]);
  } catch (e) {
    // Unique-violation race: a concurrent retry stored it first.
    if (e instanceof Error && /unique|Unique|P2002/i.test(e.message)) {
      return { duplicate: true, conversationId: conv.id };
    }
    throw e;
  }
  return { duplicate: false, conversationId: conv.id };
}

export interface ChannelDelivery {
  attempted: boolean;
  sent: boolean;
  providerId?: string;
  error?: string;
}

function recipientFromContact(contactDetail: string | null | undefined): string | null {
  if (!contactDetail) return null;
  for (const part of contactDetail.split(',')) {
    const p = part.trim();
    if (p.toLowerCase().startsWith('whatsapp:')) {
      const digits = p.slice('whatsapp:'.length).replace(/\D/g, '');
      if (/^[0-9]{7,15}$/.test(digits)) return digits;
    }
  }
  return null;
}

/**
 * Sends a saved staff reply through the WhatsApp Cloud API (best-effort).
 * Never throws for channel failures — the local message always stands.
 * Only sends when this workspace linked this exact test number.
 */
export async function tryChannelSend(args: {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  text: string;
}): Promise<ChannelDelivery> {
  const conv = await prisma.conversation.findFirst({
    where: { id: args.conversationId, workspaceId: args.workspaceId },
    select: {
      id: true,
      channel: true,
      customer: { select: { contactDetail: true } },
    },
  });
  if (!conv || conv.channel !== 'WHATSAPP') return { attempted: false, sent: false };
  const cfg = whatsappConfig();
  if (!cfg) return { attempted: false, sent: false, error: 'WhatsApp is not configured.' };
  const link = await prisma.channelAccount.findFirst({
    where: { workspaceId: args.workspaceId, channel: 'WHATSAPP', providerAccountId: cfg.phoneNumberId },
    select: { id: true },
  });
  if (!link) return { attempted: false, sent: false, error: 'WhatsApp is not connected for this business.' };
  const to = recipientFromContact(conv.customer?.contactDetail);
  if (!to) return { attempted: true, sent: false, error: 'No WhatsApp number on this customer record.' };
  const body = args.text.trim().slice(0, MAX_TEXT);
  if (!body) return { attempted: true, sent: false, error: 'Empty message.' };

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${cfg.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      messages?: { id?: string }[];
      error?: { message?: string };
    };
    const providerId = json.messages?.[0]?.id;
    if (!res.ok || !providerId) {
      throw new Error(json.error?.message || `WhatsApp send failed (${res.status}).`);
    }
    await prisma.$transaction([
      prisma.message.update({ where: { id: args.messageId }, data: { providerMessageId: providerId } }),
      prisma.auditLog.create({
        data: {
          workspaceId: args.workspaceId,
          action: 'whatsapp.sent',
          entityType: 'Message',
          entityId: args.messageId,
        },
      }),
    ]);
    return { attempted: true, sent: true, providerId };
  } catch (e) {
    return { attempted: true, sent: false, error: e instanceof Error ? e.message : 'WhatsApp send failed.' };
  }
}
