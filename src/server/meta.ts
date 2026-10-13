import { prisma } from '@/lib/db';
import { decryptSecret, encryptSecret, signState } from '@/server/crypto';
import { verifySignature } from '@/server/whatsapp';
import type { ChannelDelivery } from '@/server/whatsapp';

export { verifySignature };

const GRAPH_VERSION = 'v21.0';
const META_AUTH_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

export interface MetaConfig {
  appId: string;
  appSecret: string;
}

export function metaConfig(): MetaConfig | null {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) return null;
  return { appId, appSecret };
}

export function metaRedirectUri(): string {
  const base = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/channels/meta/callback`;
}

const META_SCOPES = [
  'pages_show_list',
  'pages_messaging',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_manage_messages',
];

/** Builds the Facebook Login consent URL. State binds workspace + staff. */
export function metaConsentUrl(workspaceId: string, staffId: string): string | null {
  const cfg = metaConfig();
  if (!cfg) return null;
  const q = new URLSearchParams({
    client_id: cfg.appId,
    redirect_uri: metaRedirectUri(),
    scope: META_SCOPES.join(','),
    response_type: 'code',
    state: signState({ workspaceId, staffId, nonce: `${Date.now()}` }),
  });
  return `${META_AUTH_URL}?${q.toString()}`;
}

async function graph(path: string, token: string, init?: RequestInit) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}${path}${sep}access_token=${encodeURIComponent(token)}`, {
    ...init,
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) throw new Error((json.error?.message ?? `Meta request failed (${res.status}).`).slice(0, 300));
  return json as Record<string, unknown>;
}

export async function exchangeMetaCode(code: string): Promise<string> {
  const cfg = metaConfig();
  if (!cfg) throw new Error('Meta is not configured.');
  const q = new URLSearchParams({
    client_id: cfg.appId,
    client_secret: cfg.appSecret,
    redirect_uri: metaRedirectUri(),
    code,
  });
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?${q.toString()}`, {
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error?: { message?: string } };
  if (!res.ok || !json.access_token) {
    throw new Error((json.error?.message ?? 'Facebook sign-in failed.').slice(0, 300));
  }
  return json.access_token;
}

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
}

/** Completes OAuth: subscribes the app to each page and stores encrypted tokens. */
export async function finishMetaConnect(args: {
  workspaceId: string;
  staffId: string;
  code: string;
}): Promise<{ pages: string[] }> {
  const userToken = await exchangeMetaCode(args.code);
  const me = (await graph('/me/accounts?fields=id,name,access_token,instagram_business_account', userToken)) as {
    data?: PageInfo[];
  };
  const pages = me.data ?? [];
  if (pages.length === 0) {
    throw new Error('No Facebook Pages found. Create or claim a Page first, then try again.');
  }
  const connected: string[] = [];
  for (const page of pages) {
    if (!page.id || !page.access_token) continue;
    // Subscribe our app to the page so messages and postbacks arrive.
    await graph(`/${page.id}/subscribed_apps`, userToken, { method: 'POST', body: JSON.stringify({}) });
    const igId = page.instagram_business_account?.id ?? null;
    const existing = await prisma.messengerPage.findFirst({
      where: { workspaceId: args.workspaceId, pageId: page.id },
      select: { id: true },
    });
    const tokenEnc = encryptSecret(page.access_token);
    if (existing) {
      await prisma.messengerPage.update({
        where: { id: existing.id },
        data: { pageName: page.name ?? null, instagramId: igId, tokenEnc },
      });
    } else {
      await prisma.messengerPage.create({
        data: { workspaceId: args.workspaceId, pageId: page.id, pageName: page.name ?? null, instagramId: igId, tokenEnc },
      });
    }
    for (const [channel, providerId] of [['FACEBOOK', page.id], ['INSTAGRAM', igId]] as const) {
      if (!providerId) continue;
      const link = await prisma.channelAccount.findFirst({
        where: { workspaceId: args.workspaceId, channel, providerAccountId: providerId },
        select: { id: true },
      });
      if (!link) {
        await prisma.channelAccount.create({
          data: { workspaceId: args.workspaceId, channel, providerAccountId: providerId, displayName: page.name ?? 'Meta page' },
        });
      }
    }
    connected.push(page.name ?? page.id);
  }
  await prisma.auditLog.create({
    data: {
      workspaceId: args.workspaceId,
      actorId: args.staffId,
      action: 'channel.connected',
      entityType: 'MessengerPage',
      entityId: `META:${connected.length}-pages`,
    },
  });
  return { pages: connected };
}

export interface MetaInbound {
  providerId: string;
  senderId: string;
  recipientId: string;
  text: string | null;
  kind: 'message' | 'postback';
  postbackTitle?: string;
}

/**
 * Extracts inbound events from a Page webhook payload. Pure: unknown shapes
 * yield nothing. Routing (recipient → workspace) stays with the caller.
 */
export function parseMetaPayload(payload: unknown): MetaInbound[] {
  const out: MetaInbound[] = [];
  try {
    const obj = (payload as { object?: unknown })?.object;
    if (obj !== 'page') return out;
    const entries = (payload as { entry?: unknown })?.entry;
    if (!Array.isArray(entries)) return out;
    for (const entry of entries) {
      const messaging = (entry as { messaging?: unknown })?.messaging;
      if (!Array.isArray(messaging)) continue;
      for (const ev of messaging as Record<string, unknown>[]) {
        const sender = (ev.sender as { id?: unknown } | undefined)?.id;
        const recipient = (ev.recipient as { id?: unknown } | undefined)?.id;
        if (typeof sender !== 'string' || typeof recipient !== 'string') continue;
        const message = ev.message as { mid?: unknown; text?: unknown } | undefined;
        const postback = ev.postback as { title?: unknown } | undefined;
        if (message && typeof message.mid === 'string') {
          const text = typeof message.text === 'string' && message.text.trim() ? message.text : null;
          out.push({ providerId: `meta:${message.mid}`, senderId: sender, recipientId: recipient, text, kind: 'message' });
        } else if (postback) {
          const title = typeof postback.title === 'string' ? postback.title : 'button';
          out.push({ providerId: `meta:postback:${recipient}:${sender}:${title}`, senderId: sender, recipientId: recipient, text: title, kind: 'postback', postbackTitle: title });
        }
      }
    }
  } catch {
    /* malformed payloads are ignored upstream */
  }
  return out;
}

/** Routes a recipient id (page or Instagram id) to exactly one workspace. */
export async function metaRouteFor(
  recipientId: string,
): Promise<{ workspaceId: string; channel: 'FACEBOOK' | 'INSTAGRAM'; pageRowId: string } | null> {
  const link = await prisma.channelAccount.findFirst({
    where: { channel: { in: ['FACEBOOK', 'INSTAGRAM'] }, providerAccountId: recipientId },
    select: { workspaceId: true, channel: true },
  });
  if (!link) return null;
  const page = await prisma.messengerPage.findFirst({
    where:
      link.channel === 'FACEBOOK'
        ? { workspaceId: link.workspaceId, pageId: recipientId }
        : { workspaceId: link.workspaceId, instagramId: recipientId },
    select: { id: true },
  });
  if (!page) return null;
  return { workspaceId: link.workspaceId, channel: link.channel as 'FACEBOOK' | 'INSTAGRAM', pageRowId: page.id };
}

async function graphGet(path: string, params: Record<string, string>, token: string): Promise<Record<string, unknown>> {
  const q = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}${path}?${q.toString()}`, {
    signal: AbortSignal.timeout(10000),
  });
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

