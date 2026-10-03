import { NextResponse } from 'next/server';
import { getGuestBusiness } from '@/server/paddyChat';
import { InboxApiError } from '@/server/inboxStore';

export async function GET(_req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    return NextResponse.json(await getGuestBusiness(params.workspaceId));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/paddy-chat/business failed', e);
    return NextResponse.json({ error: 'Could not load the business.' }, { status: 500 });
  }
}
