import { headers } from 'next/headers';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';

export interface StaffContext {
  userId: string;
  workspaceId: string;
  role: string;
  name: string;
  email: string;
}

/** Resolves the signed-in staff member from the session cookie. Throws 401 when absent. */
export async function requireStaff(): Promise<StaffContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as
    | { id?: unknown; name?: unknown; email?: unknown; workspaceId?: unknown; role?: unknown }
    | undefined;
  if (
    !user ||
    typeof user.id !== 'string' ||
    typeof user.workspaceId !== 'string' ||
    typeof user.role !== 'string'
  ) {
    throw new InboxApiError(401, 'Sign in required.');
  }
  // Removed or deleted staff lose access immediately, even if their session
  // cookie has not expired yet. Role/workspace always come from the database,
  // never from the session alone.
  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, workspaceId: true, role: true },
  });
  if (!current) {
    throw new InboxApiError(401, 'Sign in required.');
  }
  return {
    userId: current.id,
    workspaceId: current.workspaceId,
    role: current.role,
    name: current.name,
    email: current.email,
  };
}
