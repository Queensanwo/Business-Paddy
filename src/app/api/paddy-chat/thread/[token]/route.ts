import { NextResponse } from 'next/server';
import { getGuestThread } from '@/server/paddyChat';
import { InboxApiError } from '@/server/inboxStore';

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    return NextResponse.json(await getGuestThread(params.token));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/paddy-chat/thread failed', e);
    return NextResponse.json({ error: 'Could not load the chat.' }, { status: 500 });
  }
}
