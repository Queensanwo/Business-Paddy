import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { guestFile } from '@/server/paddyChat';
import { InboxApiError } from '@/server/inboxStore';

export async function GET(_req: Request, { params }: { params: { token: string; id: string } }) {
  try {
    const file = await guestFile(params.token, params.id);
    const bytes = await readFile(file.path);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(bytes as any, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Length': String(bytes.length),
      },
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET guest file failed', e);
    return NextResponse.json({ error: 'Could not load the file.' }, { status: 500 });
  }
}
