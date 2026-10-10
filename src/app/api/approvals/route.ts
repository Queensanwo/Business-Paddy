import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loadInbox, InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

const db = prisma as unknown as {
  approvalRequest: {
    findMany(args: unknown): Promise<ApprovalRow[]>;
    create(args: unknown): Promise<ApprovalRow>;
  };
  conversation: typeof prisma.conversation;
  message: typeof prisma.message;
  auditLog: typeof prisma.auditLog;
};

export interface ApprovalRow {
  id: string;
  conversationId: string;
  text: string;
  requestedById: string | null;
  status: string;
  reviewerId: string | null;
  createdAt: Date;
  decidedAt: Date | null;
}

function canReview(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export async function GET(req: Request) {
  try {
    const staff = await requireStaff();
    const url = new URL(req.url);
    const status = (url.searchParams.get('status') ?? 'PENDING').toUpperCase();
    const where: Record<string, unknown> = { workspaceId: staff.workspaceId };
    if (status !== 'ALL') where.status = 'PENDING';
    if (!canReview(staff.role)) where.requestedById = staff.userId;
    const approvals = await db.approvalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ approvals });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/approvals failed', e);
    return NextResponse.json({ error: 'Could not load approvals.' }, { status: 500 });
  }
}

/**
 * Submit reply text for approval (FR22). Any staff role may submit; the
 * conversation moves to Needs approval and nothing is sent to the customer.
 */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as { conversationId?: unknown; text?: unknown };
    if (typeof body.conversationId !== 'string' || !body.conversationId) {
      return NextResponse.json({ error: 'A conversation is required.' }, { status: 400 });
    }
    if (typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json({ error: 'Reply text is required.' }, { status: 400 });
    }
    const text = body.text.trim();
    if (text.length > 2000) {
      return NextResponse.json({ error: 'Reply is limited to 2000 characters.' }, { status: 400 });
    }
    const conv = await prisma.conversation.findFirst({
      where: { id: body.conversationId, workspaceId: staff.workspaceId },
      select: { id: true },
    });
    if (!conv) throw new InboxApiError(404, 'Conversation not found.');
    const created = await db.approvalRequest.create({
      data: {
        workspaceId: staff.workspaceId,
        conversationId: conv.id,
        text,
        requestedById: staff.userId,
        status: 'PENDING',
      },
    });
    await prisma.$transaction([
      prisma.conversation.update({
        where: { id: conv.id },
        data: { status: 'NEEDS_APPROVAL' },
      }),
      prisma.auditLog.create({
        data: {
          workspaceId: staff.workspaceId,
          actorId: staff.userId,
          action: 'approval.requested',
          entityType: 'ApprovalRequest',
          entityId: created.id,
        },
      }),
    ]);
    return NextResponse.json({ approval: created, snapshot: await loadInbox(staff.workspaceId) });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/approvals failed', e);
    return NextResponse.json({ error: 'Could not submit for approval.' }, { status: 500 });
  }
}