function displayNameFor(channel: 'FACEBOOK' | 'INSTAGRAM', senderId: string): string {
  const tail = senderId.replace(/\D/g, '').slice(-6) || senderId.slice(-6);
  return channel === 'INSTAGRAM' ? `Instagram ${tail}` : `Messenger ${tail}`;
}

async function friendlyName(
  channel: 'FACEBOOK' | 'INSTAGRAM',
  senderId: string,
  pageRowId: string,
): Promise<string> {
  try {
    const page = await prisma.messengerPage.findUnique({ where: { id: pageRowId }, select: { tokenEnc: true } });
    if (!page) return displayNameFor(channel, senderId);
    const token = decryptSecret(page.tokenEnc);
    if (channel === 'INSTAGRAM') {
      const j = await graphGet(`/${senderId}`, { fields: 'username' }, token);
      if (typeof j.username === 'string' && j.username) return `@${j.username}`;
    } else {
      const j = await graphGet(`/${senderId}`, { fields: 'first_name,last_name' }, token);
      const name = `${(j.first_name as string | undefined) ?? ''} ${(j.last_name as string | undefined) ?? ''}`.trim();
      if (name) return name;
    }
  } catch {
    /* fall through to fallback name */
  }
  return displayNameFor(channel, senderId);
}

function inboundText(channel: 'FACEBOOK' | 'INSTAGRAM', msg: MetaInbound): string {
  if (msg.text && msg.text.trim()) return msg.kind === 'postback' ? `(tapped: ${msg.text})` : msg.text;
  return channel === 'INSTAGRAM' ? '(Instagram attachment — media download coming soon)' : '(Messenger attachment — media download coming soon)';
}

