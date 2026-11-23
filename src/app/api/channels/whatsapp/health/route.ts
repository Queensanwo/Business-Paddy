import { NextResponse } from 'next/server';
import { requireStaff } from '@/server/requireStaff';
import { InboxApiError } from '@/server/inboxStore';
import { whatsappTestConfigForWorkspace } from '@/server/whatsapp';
import { checkWhatsAppProvider } from '@/server/whatsappHealth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const staff = await requireStaff();
    if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Only owners and managers can check the connection.' }, { status: 403 });
    }
    const config = whatsappTestConfigForWorkspace(staff.workspaceId);
    if (!config) return NextResponse.json({ error: 'Required settings are missing or this workspace is not assigned to the test number.' }, { status: 400 });
    return NextResponse.json(await checkWhatsAppProvider(config), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof InboxApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Could not check the connection. Please try again.' }, { status: 503 });
  }
}
