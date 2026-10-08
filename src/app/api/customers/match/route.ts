import { NextResponse } from 'next/server';
import { confirmCustomerMatch, separateCustomerMatch } from '@/server/customerMatching';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { checkRateLimit } from '@/server/rateLimit';

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    checkRateLimit(req, 'customer-match:confirm', 20, 3600000);

    if (!canManageCustomer(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can confirm matches.' }, { status: 403 });
    }

    const body = (await req.json()) as {
      primaryCustomerId?: unknown;
      matchCustomerId?: unknown;
      conversationIds?: unknown;
      action?: unknown;
    };

    if (typeof body.action !== 'string') {
      return NextResponse.json({ error: 'Action is required.' }, { status: 400 });
    }

    if (body.action === 'confirm') {
      if (typeof body.primaryCustomerId !== 'string' || typeof body.matchCustomerId !== 'string') {
        return NextResponse.json({ error: 'primaryCustomerId and matchCustomerId are required.' }, { status: 400 });
      }
      await confirmCustomerMatch(staff.workspaceId, body.primaryCustomerId, body.matchCustomerId, staff.userId);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'separate') {
      if (!Array.isArray(body.conversationIds) || body.conversationIds.length === 0) {
        return NextResponse.json({ error: 'conversationIds array is required.' }, { status: 400 });
      }
      await separateCustomerMatch(staff.workspaceId, body.conversationIds as string[], staff.userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action. Use "confirm" or "separate".' }, { status: 400 });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/customers/match failed', e);
    return NextResponse.json({ error: 'Could not process match action.' }, { status: 500 });
  }
}

function canManageCustomer(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}