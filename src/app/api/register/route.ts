import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/server/auth';
import { signupContext } from '@/server/signupContext';
import { checkRateLimit } from '@/server/rateLimit';
import { InboxApiError } from '@/server/inboxStore';

export async function POST(req: Request) {
  let workspaceId: string | undefined;
  try {
    await checkRateLimit(req, 'register', 5, 3600000);
    const body = await req.json();
    const workspaceKind = body.workspaceKind ?? 'BUSINESS';
    if (workspaceKind !== 'BUSINESS' && workspaceKind !== 'PROFESSIONAL') {
      throw new InboxApiError(400, 'Choose Business or Professional.');
    }
    if (typeof body.businessName !== 'string' || !body.businessName.trim() || body.businessName.length > 120 ||
        typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120 ||
        typeof body.email !== 'string' || body.email.length > 254 ||
        typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
      throw new InboxApiError(400, 'Enter a business name, your name, email and a password of 8–128 characters.');
    }
    const workspace = await prisma.workspace.create({ data: {
      name: body.businessName.trim(), industry: typeof body.industry === 'string' ? body.industry.trim().slice(0, 120) : null,
      // Real channel onboarding has its own verification gate. Signup never grants live sending.
      mode: 'DEMO',
      workspaceKind,
      ...(workspaceKind === 'PROFESSIONAL' ? { siteEnabled: false } : {}),
    } });
    workspaceId = workspace.id;
    const response = await signupContext.run({ workspaceId, role: 'OWNER' }, () => auth.api.signUpEmail({
      headers: req.headers, asResponse: true,
      body: { name: body.name.trim(), email: body.email.trim(), password: body.password },
    }));
    if (!response.ok) await prisma.workspace.delete({ where: { id: workspaceId } });
    return response;
  } catch (error) {
    if (workspaceId) {
      // Never delete a workspace if account creation succeeded before a later error.
      await prisma.workspace.deleteMany({ where: { id: workspaceId, users: { none: {} } } }).catch(() => {});
    }
    if (error instanceof InboxApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Could not create the account. Try again or sign in if already registered.' }, { status: 400 });
  }
}
