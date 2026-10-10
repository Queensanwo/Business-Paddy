import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  assignConversation,
  setConversationStatus,
  escalateConversation,
  loadInbox,
  InboxApiError,
} from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

/**
 * Runs a macro's actions server-side (assign, status, escalate).
 * The macro's text is inserted into the composer by the client so staff can
 * edit it before sending — only actions execute here.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as { conversationId?: unknown };
    if (typeof body.conversationId !== 'string') {
      return NextResponse.json({ error: 'A conversation is required.' }, { status: 400 });
    }
    const macro = await prisma.macro.findFirst({
      where: { id: params.id, workspaceId: staff.workspaceId },
    });
    if (!macro) throw new InboxApiError(404, 'Macro not found.');

    let snapshot = null;
    if (macro.assignUserId) {
      snapshot = await assignConversation(staff.workspaceId, body.conversationId, macro.assignUserId, {
        userId: staff.userId,
        role: staff.role,
      });
    }
    if (macro.status) {
      snapshot = await setConversationStatus(staff.workspaceId, body.conversationId, macro.status, staff.userId);
    }
    if (macro.escalateToId) {
      snapshot = await escalateConversation(
        staff.workspaceId,
        body.conversationId,
        macro.escalateToId,
        macro.escalateReason || 'Other',
        '',
        staff.userId,
      );
    }
    if (!snapshot) {
      snapshot = await loadInbox(staff.workspaceId);
    }
    return NextResponse.json({ snapshot, text: macro.body });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/macros/run failed', e);
    return NextResponse.json({ error: 'Could not run the macro.' }, { status: 500 });
  }
}
