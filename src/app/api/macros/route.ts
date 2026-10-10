import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

const SELECT = {
  id: true,
  title: true,
  body: true,
  assignUserId: true,
  status: true,
  escalateToId: true,
  escalateReason: true,
  createdById: true,
} as const;

export async function GET() {
  try {
    const staff = await requireStaff();
    const macros = await prisma.macro.findMany({
      where: { workspaceId: staff.workspaceId },
      orderBy: { title: 'asc' },
      select: SELECT,
    });
    return NextResponse.json({ macros });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/macros failed', e);
    return NextResponse.json({ error: 'Could not load macros.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Every staff role may develop macros; they stay scoped to the workspace
    // and every creation is audit-logged with its author.
    const staff = await requireStaff();
    const body = (await req.json()) as {
      title?: unknown;
      body?: unknown;
      assignUserId?: unknown;
      status?: unknown;
      escalateToId?: unknown;
      escalateReason?: unknown;
    };
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
    }
    const title = body.title.trim();
    const text = typeof body.body === 'string' ? body.body.trim().slice(0, 2000) : '';
    const assignUserId = typeof body.assignUserId === 'string' && body.assignUserId ? body.assignUserId : null;
    const status = typeof body.status === 'string' && body.status ? body.status : null;
    const escalateToId = typeof body.escalateToId === 'string' && body.escalateToId ? body.escalateToId : null;
    const escalateReason = typeof body.escalateReason === 'string' && body.escalateReason ? body.escalateReason : null;
    if (title.length > 80) {
      return NextResponse.json({ error: 'Title too long.' }, { status: 400 });
    }
    if (!text && !assignUserId && !status && !escalateToId) {
      return NextResponse.json({ error: 'A macro needs text or at least one action.' }, { status: 400 });
    }
    if (assignUserId) {
      const target = await prisma.user.findFirst({
        where: { id: assignUserId, workspaceId: staff.workspaceId },
        select: { id: true },
      });
      if (!target) return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
    }
    if (escalateToId) {
      const target = await prisma.user.findFirst({
        where: { id: escalateToId, workspaceId: staff.workspaceId, role: { in: ['OWNER', 'MANAGER'] } },
        select: { id: true },
      });
      if (!target) return NextResponse.json({ error: 'Escalation manager not found.' }, { status: 404 });
    }
    const macro = await prisma.$transaction(async (tx) => {
      const created = await tx.macro.create({
        data: {
          workspaceId: staff.workspaceId,
          title,
          body: text,
          assignUserId,
          status: status as 'NEW' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'FOLLOW_UP' | 'NEEDS_APPROVAL' | 'ESCALATED' | 'RESOLVED' | null,
          escalateToId,
          escalateReason,
          createdById: staff.userId,
        },
        select: SELECT,
      });
      await tx.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'macro.created',
          entityType: 'Macro',
          entityId: created.id,
        },
      });
      return created;
    });
    return NextResponse.json({ macro });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/macros failed', e);
    return NextResponse.json({ error: 'Could not create the macro.' }, { status: 500 });
  }
}
