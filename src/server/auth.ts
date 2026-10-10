import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';

// Server-only: never import this module (or @/lib/db) from client components.
// Secrets come from .env (BETTER_AUTH_SECRET, BETTER_AUTH_URL).
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const key = process.env.RESEND_API_KEY;
      if (!key) throw new Error('Email is not configured.');
      await new Resend(key).emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'Business Paddy <onboarding@resend.dev>',
        to: user.email,
        subject: 'Reset your Business Paddy password',
        html:
          `<p>Hello ${user.name ?? 'there'},</p>` +
          `<p>Someone requested a password reset for your Business Paddy login.</p>` +
          `<p><a href="${url}">Choose a new password</a></p>` +
          `<p>This link expires soon and can only be used once. ` +
          `If that wasn't you, just ignore this email — your password stays the same.</p>`,
      });
    },
  },
  user: {
    additionalFields: {
      workspaceId: { type: 'string', required: true },
      role: { type: 'string', required: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Welcome email for new workspace owners only (staff invitees already
        // got an invitation email). Never breaks signup: failures are logged.
        after: async (user) => {
          try {
            const u = user as unknown as { id?: unknown; name?: unknown; email?: unknown; workspaceId?: unknown; role?: unknown };
            if (u.role !== 'OWNER' || typeof u.email !== 'string' || typeof u.workspaceId !== 'string') return;
            const key = process.env.RESEND_API_KEY;
            if (!key) return;
            const ws = await prisma.workspace.findUnique({
              where: { id: u.workspaceId },
              select: { id: true, name: true },
            });
            if (!ws) return;
            const base = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
            const name = typeof u.name === 'string' && u.name.trim() ? u.name.trim() : 'there';
            const { error } = await new Resend(key).emails.send({
              from: process.env.RESEND_FROM_EMAIL ?? 'Business Paddy <onboarding@resend.dev>',
              to: u.email,
              subject: `Welcome to Business Paddy, ${ws.name}`,
              html:
                `<p>Hello ${name},</p>` +
                `<p>Your workspace for <strong>${ws.name}</strong> is ready. Here are your two customer links — share them anywhere:</p>` +
                `<p>💬 Chat link (customers message you, no account needed):<br><a href="${base}/chat/${ws.id}">${base}/chat/${ws.id}</a></p>` +
                `<p>🏪 Business page (your public page with a chat button):<br><a href="${base}/site/${ws.id}">${base}/site/${ws.id}</a></p>` +
                `<p>Both links are also inside the app: the chat link is on the Workspace page, the business page is under Settings.</p>` +
                `<p>Note: on our email test setup, delivery can be limited — if this didn't arrive, your links are still safe inside the app.</p>`,
            });
            if (error) {
              console.error('owner welcome email rejected', error.message);
              return;
            }
            await prisma.auditLog.create({
              data: {
                workspaceId: ws.id,
                actorId: typeof u.id === 'string' ? u.id : null,
                action: 'owner.welcomed',
                entityType: 'User',
                entityId: typeof u.id === 'string' ? u.id : ws.id,
              },
            });
          } catch (e) {
            console.error('owner welcome email failed', e);
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
});

export type AuthSession = typeof auth.$Infer.Session;
