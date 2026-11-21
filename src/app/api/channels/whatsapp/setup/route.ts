import { NextResponse } from 'next/server';
import { requireStaff } from '@/server/requireStaff';
import { InboxApiError } from '@/server/inboxStore';
import { whatsappSetupStatus } from '@/server/whatsappSetup';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const staff = await requireStaff();
    if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Only owners and managers can check connection settings.' }, { status: 403 });
    }
    return NextResponse.json(whatsappSetupStatus(staff.workspaceId), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof InboxApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Could not check the settings. Please try again.' }, { status: 503 });
  }
}
