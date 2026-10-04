import { NextResponse } from 'next/server';
import { getWorkspaceMatchSuggestions } from '@/server/customerMatching';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { checkRateLimit } from '@/server/rateLimit';

export async function GET(req: Request) {
  try {
    const staff = await requireStaff();
    checkRateLimit(req, 'match-suggestions', 10, 3600000);

    if (!canManageCustomer(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can view match suggestions.' }, { status: 403 });
    }

    const suggestions = await getWorkspaceMatchSuggestions(staff.workspaceId);
    return NextResponse.json(suggestions);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/customers/match-suggestions failed', e);
    return NextResponse.json({ error: 'Could not load match suggestions.' }, { status: 500 });
  }
}

function canManageCustomer(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}