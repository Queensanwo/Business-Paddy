import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { prisma } from '@/lib/db';
import { uploadPath } from '@/server/attachments';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

const INLINE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
  'audio/x-m4a',
  'application/pdf',
]);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: params.id,
        message: { conversation: { workspaceId: staff.workspaceId } },
      },
    });
    if (!attachment || !attachment.storageKey) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }
    const bytes = await readFile(uploadPath(attachment.storageKey));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(bytes as any, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `${INLINE_TYPES.has(attachment.mimeType) ? 'inline' : 'attachment'}; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Content-Length': String(bytes.length),
      },
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/files failed', e);
    return NextResponse.json({ error: 'Could not load the file.' }, { status: 500 });
  }
}
