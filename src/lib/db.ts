import { PrismaClient } from '@prisma/client';

// Reuse one client across hot reloads in development.
// NOTE: the inbox UI still runs on mock data; this client is ready for the storage cutover step.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
