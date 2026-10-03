import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db';

// Server-only: never import this module (or @/lib/db) from client components.
// Secrets come from .env (BETTER_AUTH_SECRET, BETTER_AUTH_URL).
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
