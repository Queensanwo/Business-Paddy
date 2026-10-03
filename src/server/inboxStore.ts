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

// WEBSITE and PADDY_CHAT have no inbox filter/badge yet (planned channel
// work). Rows with those channels are excluded from the inbox until the UI
// supports them — never silently mislabelled.
const channelToUi: Record<DbChannel, Channel | null> = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  EMAIL: 'email',
  WEBSITE: null,
  PADDY_CHAT: null,
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
      channel: { in: ['WHATSAPP', 'INSTAGRAM', 'TIKTOK', 'EMAIL'] },
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      customer: true,
      assignee: true,
    },
  });
}

type ConversationRow = Awaited<ReturnType<typeof loadRows>>[number];

function toUiConversation(row: ConversationRow): Conversation {
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
    messages: row.messages.map((m) => ({
      who: m.kind === 'CUSTOMER' ? customerName : m.senderName,
      role: kindToRole(m.kind),
      text: m.text,
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

export async function saveReply(
  workspaceId: string,
  conversationId: string,
  text: string,
  sender: string,
): Promise<InboxSnapshot> {
  const trimmed = text.trim();
  if (!trimmed) throw new InboxApiError(400, 'Reply text is required.');

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
        text: trimmed,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        preview: trimmed,
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

  return snapshotOf(await loadRows(workspaceId));
}

export { channelLabel };
