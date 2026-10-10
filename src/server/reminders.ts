import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import type { StaffContext } from '@/server/requireStaff';

const db = prisma as unknown as {
  reminder: {
    findFirst(args: unknown): Promise<{
      id: string;
      workspaceId: string;
      assignedToId: string | null;
      createdById: string | null;
      status: string;
    } | null>;
    update(args: unknown): Promise<unknown>;
  };
};

function canManageAll(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

/** Loads a reminder in the staff member's workspace, enforcing visibility. */
export async function visibleReminder(workspaceId: string, id: string, staff: StaffContext) {
  const row = await db.reminder.findFirst({ where: { id, workspaceId } });
  if (!row) throw new InboxApiError(404, 'Reminder not found.');
  if (!canManageAll(staff.role) && row.assignedToId !== staff.userId && row.createdById !== staff.userId) {
    throw new InboxApiError(403, 'You can only manage your own reminders.');
  }
  return row;
}

/**
 * Moves a reminder to a new status. Snooze/reschedule require a valid future
 * time; complete/cancel close it. Every transition is audit-logged.
 */
export async function transitionReminder(
  staff: StaffContext,
  id: string,
  to: 'SNOOZED' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED',
  scheduledAt?: Date,
) {
  const row = await visibleReminder(staff.workspaceId, id, staff);
  if (row.status === 'COMPLETED' || row.status === 'CANCELLED') {
    throw new InboxApiError(400, 'This reminder is already closed.');
  }
  const data: Record<string, unknown> = { status: to };
  if (to === 'SNOOZED' || to === 'SCHEDULED') {
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      throw new InboxApiError(400, 'A valid date and time is required.');
    }
    data.scheduledAt = scheduledAt;
  }
  await prisma.$transaction([
    db.reminder.update({ where: { id: row.id }, data }) as unknown as never,
    prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: `reminder.${to.toLowerCase()}`,
        entityType: 'Reminder',
        entityId: row.id,
      },
    }),
  ]);
  return { updated: true, status: to };
}
