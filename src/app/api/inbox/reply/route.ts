import { NextResponse } from 'next/server';
import { saveReply, InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

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
