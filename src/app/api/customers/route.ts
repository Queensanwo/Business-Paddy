import { NextResponse } from 'next/server';
import { loadCustomers } from '@/server/customers';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function GET() {
  try {
    const staff = await requireStaff();
    return NextResponse.json(await loadCustomers(staff.workspaceId));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/customers failed', e);
    return NextResponse.json({ error: 'Could not load customers.' }, { status: 500 });
  }
}
