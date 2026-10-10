import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { whatsappConfig, maskId } from '@/server/whatsapp';

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

async function statusFor(workspaceId: string) {
  const cfg = whatsappConfig();
  const link = await prisma.channelAccount.findFirst({
    where: { workspaceId, channel: 'WHATSAPP' },
    select: { id: true, providerAccountId: true, displayName: true, mirroringVerified: true },
  });
  return {
    configured: !!cfg,
    linked: !!link && !!cfg && link.providerAccountId === cfg.phoneNumberId,
    maskedNumber: cfg ? maskId(cfg.phoneNumberId) : null,
    displayName: link?.displayName ?? null,
    mirroringVerified: link?.mirroringVerified ?? false,
  };
}

export async function GET() {
  try {
    const staff = await requireStaff();
    return NextResponse.json(await statusFor(staff.workspaceId));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/channels/whatsapp failed', e);
    return NextResponse.json({ error: 'Could not load WhatsApp status.' }, { status: 500 });
  }
}

/**
 * Links this workspace to the configured WhatsApp test number.
 * Refuses demo workspaces (demo stays simulated) and unconfigured servers.
 */
export async function POST() {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can connect WhatsApp.' }, { status: 403 });
    }
    const cfg = whatsappConfig();
    if (!cfg) {
      return NextResponse.json(
        { error: 'WhatsApp credentials are not set on the server. Add them to .env and restart.' },
        { status: 503 },
      );
    }
    const ws = await prisma.workspace.findUnique({ where: { id: staff.workspaceId }, select: { mode: true } });
    if (!ws) throw new InboxApiError(404, 'Workspace not found.');
    if (ws.mode === 'DEMO') {
      return NextResponse.json(
        { error: 'Demo workspaces stay simulated. Switch to Live mode to connect a real number.' },
        { status: 400 },
      );
    }
    const existing = await prisma.channelAccount.findFirst({
      where: { workspaceId: staff.workspaceId, channel: 'WHATSAPP' },
      select: { id: true },
    });
    if (existing) {
      await prisma.channelAccount.update({
        where: { id: existing.id },
        data: { providerAccountId: cfg.phoneNumberId, displayName: 'WhatsApp test number' },
      });
    } else {
      await prisma.channelAccount.create({
        data: {
          workspaceId: staff.workspaceId,
          channel: 'WHATSAPP',
          providerAccountId: cfg.phoneNumberId,
          displayName: 'WhatsApp test number',
        },
      });
    }
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'channel.connected',
        entityType: 'ChannelAccount',
        entityId: `WHATSAPP:${maskId(cfg.phoneNumberId)}`,
      },
    });
    return NextResponse.json({ ...(await statusFor(staff.workspaceId)), note: 'Connected. Inbox replies on WhatsApp threads now send for real.' });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/channels/whatsapp failed', e);
    return NextResponse.json({ error: 'Could not connect WhatsApp.' }, { status: 500 });
  }
}

/** Unlinks WhatsApp. History stays; new replies save locally only. */
export async function DELETE() {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can disconnect WhatsApp.' }, { status: 403 });
    }
    await prisma.channelAccount.deleteMany({ where: { workspaceId: staff.workspaceId, channel: 'WHATSAPP' } });
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'channel.disconnected',
        entityType: 'ChannelAccount',
        entityId: 'WHATSAPP',
      },
    });
    return NextResponse.json(await statusFor(staff.workspaceId));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('DELETE /api/channels/whatsapp failed', e);
    return NextResponse.json({ error: 'Could not disconnect WhatsApp.' }, { status: 500 });
  }
}
