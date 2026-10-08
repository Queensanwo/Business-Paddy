import { NextResponse } from 'next/server';
import { saveUpload } from '@/server/attachments';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

export async function POST(req: Request) {
  try {
    await requireStaff();
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A file is required.' }, { status: 400 });
    }
    return NextResponse.json(await saveUpload(file));
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/uploads failed', e);
    return NextResponse.json({ error: 'Could not store the file.' }, { status: 500 });
  }
}
