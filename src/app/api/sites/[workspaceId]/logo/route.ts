import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadPath } from '@/server/attachments';
import { InboxApiError } from '@/server/inboxStore';
import { checkRateLimit } from '@/server/rateLimit';

const db = prisma as unknown as {
  workspace: {
    findUnique(args: unknown): Promise<{ siteEnabled: boolean; logoStorageKey: string | null; logoMime: string | null } | null>;
  };
};

/** Public logo bytes for the website front. Logo only — nothing else. */
export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    checkRateLimit(req, 'site-logo', 120, 3600000);
    const ws = await db.workspace.findUnique({
      where: { id: params.workspaceId },
      select: { siteEnabled: true, logoStorageKey: true, logoMime: true },
    });
    if (!ws || ws.siteEnabled !== true || !ws.logoStorageKey || !ws.logoMime) {
      throw new InboxApiError(404, 'Logo not found.');
    }
    const { readFile } = await import('node:fs/promises');
    const bytes = await readFile(uploadPath(ws.logoStorageKey));
    return new NextResponse(bytes, {
      headers: { 'Content-Type': ws.logoMime, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/sites logo failed', e);
    return NextResponse.json({ error: 'Could not load the logo.' }, { status: 500 });
  }
}
