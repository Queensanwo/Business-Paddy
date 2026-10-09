import { NextResponse } from 'next/server';
import { setConversationStatus } from '@/server/inboxStore';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as { conversationId?: unknown; status?: unknown };
    if (typeof body.conversationId !== 'string' || typeof body.status !== 'string') {
      return NextResponse.json({ error: 'A conversation and status are required.' }, { status: 400 });
    }
    const snapshot = await setConversationStatus(
      staff.workspaceId,
      body.conversationId,
      body.status,
      staff.userId,
    );
    return NextResponse.json(snapshot);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/inbox/status failed', e);
    return NextResponse.json({ error: 'Could not change the status.' }, { status: 500 });
  }
}
