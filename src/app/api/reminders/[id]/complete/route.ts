import { NextResponse } from 'next/server';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { transitionReminder } from '@/server/reminders';

/** Mark a reminder complete. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    return NextResponse.json(await transitionReminder(staff, params.id, 'COMPLETED'));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/reminders/complete failed', e);
    return NextResponse.json({ error: 'Could not complete the reminder.' }, { status: 500 });
  }
}
