import { NextResponse } from 'next/server';
import { escalateConversation } from '@/server/inboxStore';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as {
      conversationId?: unknown;
      managerId?: unknown;
      reason?: unknown;
      note?: unknown;
    };
    if (typeof body.conversationId !== 'string' || typeof body.managerId !== 'string') {
      return NextResponse.json({ error: 'A conversation and a manager are required.' }, { status: 400 });
    }
    const snapshot = await escalateConversation(
      staff.workspaceId,
      body.conversationId,
      body.managerId,
      typeof body.reason === 'string' ? body.reason : '',
      typeof body.note === 'string' ? body.note : '',
      staff.userId,
    );
    return NextResponse.json(snapshot);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/inbox/escalate failed', e);
    return NextResponse.json({ error: 'Could not escalate the conversation.' }, { status: 500 });
  }
}
