import { PrismaClient } from '@prisma/client';

// Neon pooled connections speak PgBouncer protocol, which breaks Prisma's
// prepared statements unless flagged. Add the flag automatically when the URL
// points at a pooler and doesn't already set it.
const rawUrl = process.env.DATABASE_URL ?? '';
if (rawUrl.includes('-pooler') && !rawUrl.includes('pgbouncer')) {
  process.env.DATABASE_URL = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}pgbouncer=true`;
}

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
