import { NextResponse } from 'next/server';
import { startGuestChat } from '@/server/paddyChat';
import { InboxApiError } from '@/server/inboxStore';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { workspaceId?: unknown; name?: unknown; text?: unknown };
    if (typeof body.workspaceId !== 'string') {
      return NextResponse.json({ error: 'A business is required.' }, { status: 400 });
    }
    const result = await startGuestChat(
      body.workspaceId,
      body.name as string,
      body.text as string,
    );
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/paddy-chat/start failed', e);
    return NextResponse.json({ error: 'Could not start the chat.' }, { status: 500 });
  }
}
