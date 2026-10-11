import { prisma } from '@/lib/db';
import { decryptSecret, encryptSecret, signState } from '@/server/crypto';
import type { ChannelDelivery } from '@/server/whatsapp';

const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function googleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const base = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return { clientId, clientSecret, redirectUri: `${base}/api/channels/google/callback` };
}

/** The exact redirect URI to paste into the Google console. */
export function googleRedirectUri(): string {
  const base = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/channels/google/callback`;
}

/** Builds the Google consent URL. State binds workspace + staff member. */
export function googleConsentUrl(workspaceId: string, staffId: string): string | null {
  const cfg = googleConfig();
  if (!cfg) return null;
  const q = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: signState({ workspaceId, staffId, nonce: `${Date.now()}` }),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}

interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

async function exchangeCode(code: string): Promise<TokenSet> {
  const cfg = googleConfig();
  if (!cfg) throw new Error('Google is not configured.');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || 'Google sign-in failed.');
  }
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresIn: json.expires_in ?? 3600 };
}

async function refreshAccess(refreshToken: string): Promise<TokenSet> {
  const cfg = googleConfig();
  if (!cfg) throw new Error('Google is not configured.');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: 'refresh_token',
    }).toString(),
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || 'Google session expired. Reconnect the mailbox.');
  }
  return { accessToken: json.access_token, expiresIn: json.expires_in ?? 3600 };
}

async function gmailApi(accessToken: string, path: string, init?: RequestInit) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message || `Gmail request failed (${res.status}).`);
  return json as Record<string, unknown>;
}

export async function googleProfileEmail(accessToken: string): Promise<string> {
  const json = await gmailApi(accessToken, '/users/me/profile');
  if (typeof json.emailAddress !== 'string' || !json.emailAddress.includes('@')) {
    throw new Error('Could not read the mailbox address.');
  }
  return json.emailAddress.toLowerCase();
}

/** Completes an OAuth callback: exchanges the code and stores encrypted tokens. */
export async function finishGoogleConnect(args: {
  workspaceId: string;
  staffId: string;
  code: string;
}): Promise<{ emailAddress: string }> {
  const tokens = await exchangeCode(args.code);
  if (!tokens.refreshToken) {
    throw new Error('Google did not return a refresh token. Remove the app at myaccount.google.com/permissions and try again.');
  }
  const emailAddress = await googleProfileEmail(tokens.accessToken);
  // One row per mailbox per workspace: find-then-write explicitly.
  const existing = await prisma.emailAccount.findFirst({
    where: { workspaceId: args.workspaceId, emailAddress },
    select: { id: true },
  });
  const data = {
    refreshTokenEnc: encryptSecret(tokens.refreshToken),
    accessTokenEnc: encryptSecret(tokens.accessToken),
    accessExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
  };
  if (existing) {
    await prisma.emailAccount.update({ where: { id: existing.id }, data });
  } else {
    await prisma.emailAccount.create({
      data: { workspaceId: args.workspaceId, provider: 'GOOGLE', emailAddress, ...data },
    });
  }
  await prisma.auditLog.create({
    data: {
      workspaceId: args.workspaceId,
      actorId: args.staffId,
      action: 'channel.connected',
      entityType: 'EmailAccount',
      entityId: `GOOGLE:${emailAddress}`,
    },
  });
  return { emailAddress };
}

/** Returns a fresh access token, refreshing when expired. Never logs values. */
export async function googleAccessToken(accountId: string): Promise<{ emailAddress: string; accessToken: string }> {
  const row = await prisma.emailAccount.findFirst({
    where: { id: accountId },
    select: { id: true, emailAddress: true, refreshTokenEnc: true, accessTokenEnc: true, accessExpiresAt: true },
  });
  if (!row) throw new Error('Mailbox not found.');
  if (row.accessTokenEnc && row.accessExpiresAt && row.accessExpiresAt.getTime() > Date.now() + 60000) {
    return { emailAddress: row.emailAddress, accessToken: decryptSecret(row.accessTokenEnc) };
  }
  const tokens = await refreshAccess(decryptSecret(row.refreshTokenEnc));
  await prisma.emailAccount.update({
    where: { id: row.id },
    data: {
      accessTokenEnc: encryptSecret(tokens.accessToken),
      accessExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
    },
  });
  return { emailAddress: row.emailAddress, accessToken: tokens.accessToken };
}

function base64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function headerOf(headers: { name?: string; value?: string }[] | undefined, name: string): string {
  const hit = (headers ?? []).find((h) => h.name?.toLowerCase() === name);
  return typeof hit?.value === 'string' ? hit.value : '';
}

function bodyText(payload: Record<string, unknown> | undefined): string {
  if (!payload) return '';
  const data = (payload as { body?: { data?: string } }).body?.data;
  if (typeof data === 'string' && data) {
    try {
      return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8').slice(0, 5000);
    } catch {
      return '';
    }
  }
  const parts = (payload as { parts?: Record<string, unknown>[] }).parts;
  if (Array.isArray(parts)) {
    for (const p of parts) {
      const t = bodyText(p);
      if (t.trim()) return t;
    }
  }
  return '';
}

/**
 * Sends a staff reply through Gmail, threaded under the customer's message.
 * Best-effort: never throws for channel failures.
 */
export async function tryEmailSend(args: {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  text: string;
}): Promise<ChannelDelivery> {
  const conv = await prisma.conversation.findFirst({
    where: { id: args.conversationId, workspaceId: args.workspaceId },
    select: { id: true, channel: true, customer: { select: { contactDetail: true } } },
  });
  if (!conv || conv.channel !== 'EMAIL') return { attempted: false, sent: false };
  if (!googleConfig()) return { attempted: false, sent: false, error: 'Google is not configured.' };
  const account = await prisma.emailAccount.findFirst({
    where: { workspaceId: args.workspaceId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!account) return { attempted: false, sent: false, error: 'No mailbox connected for this business.' };
  const to = (conv.customer?.contactDetail ?? '')
    .split(',')
    .map((p) => p.trim())
    .find((p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p));
  if (!to) return { attempted: true, sent: false, error: 'No email address on this customer record.' };
  const body = args.text.trim().slice(0, 4000);
  if (!body) return { attempted: true, sent: false, error: 'Empty message.' };
  try {
    const { emailAddress, accessToken } = await googleAccessToken(account.id);
    const raw = base64url(
      `From: ${emailAddress}\r\nTo: ${to}\r\nSubject: Re: your message to ${emailAddress}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`,
    );
    const sent = (await gmailApi(accessToken, '/users/me/messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw }),
    })) as { id?: string };
    if (!sent.id) throw new Error('Gmail send failed.');
    await prisma.$transaction([
      prisma.message.update({ where: { id: args.messageId }, data: { providerMessageId: `gmail:${sent.id}` } }),
      prisma.auditLog.create({
        data: { workspaceId: args.workspaceId, action: 'email.sent', entityType: 'Message', entityId: args.messageId },
      }),
    ]);
    return { attempted: true, sent: true, providerId: `gmail:${sent.id}` };
  } catch (e) {
    return { attempted: true, sent: false, error: e instanceof Error ? e.message : 'Email send failed.' };
  }
}

export interface EmailIngestResult {
  stored: number;
  duplicates: number;
}

/**
 * Polls the first connected mailbox for recent mail and threads anything new
 * into the inbox. Duplicate-safe via Gmail message IDs.
 */
export async function pollGoogleMailbox(workspaceId: string, actorId: string): Promise<EmailIngestResult> {
  if (!googleConfig()) throw new Error('Google is not configured.');
  const account = await prisma.emailAccount.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, emailAddress: true },
  });
  if (!account) throw new Error('No mailbox connected for this business.');
  const { accessToken } = await googleAccessToken(account.id);
  const ownAddress = account.emailAddress.toLowerCase();
  const list = (await gmailApi(
    accessToken,
    `/users/me/messages?maxResults=10&q=${encodeURIComponent('newer_than:7d -in:sent')}`,
  )) as { messages?: { id?: string }[] };
  let stored = 0;
  let duplicates = 0;
  for (const m of list.messages ?? []) {
    if (!m.id) continue;
    const providerId = `gmail:${m.id}`;
    const seen = await prisma.message.findUnique({ where: { providerMessageId: providerId }, select: { id: true } });
    if (seen) {
      duplicates += 1;
      continue;
    }
    const full = (await gmailApi(accessToken, `/users/me/messages/${m.id}?format=full`)) as {
      payload?: { headers?: { name?: string; value?: string }[] } & Record<string, unknown>;
      snippet?: string;
    };
    const headers = (full.payload?.headers ?? []) as { name?: string; value?: string }[];
    const fromRaw = headerOf(headers, 'from');
    const fromMatch = /([^\s@]+@[^\s@]+\.[^\s@]+)/.exec(fromRaw);
    if (!fromMatch) continue;
    const fromEmail = fromMatch[1].toLowerCase();
    // Skip our own sent mail (echoes of staff replies).
    if (fromEmail === ownAddress) {
      duplicates += 1;
      continue;
    }
    const subject = headerOf(headers, 'subject');
    const text = bodyText(full.payload as Record<string, unknown> | undefined) || (full.snippet ?? '').slice(0, 2000) || '(email without readable text)';
    let customer = await prisma.customer.findFirst({
      where: { workspaceId, contactDetail: fromEmail },
      select: { id: true, name: true },
    });
    if (!customer) {
      const name = fromRaw.split('<')[0].trim().replace(/^"|"$/g, '').slice(0, 80) || fromEmail;
      customer = await prisma.customer.create({
        data: { workspaceId, name, contactDetail: fromEmail },
        select: { id: true, name: true },
      });
    }
    let thread = await prisma.conversation.findFirst({
      where: { workspaceId, customerId: customer.id, channel: 'EMAIL' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, status: true },
    });
    if (!thread) {
      const maxSort = await prisma.conversation.aggregate({ where: { workspaceId }, _max: { sortOrder: true } });
      thread = await prisma.conversation.create({
        data: {
          workspaceId,
          customerId: customer.id,
          channel: 'EMAIL',
          status: 'NEW',
          sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
          preview: `${subject ? `${subject} — ` : ''}${text}`.slice(0, 200),
        },
        select: { id: true, status: true },
      });
    } else {
      if (thread.status === 'RESOLVED') {
        await prisma.conversation.update({ where: { id: thread.id }, data: { status: 'IN_PROGRESS' } });
      }
      await prisma.conversation.update({
        where: { id: thread.id },
        data: { preview: `${subject ? `${subject} — ` : ''}${text}`.slice(0, 200) },
      });
    }
    try {
      await prisma.$transaction([
        prisma.message.create({
          data: { conversationId: thread.id, kind: 'CUSTOMER', senderName: customer.name, text, providerMessageId: providerId },
        }),
        prisma.auditLog.create({
          data: { workspaceId, action: 'email.received', entityType: 'Conversation', entityId: thread.id },
        }),
      ]);
      stored += 1;
    } catch (e) {
      if (e instanceof Error && /unique|Unique|P2002/i.test(e.message)) duplicates += 1;
      else throw e;
    }
  }
  await prisma.auditLog.create({
    data: { workspaceId, actorId, action: 'email.polled', entityType: 'Workspace', entityId: workspaceId },
  });
  return { stored, duplicates };
}
