import { NextResponse } from 'next/server';
import { findCustomerMatches } from '@/server/customerMatching';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { checkRateLimit } from '@/server/rateLimit';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    checkRateLimit(req, `customer-matches:${params.id}`, 30, 3600000);

    if (!canViewCustomer(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can view match suggestions.' }, { status: 403 });
    }

    const matches = await findCustomerMatches(staff.workspaceId, params.id);
    return NextResponse.json({ matches });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/customers/[id]/matches failed', e);
    return NextResponse.json({ error: 'Could not load match suggestions.' }, { status: 500 });
  }
}

function canManageCustomer(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

function canViewCustomer(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER' || role === 'AGENT';
}