import { NextResponse } from 'next/server';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { acceptTransfer } from '@/server/ownership';

export async function POST(_req: Request, { params }: { params: { token: string } }) {
  try {
    const staff = await requireStaff();
    await acceptTransfer(params.token, staff);
    return NextResponse.json({
      accepted: true,
      note: 'You are now the owner. Reconnect any social, email or payment accounts — they do not move automatically.',
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/ownership/transfer/accept failed', e);
    return NextResponse.json({ error: 'Could not accept the handover.' }, { status: 500 });
  }
}
