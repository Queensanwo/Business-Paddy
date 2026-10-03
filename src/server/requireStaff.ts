import { headers } from 'next/headers';
import { auth } from '@/server/auth';
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
  return {
    userId: user.id,
    workspaceId: user.workspaceId,
    role: user.role,
    name: typeof user.name === 'string' ? user.name : 'Staff',
    email: typeof user.email === 'string' ? user.email : '',
  };
}
