import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { metaConfig, metaConsentUrl } from '@/server/meta';

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export async function GET() {
  try {
    const staff = await requireStaff();
    const cfg = metaConfig();
    const pages = await prisma.messengerPage.findMany({
      where: { workspaceId: staff.workspaceId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, pageName: true, instagramId: true },
    });
    return NextResponse.json({
      configured: !!cfg,
      pages: pages.map((p) => ({
        id: p.id,
        name: p.pageName ?? 'Facebook Page',
        instagram: !!p.instagramId,
      })),
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/channels/meta failed', e);
    return NextResponse.json({ error: 'Could not load Meta status.' }, { status: 500 });
  }
}

/** Starts Facebook Login (owner/manager only). */
export async function POST() {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can connect pages.' }, { status: 403 });
    }
    const url = metaConsentUrl(staff.workspaceId, staff.userId);
    if (!url) {
      return NextResponse.json(
        { error: 'Meta credentials are not set on the server. Add META_APP_ID to .env and restart.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ authorizationUrl: url });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/channels/meta failed', e);
    return NextResponse.json({ error: 'Could not start Facebook sign-in.' }, { status: 500 });
  }
}

/** Disconnects a page. History stays; tokens are deleted. */
export async function DELETE(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can disconnect pages.' }, { status: 403 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'A page is required.' }, { status: 400 });
    const row = await prisma.messengerPage.findFirst({
      where: { id, workspaceId: staff.workspaceId },
      select: { id: true, pageId: true, instagramId: true },
    });
    if (!row) throw new InboxApiError(404, 'Page not found.');
    await prisma.$transaction([
      prisma.messengerPage.delete({ where: { id: row.id } }),
      prisma.channelAccount.deleteMany({
        where: {
          workspaceId: staff.workspaceId,
          providerAccountId: { in: [row.pageId, row.instagramId].filter((v): v is string => !!v) },
        },
      }),
      prisma.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'channel.disconnected',
          entityType: 'MessengerPage',
          entityId: row.id,
        },
      }),
    ]);
    return NextResponse.json({ disconnected: true });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('DELETE /api/channels/meta failed', e);
    return NextResponse.json({ error: 'Could not disconnect the page.' }, { status: 500 });
  }
}
