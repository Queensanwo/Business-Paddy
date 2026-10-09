import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export async function GET() {
  try {
    const staff = await requireStaff();
    const replies = await prisma.savedReply.findMany({
      where: { workspaceId: staff.workspaceId },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, body: true },
    });
    return NextResponse.json({ replies });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/saved-replies failed', e);
    return NextResponse.json({ error: 'Could not load saved replies.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can create saved replies.' }, { status: 403 });
    }
    const body = (await req.json()) as { title?: unknown; body?: unknown };
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
    }
    if (typeof body.body !== 'string' || !body.body.trim()) {
      return NextResponse.json({ error: 'Reply text is required.' }, { status: 400 });
    }
    const title: string = body.title.trim();
    const replyBody: string = body.body.trim();
    if (title.length > 80 || replyBody.length > 2000) {
      return NextResponse.json({ error: 'Title (80) or body (2000) too long.' }, { status: 400 });
    }
    const reply = await prisma.$transaction(async (tx) => {
      const created = await tx.savedReply.create({
        data: {
          workspaceId: staff.workspaceId,
          title,
          body: replyBody,
          createdById: staff.userId,
        },
        select: { id: true, title: true, body: true },
      });
      await tx.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'saved_reply.created',
          entityType: 'SavedReply',
          entityId: created.id,
        },
      });
      return created;
    });
    return NextResponse.json({ reply });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/saved-replies failed', e);
    return NextResponse.json({ error: 'Could not create the saved reply.' }, { status: 500 });
  }
}
