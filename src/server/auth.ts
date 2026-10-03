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
  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
});

export type AuthSession = typeof auth.$Infer.Session;
