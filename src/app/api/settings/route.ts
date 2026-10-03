import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

function canManageSettings(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export async function GET() {
  try {
    const staff = await requireStaff();
    const workspace = await prisma.workspace.findUnique({
      where: { id: staff.workspaceId },
      select: { id: true, name: true, industry: true, mode: true },
    });
    if (!workspace) throw new InboxApiError(404, 'Workspace not found.');
    const owner = await prisma.user.findFirst({
      where: { workspaceId: staff.workspaceId, role: 'OWNER' },
      orderBy: { createdAt: 'asc' },
      select: { name: true, email: true },
    });
    return NextResponse.json({ workspace, owner });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/settings failed', e);
    return NextResponse.json({ error: 'Could not load settings.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageSettings(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can change settings.' }, { status: 403 });
    }
    const body = (await req.json()) as { name?: unknown; industry?: unknown };
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    }
    const workspace = await prisma.workspace.update({
      where: { id: staff.workspaceId },
      data: {
        name: body.name.trim(),
        industry: typeof body.industry === 'string' ? body.industry.trim() || null : undefined,
      },
      select: { id: true, name: true, industry: true, mode: true },
    });
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'workspace.settings_updated',
        entityType: 'Workspace',
        entityId: workspace.id,
      },
    });
    return NextResponse.json({ workspace });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('PUT /api/settings failed', e);
    return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });
  }
}
