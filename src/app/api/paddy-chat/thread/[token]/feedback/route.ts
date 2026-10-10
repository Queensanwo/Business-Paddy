import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { threadByToken } from '@/server/paddyChat';
import { InboxApiError } from '@/server/inboxStore';
import { checkRateLimit } from '@/server/rateLimit';

const db = prisma as unknown as {
  workspace: {
    findUnique(args: unknown): Promise<{ feedbackEnabled: boolean } | null>;
  };
  conversation: {
    update(args: unknown): Promise<unknown>;
  };
};

/**
 * Guest one-tap rating after a resolved Paddy Chat (FR36).
 * Only when the business keeps feedback switched on (FR37).
 * Guests may change their mind — a new tap replaces the old rating.
 */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    checkRateLimit(req, 'paddy-feedback', 20, 3600000);
    const conv = await threadByToken(params.token);
    if (conv.status !== 'RESOLVED') {
      return NextResponse.json(
        { error: 'You can rate us after your chat is resolved.' },
        { status: 400 },
      );
    }
    const ws = await db.workspace.findUnique({
      where: { id: conv.workspaceId },
      select: { feedbackEnabled: true },
    });
    if (ws?.feedbackEnabled === false) {
      return NextResponse.json({ error: 'Ratings are switched off for this business.' }, { status: 400 });
    }
    const body = (await req.json()) as { rating?: unknown; comment?: unknown };
    if (body.rating !== 'HELPFUL' && body.rating !== 'NOT_HELPFUL') {
      return NextResponse.json({ error: 'Pick Helpful or Not helpful.' }, { status: 400 });
    }
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 500) || null : null;
    await prisma.$transaction([
      db.conversation.update({
        where: { id: conv.id },
        data: { rating: body.rating, feedbackComment: comment, feedbackAt: new Date() },
      }) as unknown as never,
      prisma.auditLog.create({
        data: {
          workspaceId: conv.workspaceId,
          action: 'feedback.received',
          entityType: 'Conversation',
          entityId: conv.id,
        },
      }),
    ]);
    return NextResponse.json({ saved: true });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/paddy-chat/thread/feedback failed', e);
    return NextResponse.json({ error: 'Could not save your rating.' }, { status: 500 });
  }
}
