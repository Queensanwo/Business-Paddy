import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createInvitation } from '@/server/invitations';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

function canManageTeam(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export async function GET() {
  try {
    const staff = await requireStaff();
    if (!canManageTeam(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can view the team.' }, { status: 403 });
    }
    const users = await prisma.user.findMany({
      where: { workspaceId: staff.workspaceId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json({ users });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/team failed', e);
    return NextResponse.json({ error: 'Could not load the team.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageTeam(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can invite staff.' }, { status: 403 });
    }
    const body = (await req.json()) as { name?: unknown; email?: unknown; role?: unknown };
    if (typeof body.name !== 'string' || typeof body.role !== 'string') {
      return NextResponse.json({ error: 'Name, email and role are required.' }, { status: 400 });
    }
    // Sends a secure single-use expiring accept link by email. No passwords
    // are created or emailed here — the invitee sets their own password.
    const invitation = await createInvitation(staff.workspaceId, staff.userId, {
      name: body.name,
      email: typeof body.email === 'string' ? body.email : '',
      role: body.role,
    });
    return NextResponse.json({ invitation });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/team/invite failed', e);
    return NextResponse.json({ error: 'Could not invite staff.' }, { status: 500 });
  }
}
