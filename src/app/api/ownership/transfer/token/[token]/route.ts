import { NextResponse } from 'next/server';
import { InboxApiError } from '@/server/inboxStore';
import { transferByToken } from '@/server/ownership';
import { checkRateLimit } from '@/server/rateLimit';

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    checkRateLimit(req, 'transfer-view', 30, 3600000);
    return NextResponse.json(await transferByToken(params.token));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/ownership/transfer/token failed', e);
    return NextResponse.json({ error: 'Could not load the handover.' }, { status: 500 });
  }
}
