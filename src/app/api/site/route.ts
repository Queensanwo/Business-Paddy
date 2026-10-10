import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

const db = prisma as unknown as {
  workspace: {
    findUnique(args: unknown): Promise<SiteSettings | null>;
    update(args: unknown): Promise<SiteSettings>;
  };
  auditLog: typeof prisma.auditLog;
};

export interface SiteSettings {
  name: string;
  siteEnabled: boolean;
  siteDescription: string | null;
  siteProducts: string | null;
  siteHours: string | null;
  siteContact: string | null;
  hasLogo: boolean;
}

const SELECT = {
  name: true,
  siteEnabled: true,
  siteDescription: true,
  siteProducts: true,
  siteHours: true,
  siteContact: true,
  logoStorageKey: true,
};

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

function toShape(row: Record<string, unknown>): SiteSettings {
  return {
    name: row.name as string,
    siteEnabled: row.siteEnabled as boolean,
    siteDescription: (row.siteDescription as string | null) ?? null,
    siteProducts: (row.siteProducts as string | null) ?? null,
    siteHours: (row.siteHours as string | null) ?? null,
    siteContact: (row.siteContact as string | null) ?? null,
    hasLogo: !!(row.logoStorageKey as string | null),
  };
}

/** Staff read their own business's website-front settings. */
export async function GET() {
  try {
    const staff = await requireStaff();
    const ws = await db.workspace.findUnique({ where: { id: staff.workspaceId }, select: SELECT });
    if (!ws) throw new InboxApiError(404, 'Workspace not found.');
    return NextResponse.json({ site: toShape(ws as unknown as Record<string, unknown>), workspaceId: staff.workspaceId });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/site failed', e);
    return NextResponse.json({ error: 'Could not load website settings.' }, { status: 500 });
  }
}

/** Owners/managers maintain the public page. Text only — no customer data involved. */
export async function PUT(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can edit the website page.' }, { status: 403 });
    }
    const body = (await req.json()) as {
      siteEnabled?: unknown;
      siteDescription?: unknown;
      siteProducts?: unknown;
      siteHours?: unknown;
      siteContact?: unknown;
    };
    const data: Record<string, unknown> = {};
    if (typeof body.siteEnabled !== 'undefined') {
      if (typeof body.siteEnabled !== 'boolean') {
        return NextResponse.json({ error: 'siteEnabled must be true or false.' }, { status: 400 });
      }
      data.siteEnabled = body.siteEnabled;
    }
    for (const key of ['siteDescription', 'siteProducts', 'siteHours', 'siteContact'] as const) {
      const v = body[key];
      if (typeof v !== 'undefined') {
        if (typeof v !== 'string') return NextResponse.json({ error: `${key} must be text.` }, { status: 400 });
        const t = v.trim().slice(0, 2000);
        data[key] = t || null;
      }
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });
    }
    const updated = await db.workspace.update({ where: { id: staff.workspaceId }, data, select: SELECT });
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'site.updated',
        entityType: 'Workspace',
        entityId: staff.workspaceId,
      },
    });
    return NextResponse.json({ site: toShape(updated as unknown as Record<string, unknown>) });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('PUT /api/site failed', e);
    return NextResponse.json({ error: 'Could not save website settings.' }, { status: 500 });
  }
}
