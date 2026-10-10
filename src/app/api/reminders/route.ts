import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

// Loose client access (see Phase 3 notes): `createdById` exists in the database;
// the generated client picks it up after the dev server restarts.
const db = prisma as unknown as {
  reminder: {
    findMany(args: unknown): Promise<ReminderRow[]>;
    create(args: unknown): Promise<ReminderRow>;
  };
};

export interface ReminderRow {
  id: string;
  title: string;
  conversationId: string | null;
  assignedToId: string | null;
  createdById: string | null;
  scheduledAt: Date;
  timezone: string | null;
  frequency: string | null;
  status: string;
  createdAt: Date;
  assignedTo?: { id: string; name: string } | null;
  conversation?: { id: string; preview: string | null } | null;
}

function canManageAll(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

const SELECT = {
  id: true,
  title: true,
  conversationId: true,
  assignedToId: true,
  createdById: true,
  scheduledAt: true,
  timezone: true,
  frequency: true,
  status: true,
  createdAt: true,
  assignedTo: { select: { id: true, name: true } },
  conversation: { select: { id: true, preview: true } },
};

/**
 * Lists internal reminders. Owners/managers see the whole workspace;
 * other staff see reminders assigned to them or created by them.
 * Supports ?conversationId= for the in-thread context view.
 */
export async function GET(req: Request) {
  try {
    const staff = await requireStaff();
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId');
    const where: Record<string, unknown> = { workspaceId: staff.workspaceId };
    if (conversationId) {
      const conv = await prisma.conversation.findFirst({
        where: { id: conversationId, workspaceId: staff.workspaceId },
        select: { id: true },
      });
      if (!conv) throw new InboxApiError(404, 'Conversation not found.');
      where.conversationId = conv.id;
    }
    if (!canManageAll(staff.role)) {
      where.OR = [{ assignedToId: staff.userId }, { createdById: staff.userId }];
    }
    const reminders = await db.reminder.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: 100,
      select: SELECT,
    });
    return NextResponse.json({ reminders });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/reminders failed', e);
    return NextResponse.json({ error: 'Could not load reminders.' }, { status: 500 });
  }
}

const FREQUENCIES = ['', 'once', 'daily', 'weekly'];

/**
 * Creates an internal staff reminder. Never sent to customers.
 * Non-managers may only assign to themselves; linking a conversation
 * moves it to Follow up (unless already resolved/escalated/etc.).
 */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as {
      title?: unknown;
      conversationId?: unknown;
      assignedToId?: unknown;
      scheduledAt?: unknown;
      timezone?: unknown;
      frequency?: unknown;
    };
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
    }
    const title = body.title.trim().slice(0, 120);
    if (typeof body.scheduledAt !== 'string' || Number.isNaN(Date.parse(body.scheduledAt))) {
      return NextResponse.json({ error: 'A valid date and time is required.' }, { status: 400 });
    }
    const scheduledAt = new Date(body.scheduledAt);
    const timezone = typeof body.timezone === 'string' ? body.timezone.trim().slice(0, 80) || null : null;
    const frequency = typeof body.frequency === 'string' && FREQUENCIES.includes(body.frequency) && body.frequency
      ? body.frequency
      : null;

    let conversationId: string | null = null;
    if (typeof body.conversationId === 'string' && body.conversationId) {
      const conv = await prisma.conversation.findFirst({
        where: { id: body.conversationId, workspaceId: staff.workspaceId },
        select: { id: true, status: true },
      });
      if (!conv) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
      conversationId = conv.id;
    }

    let assignedToId: string | null = staff.userId;
    if (typeof body.assignedToId === 'string' && body.assignedToId && body.assignedToId !== staff.userId) {
      if (!canManageAll(staff.role)) {
        return NextResponse.json({ error: 'Only owners and managers can assign reminders to others.' }, { status: 403 });
      }
      const target = await prisma.user.findFirst({
        where: { id: body.assignedToId, workspaceId: staff.workspaceId },
        select: { id: true },
      });
      if (!target) return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
      assignedToId = target.id;
    }

    const created = await db.reminder.create({
      data: {
        workspaceId: staff.workspaceId,
        conversationId,
        title,
        assignedToId,
        createdById: staff.userId,
        scheduledAt,
        timezone,
        frequency,
        status: 'SCHEDULED',
      },
      select: SELECT,
    });
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'reminder.created',
        entityType: 'Reminder',
        entityId: created.id,
      },
    });
    if (conversationId) {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { status: true },
      });
      if (conv && (conv.status === 'NEW' || conv.status === 'IN_PROGRESS' || conv.status === 'WAITING_FOR_CUSTOMER')) {
        await prisma.$transaction([
          prisma.conversation.update({ where: { id: conversationId }, data: { status: 'FOLLOW_UP' } }),
          prisma.auditLog.create({
            data: {
              workspaceId: staff.workspaceId,
              actorId: staff.userId,
              action: 'conversation.status_changed',
              entityType: 'Conversation',
              entityId: conversationId,
            },
          }),
        ]);
      }
    }
    return NextResponse.json({ reminder: created });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/reminders failed', e);
    return NextResponse.json({ error: 'Could not create the reminder.' }, { status: 500 });
  }
}
