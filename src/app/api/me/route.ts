import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function GET() {
  try {
    const staff = await requireStaff();
    const workspace = await prisma.workspace.findUnique({
      where: { id: staff.workspaceId },
      select: { id: true, name: true, mode: true },
    });
    if (!workspace) throw new InboxApiError(404, 'Workspace not found.');
    return NextResponse.json({
      id: staff.userId,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceMode: workspace.mode,
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/me failed', e);
    return NextResponse.json({ error: 'Could not load the session.' }, { status: 500 });
  }
}
