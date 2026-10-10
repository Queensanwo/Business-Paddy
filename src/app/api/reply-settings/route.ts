import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

const db = prisma as unknown as {
  workspace: {
    findUnique(args: unknown): Promise<ReplySettings | null>;
    update(args: unknown): Promise<ReplySettings>;
  };
  auditLog: typeof prisma.auditLog;
};

export interface ReplySettings {
  toneGuidance: string | null;
  autoReplyEnabled: boolean;
  autoReplyGreeting: string | null;
  requireTraineeApproval: boolean;
}

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export async function GET() {
  try {
    const staff = await requireStaff();
    const ws = await db.workspace.findUnique({
      where: { id: staff.workspaceId },
      select: {
        toneGuidance: true,
        autoReplyEnabled: true,
        autoReplyGreeting: true,
        requireTraineeApproval: true,
      },
    });
    if (!ws) throw new InboxApiError(404, 'Workspace not found.');
    return NextResponse.json({ settings: ws });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/reply-settings failed', e);
    return NextResponse.json({ error: 'Could not load reply settings.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can change reply settings.' }, { status: 403 });
    }
    const body = (await req.json()) as {
      toneGuidance?: unknown;
      autoReplyEnabled?: unknown;
      autoReplyGreeting?: unknown;
      requireTraineeApproval?: unknown;
    };
    const toneGuidance =
      typeof body.toneGuidance === 'string' ? body.toneGuidance.trim().slice(0, 500) || null : undefined;
    const autoReplyGreeting =
      typeof body.autoReplyGreeting === 'string' ? body.autoReplyGreeting.trim().slice(0, 500) || null : undefined;
    if (typeof body.autoReplyEnabled !== 'undefined' && typeof body.autoReplyEnabled !== 'boolean') {
      return NextResponse.json({ error: 'autoReplyEnabled must be true or false.' }, { status: 400 });
    }
    if (typeof body.requireTraineeApproval !== 'undefined' && typeof body.requireTraineeApproval !== 'boolean') {
      return NextResponse.json({ error: 'requireTraineeApproval must be true or false.' }, { status: 400 });
    }
    const ws = await db.workspace.update({
      where: { id: staff.workspaceId },
      data: {
        ...(toneGuidance !== undefined ? { toneGuidance } : {}),
        ...(typeof body.autoReplyEnabled === 'boolean' ? { autoReplyEnabled: body.autoReplyEnabled } : {}),
        ...(autoReplyGreeting !== undefined ? { autoReplyGreeting } : {}),
        ...(typeof body.requireTraineeApproval === 'boolean'
          ? { requireTraineeApproval: body.requireTraineeApproval }
          : {}),
      },
      select: {
        toneGuidance: true,
        autoReplyEnabled: true,
        autoReplyGreeting: true,
        requireTraineeApproval: true,
      },
    });
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'reply_settings.updated',
        entityType: 'Workspace',
        entityId: staff.workspaceId,
      },
    });
    return NextResponse.json({ settings: ws });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('PUT /api/reply-settings failed', e);
    return NextResponse.json({ error: 'Could not save reply settings.' }, { status: 500 });
  }
}
