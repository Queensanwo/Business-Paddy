import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

async function ownedReply(workspaceId: string, id: string) {
  const row = await prisma.savedReply.findFirst({ where: { id, workspaceId } });
  if (!row) throw new InboxApiError(404, 'Saved reply not found.');
  return row;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can edit saved replies.' }, { status: 403 });
    }
    await ownedReply(staff.workspaceId, params.id);
    const body = (await req.json()) as { title?: unknown; body?: unknown };
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
    }
    if (typeof body.body !== 'string' || !body.body.trim()) {
      return NextResponse.json({ error: 'Reply text is required.' }, { status: 400 });
    }
    const reply = await prisma.savedReply.update({
      where: { id: params.id },
      data: { title: body.title.trim(), body: body.body.trim() },
      select: { id: true, title: true, body: true },
    });
    return NextResponse.json({ reply });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('PUT /api/saved-replies failed', e);
    return NextResponse.json({ error: 'Could not update the saved reply.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can delete saved replies.' }, { status: 403 });
    }
    await ownedReply(staff.workspaceId, params.id);
    await prisma.$transaction([
      prisma.savedReply.delete({ where: { id: params.id } }),
      prisma.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'saved_reply.deleted',
          entityType: 'SavedReply',
          entityId: params.id,
        },
      }),
    ]);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('DELETE /api/saved-replies failed', e);
    return NextResponse.json({ error: 'Could not delete the saved reply.' }, { status: 500 });
  }
}
