import { NextResponse } from 'next/server';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { pollGoogleMailbox } from '@/server/gmail';

/**
 * Checks the connected mailbox now (owner/manager only). Polling — a few
 * minutes of delay is normal in this phase; push delivery comes later.
 */
export async function POST() {
  try {
    const staff = await requireStaff();
    if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Only owners and managers can check mail.' }, { status: 403 });
    }
    const result = await pollGoogleMailbox(staff.workspaceId, staff.userId);
    return NextResponse.json({
      ...result,
      note:
        result.stored > 0
          ? `Found ${result.stored} new email${result.stored === 1 ? '' : 's'} in the inbox.`
          : 'No new mail. Incoming mail can lag a few minutes with polling.',
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/channels/google/poll failed', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not check mail.' }, { status: 500 });
  }
}
