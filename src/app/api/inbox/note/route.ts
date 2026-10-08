import { NextResponse } from 'next/server';
import { addNote } from '@/server/inboxStore';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as { conversationId?: unknown; text?: unknown };
    if (typeof body.conversationId !== 'string' || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'A conversation and note text are required.' }, { status: 400 });
    }
    const snapshot = await addNote(staff.workspaceId, body.conversationId, body.text, staff.name);
    return NextResponse.json(snapshot);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/inbox/note failed', e);
    return NextResponse.json({ error: 'Could not save the note.' }, { status: 500 });
  }
}
