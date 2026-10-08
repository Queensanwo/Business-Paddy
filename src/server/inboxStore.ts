import { prisma } from '@/lib/db';
import {
  Conversation,
  Status,
  StatusClass,
  Channel,
  channelLabel,
} from '@/types/conversation';
import { Channel as DbChannel, ConvStatus, MessageKind, Prisma } from '@prisma/client';

export const DEMO_WORKSPACE_ID = 'demo-workspace-1';

export class InboxApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// WEBSITE has no inbox filter/badge yet (planned channel work). Rows with
// that channel are excluded from the inbox until the UI supports them —
// never silently mislabelled.
const channelToUi: Record<DbChannel, Channel | null> = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  EMAIL: 'email',
  WEBSITE: null,
  PADDY_CHAT: 'paddy_chat',
  FACEBOOK: 'facebook',
};

const statusToUi: Record<ConvStatus, { status: Status; statusClass: StatusClass }> = {
  NEW: { status: 'New', statusClass: 'new' },
  IN_PROGRESS: { status: 'In progress', statusClass: 'in-progress' },
  WAITING_FOR_CUSTOMER: { status: 'Waiting for customer', statusClass: 'waiting' },
  FOLLOW_UP: { status: 'Follow up', statusClass: 'follow-up' },
  NEEDS_APPROVAL: { status: 'New', statusClass: 'new' },
  ESCALATED: { status: 'Escalated', statusClass: 'escalated' },
  RESOLVED: { status: 'Resolved', statusClass: 'resolved' },
};

const kindToRole = (kind: MessageKind): 'customer' | 'staff' =>
  kind === 'STAFF' || kind === 'NOTE' ? 'staff' : 'customer';

