import { NextResponse } from 'next/server';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { initiateTransfer, pendingTransfer } from '@/server/ownership';

export async function GET() {
  try {
    const staff = await requireStaff();
    return NextResponse.json({ pending: await pendingTransfer(staff) });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/ownership/transfer failed', e);
    return NextResponse.json({ error: 'Could not load the handover.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as { recipientEmail?: unknown; password?: unknown };
    const result = await initiateTransfer(staff, body);
    return NextResponse.json({
      ...result,
      note: result.emailed
        ? 'Invitation emailed. Nothing changes until it is accepted.'
        : 'Email is not configured — forward the link yourself. Nothing changes until it is accepted.',
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/ownership/transfer failed', e);
    return NextResponse.json({ error: 'Could not start the handover.' }, { status: 500 });
  }
}
