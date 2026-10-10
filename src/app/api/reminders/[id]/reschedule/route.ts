import { NextResponse } from 'next/server';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { transitionReminder } from '@/server/reminders';

/** Move a reminder to a new date/time. Body: { scheduledAt: ISO string }. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    const body = (await req.json().catch(() => ({}))) as { scheduledAt?: unknown };
    if (typeof body.scheduledAt !== 'string' || Number.isNaN(Date.parse(body.scheduledAt))) {
      return NextResponse.json({ error: 'A valid date and time is required.' }, { status: 400 });
    }
    return NextResponse.json(await transitionReminder(staff, params.id, 'SCHEDULED', new Date(body.scheduledAt)));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/reminders/reschedule failed', e);
    return NextResponse.json({ error: 'Could not reschedule the reminder.' }, { status: 500 });
  }
}