export function timeAgo(date: Date): string {
  const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr`;
  if (hours < 48) return 'Yesterday';
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

async function loadRows(workspaceId: string) {
  return prisma.conversation.findMany({
    where: {
      workspaceId,
      channel: { in: ['WHATSAPP', 'INSTAGRAM', 'TIKTOK', 'EMAIL', 'PADDY_CHAT', 'FACEBOOK'] },
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { attachments: { select: { id: true, fileName: true, mimeType: true } } },
      },
      customer: true,
      assignee: true,
    },
  });
}

export type ConversationRow = Awaited<ReturnType<typeof loadRows>>[number];

export function toUiConversation(row: ConversationRow): Conversation {
  const { status, statusClass } = statusToUi[row.status];
  const uiChannel = channelToUi[row.channel];
  if (uiChannel === null) throw new InboxApiError(500, 'Unsupported channel.');
  const last = row.messages[row.messages.length - 1];
  const customerName = row.customer?.name ?? 'Unknown customer';
  return {
    id: row.id,
    name: customerName,
    channel: uiChannel,
    status,
    statusClass,
    time: timeAgo(last?.createdAt ?? row.createdAt),
    preview: row.preview ?? last?.text ?? '',
    assignee: row.assignee?.name ?? 'Unassigned',
    assigneeId: row.assigneeId ?? null,
    messages: row.messages.map((m) => ({
      who: m.kind === 'CUSTOMER' ? customerName : m.senderName,
      role: kindToRole(m.kind),
      text: m.text,
      kind: m.kind,
      attachments: m.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        mimeType: a.mimeType,
      })),
    })),
  };
}

export interface InboxSnapshot {
  conversations: Conversation[];
  unansweredIds: string[];
}

function snapshotOf(rows: ConversationRow[]): InboxSnapshot {
  return {
    conversations: rows.map(toUiConversation),
    // A conversation counts as answered once it has at least one STAFF reply.
    // Internal notes (NOTE/SYSTEM) never count as answers.
    unansweredIds: rows
      .filter((r) => !r.messages.some((m) => m.kind === 'STAFF'))
      .map((r) => r.id),
  };
}

export async function loadInbox(workspaceId: string): Promise<InboxSnapshot> {
  return snapshotOf(await loadRows(workspaceId));
}

export interface ReplyAttachment {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Emails the guest when staff reply to a Paddy Chat thread. Only fires when
 * the guest saved an email address with explicit consent. Failures never
 * break the reply itself — they are logged only.
 */
async function notifyGuestReply(conversationId: string): Promise<void> {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) return;
    const { Resend } = await import('resend');
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        workspace: { select: { id: true, name: true } },
      },
    });
    if (!conv || conv.channel !== 'PADDY_CHAT' || !conv.guestToken) return;
    if (!conv.customer?.contactConsentAt) return;
    const email = (conv.customer.contactDetail ?? '')
      .split(',')
      .map((p) => p.trim())
      .find((p) => p.toLowerCase().startsWith('email:'))
      ?.slice('email:'.length)
      .trim();
    if (!email) return;
    const from = process.env.RESEND_FROM_EMAIL ?? 'Business Paddy <onboarding@resend.dev>';
    const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
    const { error } = await new Resend(key).emails.send({
      from,
      to: email,
      subject: `New reply from ${conv.workspace.name}`,
      html:
        `<p>Hello ${conv.customer.name ?? 'there'},</p>` +
        `<p>${conv.workspace.name} has replied to your chat.</p>` +
        `<p><a href="${base}/chat/return/${conv.guestToken}">Open your conversation</a></p>` +
        `<p>Keep this link private — it opens your chat history.</p>`,
    });
    if (error) throw new Error(error.message);
    await prisma.auditLog.create({
      data: {
        workspaceId: conv.workspaceId,
        action: 'paddy_chat.reply_notified',
        entityType: 'Conversation',
        entityId: conversationId,
      },
    });
  } catch (e) {
    console.error('guest reply notification failed', e);
  }
}

/**
 * Assigns a conversation. Claiming (assigning to yourself) is open to every
 * staff role; assigning to someone else requires Owner or Manager.
 * Passing a null assigneeId unassigns back to the shared queue.
 */
export async function assignConversation(
  workspaceId: string,
  conversationId: string,
  assigneeId: string | null,
  actor: { userId: string; role: string },
): Promise<InboxSnapshot> {
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    select: { id: true },
  });
  if (!conv) throw new InboxApiError(404, 'Conversation not found.');

  const claimingSelf = assigneeId === actor.userId;
  const isManager = actor.role === 'OWNER' || actor.role === 'MANAGER';
  if (assigneeId !== null && !claimingSelf && !isManager) {
    throw new InboxApiError(403, 'Only owners and managers can assign to others.');
  }
  if (assigneeId !== null) {
    const target = await prisma.user.findFirst({
      where: { id: assigneeId, workspaceId },
      select: { id: true },
    });
    if (!target) throw new InboxApiError(404, 'Staff member not found.');
  }

  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: conversationId },
      data: { assigneeId },
    }),
    prisma.auditLog.create({
      data: {
        workspaceId,
        actorId: actor.userId,
        action: assigneeId === null ? 'conversation.unassigned' : 'conversation.assigned',
        entityType: 'Conversation',
        entityId: conversationId,
      },
    }),
  ]);

  return snapshotOf(await loadRows(workspaceId));
}

/**
 * Adds an internal staff note. Notes are staff-only: they are never sent to
 * any channel and guest thread views exclude them.
 */
export async function addNote(
  workspaceId: string,
  conversationId: string,
  text: string,
  sender: string,
): Promise<InboxSnapshot> {
  const trimmed = text.trim();
  if (!trimmed) throw new InboxApiError(400, 'Note text is required.');
  if (trimmed.length > 2000) throw new InboxApiError(400, 'Note is limited to 2000 characters.');
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    select: { id: true },
  });
  if (!conv) throw new InboxApiError(404, 'Conversation not found.');

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        kind: 'NOTE',
        senderName: sender,
        text: trimmed,
      },
    }),
    prisma.auditLog.create({
      data: {
        workspaceId,
        action: 'conversation.note_added',
        entityType: 'Conversation',
        entityId: conversationId,
      },
    }),
  ]);

  return snapshotOf(await loadRows(workspaceId));
}

/**
 * Marks a conversation resolved. Any authenticated staff member may resolve;
 * reopening happens automatically on the next customer message.
 */
export async function resolveConversation(
  workspaceId: string,
  conversationId: string,
): Promise<InboxSnapshot> {
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    select: { id: true },
  });
  if (!conv) throw new InboxApiError(404, 'Conversation not found.');

  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'RESOLVED' },
    }),
    prisma.auditLog.create({
      data: {
        workspaceId,
        action: 'conversation.resolved',
        entityType: 'Conversation',
        entityId: conversationId,
      },
    }),
  ]);

  return snapshotOf(await loadRows(workspaceId));
}

const ESCALATION_REASONS = [
  'Difficult customer',
  'Refund request',
  'Technical issue',
  'Complaint',
  'Needs approval',
  'Other',
];

/**
 * Escalates a conversation to a manager or the owner with a reason.
 * Any staff role may escalate (it is how juniors get help); the target must
 * be an Owner or Manager in the same workspace. The customer stays in the
 * same conversation with full context preserved.
 */
export async function escalateConversation(
  workspaceId: string,
  conversationId: string,
  managerId: string,
  reason: string,
  note: string,
  actorId: string,
): Promise<InboxSnapshot> {
  const trimmedReason = reason.trim();
  if (!ESCALATION_REASONS.includes(trimmedReason)) {
    throw new InboxApiError(400, 'A valid escalation reason is required.');
  }
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    select: { id: true },
  });
  if (!conv) throw new InboxApiError(404, 'Conversation not found.');
  const manager = await prisma.user.findFirst({
    where: { id: managerId, workspaceId, role: { in: ['OWNER', 'MANAGER'] } },
    select: { id: true, name: true },
  });
  if (!manager) throw new InboxApiError(404, 'Manager not found.');

  const trimmedNote = note.trim().slice(0, 2000);
  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'ESCALATED', assigneeId: managerId },
    }),
    prisma.message.create({
      data: {
        conversationId,
        kind: 'NOTE',
        senderName: 'System',
        text: `Escalated to ${manager.name}: ${trimmedReason}${trimmedNote ? ` — ${trimmedNote}` : ''}`,
      },
    }),
    prisma.auditLog.create({
      data: {
        workspaceId,
        actorId,
        action: 'conversation.escalated',
        entityType: 'Conversation',
        entityId: conversationId,
      },
    }),
  ]);

  return snapshotOf(await loadRows(workspaceId));
}

export async function saveReply(
  workspaceId: string,
  conversationId: string,
  text: string,
  sender: string,
  attachments: ReplyAttachment[] = [],
): Promise<InboxSnapshot> {
  const trimmed = text.trim();
  if (!trimmed && attachments.length === 0) {
    throw new InboxApiError(400, 'Reply text or an attachment is required.');
  }
  if (attachments.length > 5) throw new InboxApiError(400, 'At most 5 attachments per reply.');
  for (const a of attachments) {
    if (
      typeof a.storageKey !== 'string' ||
      typeof a.fileName !== 'string' ||
      typeof a.mimeType !== 'string' ||
      typeof a.sizeBytes !== 'number'
    ) {
      throw new InboxApiError(400, 'Invalid attachment.');
    }
  }

  const existing = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { messages: { select: { kind: true } } },
  });
  if (!existing) throw new InboxApiError(404, 'Conversation not found.');

  const hadStaffReply = existing.messages.some((m) => m.kind === 'STAFF');

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        kind: 'STAFF',
        senderName: sender,
        text: trimmed || '(attachment)',
        attachments: {
          create: attachments.map((a) => ({
            fileName: a.fileName.slice(0, 120),
            mimeType: a.mimeType.slice(0, 80),
            sizeBytes: Math.floor(a.sizeBytes),
            storageKey: a.storageKey,
          })),
        },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        preview: trimmed || `Sent ${attachments.length > 1 ? `${attachments.length} files` : attachments[0].fileName}`,
        // First reply moves an unanswered conversation to In progress.
        // Repeat replies never change the status again.
        ...(hadStaffReply ? {} : { status: 'IN_PROGRESS' as ConvStatus }),
      },
    }),
    prisma.auditLog.create({
      data: {
        workspaceId,
        action: 'conversation.replied',
        entityType: 'Conversation',
        entityId: conversationId,
      },
    }),
  ]);

  await notifyGuestReply(conversationId);

  return snapshotOf(await loadRows(workspaceId));
}

export { channelLabel };
