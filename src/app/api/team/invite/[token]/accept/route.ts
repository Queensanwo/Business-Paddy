import { NextResponse } from 'next/server';
import { acceptInvitation } from '@/server/invitations';
import { InboxApiError } from '@/server/inboxStore';
import { checkRateLimit } from '@/server/rateLimit';

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    checkRateLimit(req, 'invite-accept', 10, 3600000);
    const body = (await req.json()) as { password?: unknown };
    if (typeof body.password !== 'string') {
      return NextResponse.json({ error: 'A password is required.' }, { status: 400 });
    }
    return NextResponse.json(await acceptInvitation(params.token, body.password));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/team/invite/accept failed', e);
    return NextResponse.json({ error: 'Could not accept the invitation.' }, { status: 500 });
  }
}
