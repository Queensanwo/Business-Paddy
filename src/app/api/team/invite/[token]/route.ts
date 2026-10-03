import { NextResponse } from 'next/server';
import { getInvitation } from '@/server/invitations';
import { InboxApiError } from '@/server/inboxStore';

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    return NextResponse.json(await getInvitation(params.token));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/team/invite failed', e);
    return NextResponse.json({ error: 'Could not load the invitation.' }, { status: 500 });
  }
}
