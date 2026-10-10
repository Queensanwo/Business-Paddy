import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

async function ownedMacro(workspaceId: string, id: string) {
  const row = await prisma.macro.findFirst({ where: { id, workspaceId } });
  if (!row) throw new InboxApiError(404, 'Macro not found.');
  return row;
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    const row = await ownedMacro(staff.workspaceId, params.id);
    const isManager = staff.role === 'OWNER' || staff.role === 'MANAGER';
    // Owners/managers may delete any macro; other staff may delete only their own.
    if (!isManager && row.createdById !== staff.userId) {
      return NextResponse.json({ error: 'You can only delete macros you created.' }, { status: 403 });
    }
    await prisma.$transaction([
      prisma.macro.delete({ where: { id: params.id } }),
      prisma.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'macro.deleted',
          entityType: 'Macro',
          entityId: params.id,
        },
      }),
    ]);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('DELETE /api/macros failed', e);
    return NextResponse.json({ error: 'Could not delete the macro.' }, { status: 500 });
  }
}
