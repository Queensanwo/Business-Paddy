import { createHash, randomBytes } from 'node:crypto';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { auth } from '@/server/auth';
import { InboxApiError } from '@/server/inboxStore';
import type { StaffContext } from '@/server/requireStaff';

export const TRANSFER_TTL_HOURS = 72;

const db = prisma as unknown as {
  ownershipTransfer: {
    findFirst(args: unknown): Promise<TransferRow | null>;
    findMany(args: unknown): Promise<TransferRow[]>;
    create(args: unknown): Promise<TransferRow>;
    update(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
};

export interface TransferRow {
  id: string;
  workspaceId: string;
  initiatedById: string | null;
  recipientEmail: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

function appUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

/** Verifies the owner's password without touching their current session. */
async function reauthenticate(email: string, password: string): Promise<void> {
  try {
    await auth.api.signInEmail({
      headers: new Headers({ origin: appUrl() }),
      body: { email, password },
    });
  } catch {
    throw new InboxApiError(401, 'Your password did not match. The transfer was not started.');
  }
}

/**
 * Starts an ownership handover. Only the current owner, with password
 * re-authentication. Previous pending transfers are cancelled.
 * The recipient must already be staff in the same workspace.
 */
export async function initiateTransfer(
  staff: StaffContext,
  input: { recipientEmail?: unknown; password?: unknown },
): Promise<{ id: string; acceptUrl: string; emailed: boolean }> {
  if (staff.role !== 'OWNER') {
    throw new InboxApiError(403, 'Only the workspace owner can hand over ownership.');
  }
  if (typeof input.password !== 'string' || !input.password) {
    throw new InboxApiError(400, 'Confirm with your password to start the handover.');
  }
  if (typeof input.recipientEmail !== 'string' || !input.recipientEmail.includes('@')) {
    throw new InboxApiError(400, 'A valid recipient email is required.');
  }
  await reauthenticate(staff.email, input.password);

  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  if (recipientEmail === staff.email.toLowerCase()) {
    throw new InboxApiError(400, 'You already own this workspace.');
  }
  const recipient = await prisma.user.findFirst({
    where: { workspaceId: staff.workspaceId, email: recipientEmail },
    select: { id: true, name: true, role: true },
  });
  if (!recipient) {
    throw new InboxApiError(404, 'That person is not staff in this workspace yet. Invite them first.');
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: staff.workspaceId } });
  if (!workspace) throw new InboxApiError(404, 'Workspace not found.');

  const token = randomBytes(32).toString('hex');
  const transfer = await db.ownershipTransfer.create({
    data: {
      workspaceId: staff.workspaceId,
      initiatedById: staff.userId,
      recipientEmail,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + TRANSFER_TTL_HOURS * 3600 * 1000),
    },
  });
  // One pending handover at a time — starting a new one cancels the old.
  await db.ownershipTransfer.updateMany({
    where: { workspaceId: staff.workspaceId, acceptedAt: null, cancelledAt: null, id: { not: transfer.id } },
    data: { cancelledAt: new Date() },
  });

  const acceptUrl = `${appUrl()}/transfer/${token}`;
  let emailed = false;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const { error } = await new Resend(key).emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'Business Paddy <onboarding@resend.dev>',
        to: recipientEmail,
        subject: `Ownership of ${workspace.name} on Business Paddy`,
        html:
          `<p>Hello ${recipient.name},</p>` +
          `<p>${staff.name} is handing over ownership of <strong>${workspace.name}</strong> to you.</p>` +
          `<p><a href="${acceptUrl}">Review and accept ownership</a></p>` +
          `<p>Sign in first if asked, then accept explicitly. This link expires in ${TRANSFER_TTL_HOURS} hours and can only be used once. ` +
          `Until you accept, nothing changes.</p>`,
      });
      if (error) throw new Error(error.message);
      emailed = true;
    } catch (e) {
      console.error('ownership transfer email failed (link still valid)', e);
    }
  }
  await prisma.auditLog.create({
    data: {
      workspaceId: staff.workspaceId,
      actorId: staff.userId,
      action: 'ownership.transfer_initiated',
      entityType: 'OwnershipTransfer',
      entityId: transfer.id,
    },
  });
  return { id: transfer.id, acceptUrl, emailed };
}

