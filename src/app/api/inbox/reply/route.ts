import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { saveReply, InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

const db = prisma as unknown as {
  workspace: {
    findUnique(args: unknown): Promise<{ requireTraineeApproval: boolean } | null>;
  };
};

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as {
      conversationId?: unknown;
      text?: unknown;
      attachments?: unknown;
    };
    if (typeof body.conversationId !== 'string' || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'conversationId and text are required.' }, { status: 400 });
    }
    // Approval enforcement (FR22): trainees send via the approval queue when
    // the owner requires it (default on). A conversation awaiting approval can
    // only be answered directly by an owner or manager.
    const conv = await prisma.conversation.findFirst({
      where: { id: body.conversationId, workspaceId: staff.workspaceId },
      select: { id: true, status: true },
    });
    if (!conv) throw new InboxApiError(404, 'Conversation not found.');
    if (conv.status === 'NEEDS_APPROVAL' && staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'This conversation is waiting for approval. Submit your reply for review instead.' },
        { status: 403 },
      );
    }
    if (staff.role === 'TRAINEE') {
      const ws = await db.workspace.findUnique({
        where: { id: staff.workspaceId },
        select: { requireTraineeApproval: true },
      });
      if (ws?.requireTraineeApproval !== false) {
        return NextResponse.json(
          { error: 'Trainee replies need approval. Submit your reply for review instead.' },
          { status: 403 },
        );
      }
    }
    const snapshot = await saveReply(
      staff.workspaceId,
      body.conversationId,
      body.text,
      staff.name,
      Array.isArray(body.attachments) ? (body.attachments as never[]) : [],
    );
    return NextResponse.json(snapshot);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/inbox/reply failed', e);
    return NextResponse.json({ error: 'Could not save the reply.' }, { status: 500 });
  }
}