/** Stores one inbound message with duplicate protection. Reuses latest thread. */
export async function ingestMetaMessage(
  workspaceId: string,
  channel: 'FACEBOOK' | 'INSTAGRAM',
  pageRowId: string,
  recipientId: string,
  msg: MetaInbound,
): Promise<{ duplicate: boolean; conversationId: string }> {
  const seen = await prisma.message.findUnique({ where: { providerMessageId: msg.providerId }, select: { id: true } });
  if (seen) return { duplicate: true, conversationId: '' };
  const contactDetail = `${channel === 'INSTAGRAM' ? 'instagram' : 'messenger'}:${msg.senderId}`;
  let customer = await prisma.customer.findFirst({ where: { workspaceId, contactDetail }, select: { id: true, name: true } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { workspaceId, name: await friendlyName(channel, msg.senderId, pageRowId), contactDetail },
      select: { id: true, name: true },
    });
  }
  let conv = await prisma.conversation.findFirst({
    where: { workspaceId, customerId: customer.id, channel },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, status: true },
  });
  const text = inboundText(channel, msg);
  // Remember exactly which page/identity received this, so replies go back
  // through the same page even when a business connects several.
  const linkRow = await prisma.channelAccount.findFirst({
    where: { workspaceId, channel, providerAccountId: recipientId },
    select: { id: true },
  });
  if (!conv) {
    const maxSort = await prisma.conversation.aggregate({ where: { workspaceId }, _max: { sortOrder: true } });
    conv = await prisma.conversation.create({
      data: {
        workspaceId,
        customerId: customer.id,
        channel,
        channelAccountId: linkRow?.id ?? null,
        status: 'NEW',
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        preview: text.slice(0, 200),
      },
      select: { id: true, status: true },
    });
  } else {
    if (conv.status === 'RESOLVED') {
      await prisma.conversation.update({ where: { id: conv.id }, data: { status: 'IN_PROGRESS' } });
    }
    await prisma.conversation.update({ where: { id: conv.id }, data: { preview: text.slice(0, 200) } });
  }
  try {
    await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: conv.id, kind: 'CUSTOMER', senderName: customer.name, text, providerMessageId: msg.providerId },
      }),
      prisma.auditLog.create({
        data: { workspaceId, action: channel === 'INSTAGRAM' ? 'instagram.received' : 'messenger.received', entityType: 'Conversation', entityId: conv.id },
      }),
    ]);
  } catch (e) {
    if (e instanceof Error && /unique|Unique|P2002/i.test(e.message)) {
      return { duplicate: true, conversationId: conv.id };
    }
    throw e;
  }
  return { duplicate: false, conversationId: conv.id };
}

/**
 * Sends a staff reply through the Page (best-effort; local message stands).
 * Only sends when this workspace linked the exact page/identity.
 */
export async function tryMetaSend(args: {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  text: string;
}): Promise<ChannelDelivery> {
  const conv = await prisma.conversation.findFirst({
    where: { id: args.conversationId, workspaceId: args.workspaceId },
    select: { id: true, channel: true, channelAccountId: true, customer: { select: { contactDetail: true } } },
  });
  if (!conv || (conv.channel !== 'FACEBOOK' && conv.channel !== 'INSTAGRAM')) {
    return { attempted: false, sent: false };
  }
  const prefix = conv.channel === 'INSTAGRAM' ? 'instagram:' : 'messenger:';
  const to = (conv.customer?.contactDetail ?? '')
    .split(',')
    .map((p) => p.trim())
    .find((p) => p.startsWith(prefix))
    ?.slice(prefix.length);
  if (!to) return { attempted: true, sent: false, error: 'No channel identity on this customer record.' };
  // Prefer the exact receiving page; fall back to the first linked identity.
  const link = conv.channelAccountId
    ? await prisma.channelAccount.findFirst({ where: { id: conv.channelAccountId }, select: { providerAccountId: true } })
    : await prisma.channelAccount.findFirst({
        where: { workspaceId: args.workspaceId, channel: conv.channel },
        orderBy: { createdAt: 'asc' },
        select: { providerAccountId: true },
      });
  const page = link?.providerAccountId
    ? await prisma.messengerPage.findFirst({
        where:
          conv.channel === 'FACEBOOK'
            ? { workspaceId: args.workspaceId, pageId: link.providerAccountId }
            : { workspaceId: args.workspaceId, instagramId: link.providerAccountId },
        select: { id: true, tokenEnc: true },
      })
    : null;
  if (!page) return { attempted: false, sent: false, error: 'No page connected for this business.' };
  const body = args.text.trim().slice(0, 4000);
  if (!body) return { attempted: true, sent: false, error: 'Empty message.' };
  try {
    const token = decryptSecret(page.tokenEnc);
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: to }, messaging_type: 'RESPONSE', message: { text: body } }),
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json().catch(() => ({}))) as { message_id?: string; error?: { message?: string } };
    if (!res.ok || !json.message_id) {
      throw new Error((json.error?.message ?? `Send failed (${res.status}).`).slice(0, 300));
    }
    const providerId = `meta:${json.message_id}`;
    await prisma.$transaction([
      prisma.message.update({ where: { id: args.messageId }, data: { providerMessageId: providerId } }),
      prisma.auditLog.create({
        data: { workspaceId: args.workspaceId, action: 'meta.sent', entityType: 'Message', entityId: args.messageId },
      }),
    ]);
    return { attempted: true, sent: true, providerId };
  } catch (e) {
    return { attempted: true, sent: false, error: e instanceof Error ? e.message : 'Send failed.' };
  }
}
