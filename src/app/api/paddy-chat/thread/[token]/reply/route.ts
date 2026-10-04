import { NextResponse } from 'next/server';
import { postGuestReply } from '@/server/paddyChat';
import { InboxApiError } from '@/server/inboxStore';
import { checkRateLimit } from '@/server/rateLimit';

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    checkRateLimit(req, 'paddy-reply', 30, 3600000);
    const body = (await req.json()) as { text?: unknown };
    if (typeof body.text !== 'string') {
      return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
    }
    return NextResponse.json(await postGuestReply(params.token, body.text));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/paddy-chat/thread/reply failed', e);
    return NextResponse.json({ error: 'Could not send the message.' }, { status: 500 });
  }
}
