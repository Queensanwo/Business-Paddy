import { AsyncLocalStorage } from 'node:async_hooks';
import type { Role } from '@prisma/client';

// Only trusted server routes may choose a workspace/role for a new login.
export const signupContext = new AsyncLocalStorage<{ workspaceId: string; role: Role }>();
