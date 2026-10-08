import { NextResponse } from 'next/server';
import { getInvitation } from '@/server/invitations';
import { InboxApiError } from '@/server/inboxStore';
import { checkRateLimit } from '@/server/rateLimit';

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    checkRateLimit(req, 'invite-info', 30, 3600000);
    return NextResponse.json(await getInvitation(params.token));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/team/invite failed', e);
    return NextResponse.json({ error: 'Could not load the invitation.' }, { status: 500 });
  }
}
