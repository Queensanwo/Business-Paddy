import { NextResponse } from 'next/server';
import { loadInbox, InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function GET() {
  try {
    const staff = await requireStaff();
    const snapshot = await loadInbox(staff.workspaceId);
    return NextResponse.json(snapshot);
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/inbox failed', e);
    return NextResponse.json({ error: 'Could not load the inbox.' }, { status: 500 });
  }
}
