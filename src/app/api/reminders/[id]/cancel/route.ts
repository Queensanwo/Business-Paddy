import { NextResponse } from 'next/server';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { transitionReminder } from '@/server/reminders';

/** Cancel a reminder. History is kept; nothing is deleted. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    return NextResponse.json(await transitionReminder(staff, params.id, 'CANCELLED'));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/reminders/cancel failed', e);
    return NextResponse.json({ error: 'Could not cancel the reminder.' }, { status: 500 });
  }
}
