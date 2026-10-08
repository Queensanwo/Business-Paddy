import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { WorkspaceMode } from '@prisma/client';

// Local development only: creates a business workspace with an owner seat to fill.
// The caller then creates the owner account via Better Auth sign-up with this id.
// Production will gate this behind invites/verification.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: unknown; industry?: unknown; mode?: unknown };
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    }
    const mode: WorkspaceMode = body.mode === 'LIVE' ? 'LIVE' : 'DEMO';
    const workspace = await prisma.workspace.create({
      data: {
        name: body.name.trim(),
        industry: typeof body.industry === 'string' && body.industry.trim() ? body.industry.trim() : null,
        mode,
      },
      select: { id: true, name: true, mode: true },
    });
    return NextResponse.json(workspace);
  } catch (e) {
    console.error('POST /api/workspaces failed', e);
    return NextResponse.json({ error: 'Could not create the workspace.' }, { status: 500 });
  }
}
