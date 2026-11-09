import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateUploadContent } from '@/server/attachments';
import { InboxApiError } from '@/server/inboxStore';
import { deleteStoredFile, putStoredFile, useObjectStorage } from '@/server/objectStorage';
import { checkRateLimit } from '@/server/rateLimit';
import { requireStaff } from '@/server/requireStaff';

const supported = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    if (!['OWNER', 'MANAGER'].includes(staff.role)) throw new InboxApiError(403, 'Only owners and managers can upload profile photos.');
    await checkRateLimit(req, `profile-photo:${staff.workspaceId}`, 25, 3600000);
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size < 1 || file.size > 2 * 1024 * 1024) {
      throw new InboxApiError(400, 'Choose a photo under 2 MB.');
    }
    const extension = supported.get(file.type);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!extension || !validateUploadContent(bytes, file.type)) {
      throw new InboxApiError(400, 'Choose a valid JPEG, PNG or WebP image.');
    }
    const storageKey = `${useObjectStorage() ? 'r2_' : ''}profile_${randomUUID()}.${extension}`;
    await putStoredFile(storageKey, bytes, file.type);
    try {
      const image = await prisma.professionalImage.create({
        data: { workspaceId: staff.workspaceId, storageKey, mimeType: file.type }, select: { id: true },
      });
      return NextResponse.json(image, { status: 201 });
    } catch (error) {
      await deleteStoredFile(storageKey).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof InboxApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Profile photo upload failed', error);
    return NextResponse.json({ error: 'Could not upload the photo. Try again.' }, { status: 500 });
  }
}
