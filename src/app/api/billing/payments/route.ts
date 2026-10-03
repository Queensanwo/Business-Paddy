import { NextResponse } from 'next/server';
import { listPayments } from '@/server/billing';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function GET() {
  try {
    const staff = await requireStaff();
    return NextResponse.json(await listPayments(staff.workspaceId));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/billing/payments failed', e);
    return NextResponse.json({ error: 'Could not load payments.' }, { status: 500 });
  }
}
