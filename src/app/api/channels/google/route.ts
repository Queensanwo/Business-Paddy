import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { googleConfig, googleConsentUrl } from '@/server/gmail';

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export async function GET() {
  try {
    const staff = await requireStaff();
    const cfg = googleConfig();
    const accounts = await prisma.emailAccount.findMany({
      where: { workspaceId: staff.workspaceId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, emailAddress: true, createdAt: true },
    });
    return NextResponse.json({
      configured: !!cfg,
      accounts: accounts.map((a) => ({ id: a.id, emailAddress: a.emailAddress })),
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/channels/google failed', e);
    return NextResponse.json({ error: 'Could not load mailbox status.' }, { status: 500 });
  }
}

/** Starts OAuth: returns the Google consent URL (owner/manager only). */
export async function POST() {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can connect a mailbox.' }, { status: 403 });
    }
    const url = googleConsentUrl(staff.workspaceId, staff.userId);
    if (!url) {
      return NextResponse.json(
        { error: 'Google credentials are not set on the server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env and restart.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ authorizationUrl: url });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/channels/google failed', e);
    return NextResponse.json({ error: 'Could not start Google sign-in.' }, { status: 500 });
  }
}

/** Disconnects a mailbox. History stays; tokens are deleted. */
export async function DELETE(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can disconnect a mailbox.' }, { status: 403 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'A mailbox is required.' }, { status: 400 });
    const row = await prisma.emailAccount.findFirst({
      where: { id, workspaceId: staff.workspaceId },
      select: { id: true },
    });
    if (!row) throw new InboxApiError(404, 'Mailbox not found.');
    await prisma.$transaction([
      prisma.emailAccount.delete({ where: { id: row.id } }),
      prisma.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'channel.disconnected',
          entityType: 'EmailAccount',
          entityId: row.id,
        },
      }),
    ]);
    return NextResponse.json({ disconnected: true });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('DELETE /api/channels/google failed', e);
    return NextResponse.json({ error: 'Could not disconnect the mailbox.' }, { status: 500 });
  }
}
