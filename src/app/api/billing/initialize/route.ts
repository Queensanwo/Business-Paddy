import { NextResponse } from 'next/server';
import { initializeTestPayment } from '@/server/billing';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function POST() {
  try {
    const staff = await requireStaff();
    if (staff.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only the business owner can start checkout.' }, { status: 403 });
    }
    const result = await initializeTestPayment(staff.workspaceId, staff.email);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/billing/initialize failed', e);
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
  }
}
