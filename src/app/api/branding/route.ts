import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';
import { THEMES, THEME_LABELS, SUGGESTED_ACCENTS, normalizeHex, accentReadable, type ThemeName } from '@/server/branding';

const db = prisma as unknown as {
  workspace: {
    findUnique(args: unknown): Promise<Branding | null>;
    update(args: unknown): Promise<Branding>;
  };
  auditLog: typeof prisma.auditLog;
};

export interface Branding {
  theme: string;
  accentColor: string | null;
  logoMime: string | null;
  hasLogo: boolean;
}

function canManage(role: string): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

async function readBranding(workspaceId: string): Promise<Branding> {
  const ws = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { theme: true, accentColor: true, logoStorageKey: true, logoMime: true },
  });
  if (!ws) throw new InboxApiError(404, 'Workspace not found.');
  const row = ws as unknown as { theme: string; accentColor: string | null; logoStorageKey: string | null; logoMime: string | null };
  return {
    theme: (THEMES as readonly string[]).includes(row.theme) ? row.theme : 'NAVY',
    accentColor: row.accentColor,
    logoMime: row.logoMime,
    hasLogo: !!row.logoStorageKey,
  };
}

/** All staff can read their business's branding. */
export async function GET() {
  try {
    const staff = await requireStaff();
    const branding = await readBranding(staff.workspaceId);
    return NextResponse.json({
      branding: { ...branding, logoUrl: branding.hasLogo ? '/api/branding/logo' : null },
      themes: THEMES.map((t) => ({ name: t, label: THEME_LABELS[t as ThemeName] })),
      suggestions: SUGGESTED_ACCENTS,
      suggestionsNote: 'Curated suggestions — pick one to apply. Nothing is extracted from your logo automatically.',
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/branding failed', e);
    return NextResponse.json({ error: 'Could not load branding.' }, { status: 500 });
  }
}

/**
 * Owners/managers set the preset theme and/or a custom accent.
 * Uploading a logo never changes the theme. Body:
 * { theme?: 'NAVY'|'SLATE'|'PLUM'|'TERRACOTTA', accentColor?: '#RRGGBB'|null|'', reset?: boolean }
 */
export async function PUT(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManage(staff.role)) {
      return NextResponse.json({ error: 'Only owners and managers can change branding.' }, { status: 403 });
    }
    const body = (await req.json()) as { theme?: unknown; accentColor?: unknown; reset?: unknown };
    const data: Record<string, unknown> = {};
    if (body.reset === true) {
      data.theme = 'NAVY';
      data.accentColor = null;
    } else {
      if (typeof body.theme !== 'undefined') {
        if (typeof body.theme !== 'string' || !(THEMES as readonly string[]).includes(body.theme)) {
          return NextResponse.json({ error: 'Unknown theme.' }, { status: 400 });
        }
        data.theme = body.theme;
      }
      if (typeof body.accentColor !== 'undefined') {
        if (body.accentColor === null || body.accentColor === '') {
          data.accentColor = null;
        } else {
          const hex = normalizeHex(body.accentColor);
          if (!hex) return NextResponse.json({ error: 'Accent must be a hex colour like #526BB1.' }, { status: 400 });
          if (!accentReadable(hex)) {
            return NextResponse.json(
              { error: 'That colour is too light for white button text. Pick a darker accent.' },
              { status: 400 },
            );
          }
          data.accentColor = hex;
        }
      }
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });
    }
    await db.workspace.update({ where: { id: staff.workspaceId }, data });
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'branding.updated',
        entityType: 'Workspace',
        entityId: staff.workspaceId,
      },
    });
    const branding = await readBranding(staff.workspaceId);
    return NextResponse.json({ branding: { ...branding, logoUrl: branding.hasLogo ? '/api/branding/logo' : null } });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('PUT /api/branding failed', e);
    return NextResponse.json({ error: 'Could not save branding.' }, { status: 500 });
  }
}
