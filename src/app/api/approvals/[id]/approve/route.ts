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

/** Approve a pending request: the approved text is sent as the staff reply. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (!canReview(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can approve replies.' }, { status: 403 });
    }
    const row = await db.approvalRequest.findFirst({
      where: { id: params.id, workspaceId: staff.workspaceId },
    });
    if (!row) throw new InboxApiError(404, 'Approval not found.');
    if (row.status !== 'PENDING') {
      return NextResponse.json({ error: 'This request was already decided.' }, { status: 400 });
    }
    const conv = await prisma.conversation.findFirst({
      where: { id: row.conversationId, workspaceId: staff.workspaceId },
      include: { messages: { select: { kind: true } } },
    });
    if (!conv) throw new InboxApiError(404, 'Conversation not found.');
    const hadStaffReply = conv.messages.some((m) => m.kind === 'STAFF');
    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conv.id,
          kind: 'STAFF',
          senderName: staff.name,
          text: row.text,
        },
      }),
      prisma.conversation.update({
        where: { id: conv.id },
        data: {
          preview: row.text.slice(0, 200),
          status: hadStaffReply ? 'IN_PROGRESS' : 'IN_PROGRESS',
        },
      }),
      db.approvalRequest.update({
        where: { id: row.id },
        data: { status: 'APPROVED', reviewerId: staff.userId, decidedAt: new Date() },
      }) as unknown as never,
      prisma.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'approval.approved',
          entityType: 'ApprovalRequest',
          entityId: row.id,
        },
      }),
    ]);
    return NextResponse.json({ approved: true, snapshot: await loadInbox(staff.workspaceId) });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/approvals/approve failed', e);
    return NextResponse.json({ error: 'Could not approve.' }, { status: 500 });
  }
}
