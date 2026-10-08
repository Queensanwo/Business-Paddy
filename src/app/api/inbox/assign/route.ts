import { NextResponse } from 'next/server';
import { assignConversation } from '@/server/inboxStore';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as { conversationId?: unknown; assigneeId?: unknown };
    if (typeof body.conversationId !== 'string') {
      return NextResponse.json({ error: 'A conversation is required.' }, { status: 400 });
    }
    if (body.assigneeId !== null && typeof body.assigneeId !== 'string') {
      return NextResponse.json({ error: 'A staff member or null is required.' }, { status: 400 });
    }
    const snapshot = await assignConversation(
      staff.workspaceId,
      body.conversationId,
      body.assigneeId ?? null,
      { userId: staff.userId, role: staff.role },
    );
    return NextResponse.json(snapshot);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/inbox/assign failed', e);
    return NextResponse.json({ error: 'Could not assign the conversation.' }, { status: 500 });
  }
}
