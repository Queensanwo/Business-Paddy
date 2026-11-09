import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseProfessionalProfile, profileImageIds } from '@/lib/professionalProfile';
import { InboxApiError } from '@/server/inboxStore';
import { readStoredFile } from '@/server/objectStorage';
import { checkRateLimit } from '@/server/rateLimit';
import { requireStaff } from '@/server/requireStaff';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const notFound = () => new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  try {
    if (!/^c[a-z0-9]{24}$/.test(params.id)) return notFound();
    await checkRateLimit(req, 'profile-photo-read', 240, 3600000);
    const workspaceId = new URL(req.url).searchParams.get('site');
    const image = await prisma.professionalImage.findFirst({
      where: { id: params.id, workspaceId: workspaceId ?? (await requireStaff()).workspaceId },
      select: { mimeType: true, storageKey: true,
        workspace: { select: { siteEnabled: true, workspaceKind: true, siteProfessionalProfile: true } } },
    });
    if (!image) return notFound();
    if (workspaceId !== null) {
      const { siteEnabled, workspaceKind, siteProfessionalProfile } = image.workspace;
      if (!siteEnabled || workspaceKind !== 'PROFESSIONAL' || !siteProfessionalProfile ||
          !profileImageIds(parseProfessionalProfile(siteProfessionalProfile)).includes(params.id)) return notFound();
    }
    return new NextResponse(await readStoredFile(image.storageKey), {
      headers: { 'Content-Type': image.mimeType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error) {
    if (error instanceof InboxApiError && error.status === 429) return new NextResponse(null, { status: 429 });
    return notFound();
  }
}
