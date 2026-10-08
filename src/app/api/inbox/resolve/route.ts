import { NextResponse } from 'next/server';
import { resolveConversation } from '@/server/inboxStore';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as { conversationId?: unknown };
    if (typeof body.conversationId !== 'string') {
      return NextResponse.json({ error: 'A conversation is required.' }, { status: 400 });
    }
    const snapshot = await resolveConversation(staff.workspaceId, body.conversationId);
    return NextResponse.json(snapshot);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/inbox/resolve failed', e);
    return NextResponse.json({ error: 'Could not resolve the conversation.' }, { status: 500 });
  }
}
