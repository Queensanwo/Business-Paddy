import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loadInbox, InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

const db = prisma as unknown as {
  approvalRequest: {
    findFirst(args: unknown): Promise<{
      id: string;
      workspaceId: string;
      conversationId: string;
      text: string;
      status: string;
    } | null>;
    update(args: unknown): Promise<unknown>;
  };
};

function canReview(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

/** Reject a pending request: nothing is sent; a staff-only note records why. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (!canReview(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can reject replies.' }, { status: 403 });
    }
    const body = (await req.json().catch(() => ({}))) as { reason?: unknown };
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
    const row = await db.approvalRequest.findFirst({
      where: { id: params.id, workspaceId: staff.workspaceId },
    });
    if (!row) throw new InboxApiError(404, 'Approval not found.');
    if (row.status !== 'PENDING') {
      return NextResponse.json({ error: 'This request was already decided.' }, { status: 400 });
    }
    const conv = await prisma.conversation.findFirst({
      where: { id: row.conversationId, workspaceId: staff.workspaceId },
      select: { id: true },
    });
    if (!conv) throw new InboxApiError(404, 'Conversation not found.');
    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conv.id,
          kind: 'NOTE',
          senderName: 'System',
          text: `Approval rejected by ${staff.name}${reason ? `: ${reason}` : ''}`,
        },
      }),
      prisma.conversation.update({
        where: { id: conv.id },
        data: { status: 'IN_PROGRESS' },
      }),
      db.approvalRequest.update({
        where: { id: row.id },
        data: { status: 'REJECTED', reviewerId: staff.userId, decidedAt: new Date() },
      }) as unknown as never,
      prisma.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'approval.rejected',
          entityType: 'ApprovalRequest',
          entityId: row.id,
        },
      }),
    ]);
    return NextResponse.json({ rejected: true, snapshot: await loadInbox(staff.workspaceId) });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/approvals/reject failed', e);
    return NextResponse.json({ error: 'Could not reject.' }, { status: 500 });
  }
}
