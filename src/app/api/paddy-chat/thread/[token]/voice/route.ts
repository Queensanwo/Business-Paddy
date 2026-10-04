import { NextResponse } from 'next/server';
import { postGuestVoice } from '@/server/paddyChat';
import { InboxApiError } from '@/server/inboxStore';
import { checkRateLimit } from '@/server/rateLimit';

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    checkRateLimit(req, 'paddy-voice', 10, 3600000);
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A voice recording is required.' }, { status: 400 });
    }
    return NextResponse.json(await postGuestVoice(params.token, file));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/paddy-chat/thread/voice failed', e);
    return NextResponse.json({ error: 'Could not send the voice note.' }, { status: 500 });
  }
}
