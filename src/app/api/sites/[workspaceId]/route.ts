import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { checkRateLimit } from '@/server/rateLimit';

const db = prisma as unknown as {
  workspace: {
    findUnique(args: unknown): Promise<Record<string, unknown> | null>;
  };
};

/**
 * Public business profile for the website front. Returns ONLY owner-maintained
 * public fields (name, logo, description, products, hours, contact, theme).
 * Never customers, conversations, staff, or settings. 404 when hidden/unknown.
 */
export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    checkRateLimit(req, 'site-profile', 120, 3600000);
    const ws = await db.workspace.findUnique({
      where: { id: params.workspaceId },
      select: {
        id: true,
        name: true,
        siteEnabled: true,
        siteDescription: true,
        siteProducts: true,
        siteHours: true,
        siteContact: true,
        theme: true,
        accentColor: true,
        logoStorageKey: true,
      },
    });
    if (!ws || (ws as { siteEnabled: boolean }).siteEnabled !== true) {
      throw new InboxApiError(404, 'Business page not found.');
    }
    const row = ws as {
      id: string;
      name: string;
      siteDescription: string | null;
      siteProducts: string | null;
      siteHours: string | null;
      siteContact: string | null;
      theme: string;
      accentColor: string | null;
      logoStorageKey: string | null;
    };
    return NextResponse.json({
      business: {
        id: row.id,
        name: row.name,
        description: row.siteDescription,
        products: row.siteProducts,
        hours: row.siteHours,
        contact: row.siteContact,
        theme: row.theme,
        accentColor: row.accentColor,
        logoUrl: row.logoStorageKey ? `/api/sites/${row.id}/logo` : null,
        chatUrl: `/chat/${row.id}`,
      },
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/sites profile failed', e);
    return NextResponse.json({ error: 'Could not load this page.' }, { status: 500 });
  }
}
