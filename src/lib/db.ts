import { PrismaClient } from '@prisma/client';

// Neon pooled connections speak PgBouncer protocol, which breaks Prisma's
// prepared statements unless flagged. Add the flag automatically when the URL
// points at a pooler and doesn't already set it.
const rawUrl = process.env.DATABASE_URL ?? '';
if (rawUrl.includes('-pooler') && !rawUrl.includes('pgbouncer')) {
  process.env.DATABASE_URL = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}pgbouncer=true`;
}

// Customer data must never travel unencrypted outside this machine.
// Localhost may stay plain; anything else fails fast without SSL.
if (
  process.env.DATABASE_URL &&
  !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) &&
  !/sslmode=require/.test(process.env.DATABASE_URL)
) {
  throw new Error('DATABASE_URL must use sslmode=require for non-local databases.');
}

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
