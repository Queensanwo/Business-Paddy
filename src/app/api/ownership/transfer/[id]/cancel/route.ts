import { NextResponse } from 'next/server';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { cancelTransfer } from '@/server/ownership';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    await cancelTransfer(staff, params.id);
    return NextResponse.json({ cancelled: true });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/ownership/transfer/cancel failed', e);
    return NextResponse.json({ error: 'Could not cancel the handover.' }, { status: 500 });
  }
}
