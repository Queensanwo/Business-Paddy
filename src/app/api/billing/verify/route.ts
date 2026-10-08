import { NextResponse } from 'next/server';
import { verifyTestPayment } from '@/server/billing';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function GET(req: Request) {
  try {
    const staff = await requireStaff();
    const reference = new URL(req.url).searchParams.get('reference');
    if (!reference) {
      return NextResponse.json({ error: 'A payment reference is required.' }, { status: 400 });
    }
    return NextResponse.json(await verifyTestPayment(staff.workspaceId, reference));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/billing/verify failed', e);
    return NextResponse.json({ error: 'Could not verify the payment.' }, { status: 500 });
  }
}
