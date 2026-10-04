import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';

export interface GuestMessage {
  who: string;
  role: 'customer' | 'staff';
  text: string;
}

export interface GuestThread {
  businessName: string;
  guestName: string;
  status: string;
  messages: GuestMessage[];
}

function newGuestToken(): string {
  return randomBytes(32).toString('hex');
}

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') throw new InboxApiError(400, 'Invalid request.');
  const trimmed = value.trim();
  if (!trimmed) throw new InboxApiError(400, 'Message text is required.');
  if (trimmed.length > max) throw new InboxApiError(400, `Text is limited to ${max} characters.`);
  return trimmed;
}

export async function threadByToken(token: string) {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) throw new InboxApiError(404, 'Chat link not found.');
  const conv = await prisma.conversation.findUnique({
    where: { guestToken: token },
    include: {
      workspace: { select: { id: true, name: true } },
      customer: true,
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!conv || conv.channel !== 'PADDY_CHAT') throw new InboxApiError(404, 'Chat link not found.');
  return conv;
}

function toGuestThread(
  conv: Awaited<ReturnType<typeof threadByToken>>,
): GuestThread {
  // Guests only ever see customer and staff messages — never internal notes.
  const visible = conv.messages.filter((m) => m.kind === 'CUSTOMER' || m.kind === 'STAFF');
  return {
    businessName: conv.workspace.name,
    guestName: conv.customer?.name ?? 'Guest',
    status: conv.status,
    messages: visible.map((m) => ({
      who: m.senderName,
      role: m.kind === 'STAFF' ? ('staff' as const) : ('customer' as const),
      text: m.text,
    })),
  };
}

/** Starts a guest chat for a business. No login required. */
export async function startGuestChat(
  workspaceId: string,
  name: string,
  text: string,
): Promise<{ token: string; conversationId: string }> {
  const guestName = clean(name, 60);
  const firstText = clean(text, 2000);
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new InboxApiError(404, 'Business not found.');

  const customer = await prisma.customer.create({
    data: { workspaceId, name: guestName, contactDetail: 'paddy-chat:guest' },
  });
  const maxSort = await prisma.conversation.aggregate({
    where: { workspaceId },
    _max: { sortOrder: true },
  });
  const conv = await prisma.conversation.create({
    data: {
      workspaceId,
      customerId: customer.id,
      channel: 'PADDY_CHAT',
      status: 'NEW',
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      preview: firstText,
      guestToken: newGuestToken(),
      messages: {
        create: [{ kind: 'CUSTOMER', senderName: guestName, text: firstText }],
      },
    },
    select: { id: true, guestToken: true },
  });
  await prisma.auditLog.create({
    data: {
      workspaceId,
      action: 'paddy_chat.started',
      entityType: 'Conversation',
      entityId: conv.id,
    },
  });
  return { token: conv.guestToken as string, conversationId: conv.id };
}

/** Loads a guest thread by return-link token. */
export async function getGuestThread(token: string): Promise<GuestThread> {
  return toGuestThread(await threadByToken(token));
}

/** Appends a guest reply. Reopens resolved threads. */
export async function postGuestReply(token: string, text: string): Promise<GuestThread> {
  const cleanText = clean(text, 2000);
  const conv = await threadByToken(token);
  const guestName = conv.customer?.name ?? 'Guest';
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conv.id,
        kind: 'CUSTOMER',
        senderName: guestName,
        text: cleanText,
      },
    }),
    prisma.conversation.update({
      where: { id: conv.id },
      data: {
        preview: cleanText,
        ...(conv.status === 'RESOLVED' ? { status: 'IN_PROGRESS' as const } : {}),
      },
    }),
  ]);
  return toGuestThread(await threadByToken(token));
}

/** Public business profile for the guest landing page. Nothing sensitive. */
export async function getGuestBusiness(workspaceId: string): Promise<{ name: string }> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });
  if (!workspace) throw new InboxApiError(404, 'Business not found.');
  return { name: workspace.name };
}
