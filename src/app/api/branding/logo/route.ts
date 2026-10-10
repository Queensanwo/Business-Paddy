import { NextResponse } from 'next/server';
import { unlink } from 'node:fs/promises';
import { prisma } from '@/lib/db';
import { uploadPath } from '@/server/attachments';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

const db = prisma as unknown as {
  workspace: {
    findUnique(args: unknown): Promise<{ logoStorageKey: string | null; logoMime: string | null } | null>;
    update(args: unknown): Promise<unknown>;
  };
};

// Logos: small square-friendly images only, verified by magic bytes.
const LOGO_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function sniffImage(buf: Buffer): string | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 6 && buf.toString('ascii', 0, 6).startsWith('GIF8')) return 'image/gif';
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

async function dropFile(key: string | null) {
  if (!key) return;
  try {
    await unlink(uploadPath(key));
  } catch {
    /* already gone — logo row is the source of truth */
  }
}

/** Serves this workspace's logo to its own staff. */
export async function GET() {
  try {
    const staff = await requireStaff();
    const ws = await db.workspace.findUnique({
      where: { id: staff.workspaceId },
      select: { logoStorageKey: true, logoMime: true },
    });
    if (!ws?.logoStorageKey || !ws.logoMime) throw new InboxApiError(404, 'No logo.');
    const { readFile } = await import('node:fs/promises');
    const bytes = await readFile(uploadPath(ws.logoStorageKey));
    return new NextResponse(bytes, {
      headers: { 'Content-Type': ws.logoMime, 'Cache-Control': 'private, max-age=3600' },
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/branding/logo failed', e);
    return NextResponse.json({ error: 'Could not load the logo.' }, { status: 500 });
  }
}

/** Uploads or replaces the workspace logo. Never changes the theme. */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can change the logo.' }, { status: 403 });
    }
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
    }
    if (!LOGO_MIME.has(file.type)) {
      return NextResponse.json({ error: 'Logo must be PNG, JPEG, GIF or WebP.' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: 'Logo must be under 2 MB.' }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImage(buf);
    if (!sniffed || sniffed !== file.type) {
      return NextResponse.json({ error: 'That file is not a real image.' }, { status: 400 });
    }
    const { saveUpload } = await import('@/server/attachments');
    const stored = await saveUpload(new File([buf], file.name, { type: sniffed }));
    const prev = await db.workspace.findUnique({
      where: { id: staff.workspaceId },
      select: { logoStorageKey: true },
    });
    await db.workspace.update({
      where: { id: staff.workspaceId },
      data: { logoStorageKey: stored.storageKey, logoMime: sniffed },
    });
    await dropFile(prev?.logoStorageKey ?? null);
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'branding.logo_updated',
        entityType: 'Workspace',
        entityId: staff.workspaceId,
      },
    });
    return NextResponse.json({ logoUrl: '/api/branding/logo' });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/branding/logo failed', e);
    return NextResponse.json({ error: 'Could not save the logo.' }, { status: 500 });
  }
}

/** Removes the workspace logo. Theme and accent are untouched. */
export async function DELETE() {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can remove the logo.' }, { status: 403 });
    }
    const prev = await db.workspace.findUnique({
      where: { id: staff.workspaceId },
      select: { logoStorageKey: true },
    });
    if (!prev?.logoStorageKey) return NextResponse.json({ removed: false });
    await db.workspace.update({
      where: { id: staff.workspaceId },
      data: { logoStorageKey: null, logoMime: null },
    });
    await dropFile(prev.logoStorageKey);
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'branding.logo_removed',
        entityType: 'Workspace',
        entityId: staff.workspaceId,
      },
    });
    return NextResponse.json({ removed: true });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('DELETE /api/branding/logo failed', e);
    return NextResponse.json({ error: 'Could not remove the logo.' }, { status: 500 });
  }
}
