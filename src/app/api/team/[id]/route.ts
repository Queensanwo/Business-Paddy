import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

/**
 * Removes a staff member from the workspace. Their conversations return to
 * the shared queue (assignee cleared) and history is preserved.
 * Rules: nobody can remove themselves; the last owner cannot be removed;
 * managers can only remove agents and trainees (never owners or managers).
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Only owners and managers can remove staff.' }, { status: 403 });
    }
    if (params.id === staff.userId) {
      return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 });
    }
    const target = await prisma.user.findFirst({
      where: { id: params.id, workspaceId: staff.workspaceId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!target) throw new InboxApiError(404, 'Staff member not found.');
    if (staff.role === 'MANAGER' && (target.role === 'OWNER' || target.role === 'MANAGER')) {
      return NextResponse.json(
        { error: 'Managers can only remove agents and trainees.' },
        { status: 403 },
      );
    }
    if (target.role === 'OWNER') {
      const owners = await prisma.user.count({
        where: { workspaceId: staff.workspaceId, role: 'OWNER' },
      });
      if (owners <= 1) {
        return NextResponse.json(
          { error: 'The last owner cannot be removed. Transfer ownership first.' },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction([
      prisma.conversation.updateMany({
        where: { assigneeId: target.id },
        data: { assigneeId: null },
      }),
      prisma.reminder.updateMany({
        where: { assignedToId: target.id },
        data: { assignedToId: null },
      }),
      prisma.user.delete({ where: { id: target.id } }),
      prisma.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'staff.removed',
          entityType: 'User',
          entityId: target.id,
        },
      }),
    ]);
    return NextResponse.json({ removed: true, name: target.name });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('DELETE /api/team failed', e);
    return NextResponse.json({ error: 'Could not remove staff.' }, { status: 500 });
  }
}
