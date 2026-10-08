import { createHash, randomBytes } from 'node:crypto';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { auth } from '@/server/auth';
import { InboxApiError } from '@/server/inboxStore';

export const INVITATION_TTL_HOURS = 48;
export const INVITABLE_ROLES = ['MANAGER', 'AGENT', 'TRAINEE'] as const;

function resendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new InboxApiError(
      503,
      'Email is not configured. Add RESEND_API_KEY to .env and restart the app.',
    );
  }
  return new Resend(key);
}

function senderAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'Business Paddy <onboarding@resend.dev>';
}

function appUrl(): string {
  return process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface InvitationInfo {
  name: string;
  email: string;
  role: string;
  workspaceName: string;
  expiresAt: string;
}

/** Creates an invitation row and emails the single-use accept link. */
export async function createInvitation(
  workspaceId: string,
  createdById: string,
  input: { name: string; email: string; role: string },
): Promise<{ id: string; email: string }> {
  const name = input.name.trim();
  const email = input.email.trim();
  const role = input.role.toUpperCase();
  if (!name) throw new InboxApiError(400, 'Staff name is required.');
  if (!email.includes('@')) throw new InboxApiError(400, 'A valid staff email is required.');
  if (!(INVITABLE_ROLES as readonly string[]).includes(role)) {
    throw new InboxApiError(400, 'Role must be Manager, Agent or Trainee.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new InboxApiError(409, 'This email is already registered.');
  const pending = await prisma.staffInvitation.findFirst({
    where: { workspaceId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (pending) throw new InboxApiError(409, 'This email already has a pending invitation.');

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new InboxApiError(404, 'Workspace not found.');

  const token = randomBytes(32).toString('hex');
  const invitation = await prisma.staffInvitation.create({
    data: {
      workspaceId,
      email,
      name,
      role: role as 'MANAGER' | 'AGENT' | 'TRAINEE',
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITATION_TTL_HOURS * 3600 * 1000),
      createdById,
    },
  });

  const acceptUrl = `${appUrl()}/invite/${token}`;
  try {
    const { error } = await resendClient().emails.send({
      from: senderAddress(),
      to: email,
      subject: `You're invited to join ${workspace.name} on Business Paddy`,
      html:
        `<p>Hello ${name},</p>` +
        `<p>You've been invited to join <strong>${workspace.name}</strong> on Business Paddy as <strong>${role}</strong>.</p>` +
        `<p><a href="${acceptUrl}">Accept the invitation and set your password</a></p>` +
        `<p>This link expires in ${INVITATION_TTL_HOURS} hours and can only be used once. ` +
        `If you weren't expecting this, you can ignore this email.</p>`,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    await prisma.staffInvitation.delete({ where: { id: invitation.id } });
    if (e instanceof InboxApiError) throw e;
    throw new InboxApiError(502, 'Could not send the invitation email. Check the email configuration.');
  }

  await prisma.auditLog.create({
    data: {
      workspaceId,
      actorId: createdById,
      action: 'staff.invited',
      entityType: 'StaffInvitation',
      entityId: invitation.id,
    },
  });
  return { id: invitation.id, email };
}

/** Returns invitation details for the accept page, or throws 404/410. */
export async function getInvitation(token: string): Promise<InvitationInfo> {
  const row = await prisma.staffInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { workspace: { select: { name: true } } },
  });
  if (!row) throw new InboxApiError(404, 'Invitation not found.');
  if (row.acceptedAt) throw new InboxApiError(410, 'This invitation has already been used.');
  if (row.expiresAt.getTime() < Date.now()) {
    throw new InboxApiError(410, 'This invitation has expired. Ask for a new one.');
  }
  return {
    name: row.name,
    email: row.email,
    role: row.role,
    workspaceName: row.workspace.name,
    expiresAt: row.expiresAt.toISOString(),
  };
}

/** Accepts an invitation: marks it used (single-use) and creates the login. */
export async function acceptInvitation(
  token: string,
  password: string,
): Promise<{ email: string }> {
  if (typeof password !== 'string' || password.length < 8) {
    throw new InboxApiError(400, 'Password must be at least 8 characters.');
  }
  const tokenHash = hashToken(token);
  const row = await prisma.staffInvitation.findUnique({
    where: { tokenHash },
    include: { workspace: { select: { name: true } } },
  });
  if (!row) throw new InboxApiError(404, 'Invitation not found.');
  if (row.acceptedAt) throw new InboxApiError(410, 'This invitation has already been used.');
  if (row.expiresAt.getTime() < Date.now()) {
    throw new InboxApiError(410, 'This invitation has expired. Ask for a new one.');
  }
  const existingUser = await prisma.user.findUnique({ where: { email: row.email } });
  if (existingUser) throw new InboxApiError(409, 'This email is already registered.');

  // Single-use guard: only one accept can win.
  const claimed = await prisma.staffInvitation.updateMany({
    where: { id: row.id, acceptedAt: null },
    data: { acceptedAt: new Date() },
  });
  if (claimed.count === 0) throw new InboxApiError(410, 'This invitation has already been used.');

  const signup = await auth.api.signUpEmail({
    headers: new Headers(),
    body: {
      name: row.name,
      email: row.email,
      password,
      workspaceId: row.workspaceId,
      role: row.role,
    },
  });
  await prisma.auditLog.create({
    data: {
      workspaceId: row.workspaceId,
      actorId: signup.user.id,
      action: 'staff.invitation_accepted',
      entityType: 'User',
      entityId: signup.user.id,
    },
  });
  return { email: row.email };
}
