import { NextResponse } from 'next/server';
import { loadCustomerDetail } from '@/server/customers';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    return NextResponse.json(await loadCustomerDetail(staff.workspaceId, params.id));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/customers/[id] failed', e);
    return NextResponse.json({ error: 'Could not load the customer.' }, { status: 500 });
  }
}