/** Details for the accept page (token required, no login needed to view). */
export async function transferByToken(token: string): Promise<{
  workspaceName: string;
  recipientEmail: string;
  expiresAt: Date;
  initiatorName: string;
}> {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) throw new InboxApiError(404, 'Handover link not found.');
  const row = await db.ownershipTransfer.findFirst({
    where: { tokenHash: createHash('sha256').update(token).digest('hex') },
  });
  if (!row) throw new InboxApiError(404, 'Handover link not found.');
  if (row.acceptedAt) throw new InboxApiError(410, 'This handover is already complete.');
  if (row.cancelledAt) throw new InboxApiError(410, 'This handover was cancelled.');
  if (row.expiresAt.getTime() < Date.now()) throw new InboxApiError(410, 'This link has expired. Ask the owner for a new one.');
  const workspace = await prisma.workspace.findUnique({ where: { id: row.workspaceId }, select: { name: true } });
  const initiator = row.initiatedById
    ? await prisma.user.findUnique({ where: { id: row.initiatedById }, select: { name: true } })
    : null;
  return {
    workspaceName: workspace?.name ?? 'Business Paddy',
    recipientEmail: row.recipientEmail,
    expiresAt: row.expiresAt,
    initiatorName: initiator?.name ?? 'The current owner',
  };
}

/**
 * Accepts a handover. The acceptor must be signed in as the invited staff
 * member. Atomically: acceptor becomes the single OWNER, every other owner
 * (including the initiator) becomes MANAGER. Connected social, email and
 * payment accounts do NOT move — the new owner must reconnect them.
 */
export async function acceptTransfer(token: string, staff: StaffContext): Promise<void> {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) throw new InboxApiError(404, 'Handover link not found.');
  const row = await db.ownershipTransfer.findFirst({
    where: { tokenHash: createHash('sha256').update(token).digest('hex') },
  });
  if (!row) throw new InboxApiError(404, 'Handover link not found.');
  if (row.acceptedAt) throw new InboxApiError(410, 'This handover is already complete.');
  if (row.cancelledAt) throw new InboxApiError(410, 'This handover was cancelled.');
  if (row.expiresAt.getTime() < Date.now()) throw new InboxApiError(410, 'This link has expired.');
  if (row.workspaceId !== staff.workspaceId || staff.email.toLowerCase() !== row.recipientEmail) {
    throw new InboxApiError(403, 'This handover invitation is not for your account.');
  }
  // Single-use guard: only one accept can win.
  const claimed = await db.ownershipTransfer.updateMany({
    where: { id: row.id, acceptedAt: null, cancelledAt: null },
    data: { acceptedAt: new Date() },
  });
  if (claimed.count === 0) throw new InboxApiError(410, 'This handover is already complete.');
  await prisma.$transaction([
    prisma.user.update({ where: { id: staff.userId }, data: { role: 'OWNER' } }),
    prisma.user.updateMany({
      where: { workspaceId: staff.workspaceId, role: 'OWNER', id: { not: staff.userId } },
      data: { role: 'MANAGER' },
    }),
    prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'ownership.transfer_accepted',
        entityType: 'OwnershipTransfer',
        entityId: row.id,
      },
    }),
  ]);
}

/** Cancels the pending handover. Owner only; the recipient is not notified by email. */
export async function cancelTransfer(staff: StaffContext, id: string): Promise<void> {
  if (staff.role !== 'OWNER') throw new InboxApiError(403, 'Only the workspace owner can cancel the handover.');
  const row = await db.ownershipTransfer.findFirst({ where: { id, workspaceId: staff.workspaceId } });
  if (!row) throw new InboxApiError(404, 'Handover not found.');
  if (row.acceptedAt || row.cancelledAt) throw new InboxApiError(400, 'This handover is already closed.');
  await db.ownershipTransfer.update({ where: { id: row.id }, data: { cancelledAt: new Date() } });
  await prisma.auditLog.create({
    data: {
      workspaceId: staff.workspaceId,
      actorId: staff.userId,
      action: 'ownership.transfer_cancelled',
      entityType: 'OwnershipTransfer',
      entityId: row.id,
    },
  });
}

/** The pending handover for this workspace, if any (owner + managers can see). */
export async function pendingTransfer(staff: StaffContext) {
  if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') return null;
  const row = await db.ownershipTransfer.findFirst({
    where: { workspaceId: staff.workspaceId, acceptedAt: null, cancelledAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) return null;
  return { id: row.id, recipientEmail: row.recipientEmail, expiresAt: row.expiresAt };
}
