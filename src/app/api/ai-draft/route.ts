import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

// Type-loose access: `prisma generate` runs after the dev server restarts
// (the query engine DLL is locked while Next.js holds it). Casts keep `tsc`
// green until the new tables/columns are in the generated client.
const db = prisma as unknown as {
  conversation: typeof prisma.conversation;
  savedReply: typeof prisma.savedReply;
  workspace: {
    findUnique(args: unknown): Promise<{ toneGuidance: string | null } | null>;
  };
  auditLog: typeof prisma.auditLog;
};

/**
 * Mock AI draft (FR18). No external AI call, no invented prices or policies:
 * the draft only rephrases the customer's own words plus the business's tone
 * guidance and saved-reply titles. Staff must review before sending.
 */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = (await req.json()) as { conversationId?: unknown };
    if (typeof body.conversationId !== 'string' || !body.conversationId) {
      return NextResponse.json({ error: 'A conversation is required.' }, { status: 400 });
    }
    const conv = await db.conversation.findFirst({
      where: { id: body.conversationId, workspaceId: staff.workspaceId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 20 },
        customer: { select: { name: true } },
      },
    });
    if (!conv) throw new InboxApiError(404, 'Conversation not found.');
    const ws = await db.workspace.findUnique({
      where: { id: staff.workspaceId },
      select: { toneGuidance: true },
    });
    const replies = await db.savedReply.findMany({
      where: { workspaceId: staff.workspaceId },
      orderBy: { title: 'asc' },
      take: 3,
      select: { title: true },
    });
    const lastCustomer = [...conv.messages]
      .reverse()
      .find((m) => (m as { kind: string }).kind === 'CUSTOMER') as
      | { text: string }
      | undefined;
    const snippet = (lastCustomer?.text ?? '').trim().slice(0, 120) || 'your message';
    const tone = (ws?.toneGuidance ?? '').trim();
    const name = conv.customer?.name ?? 'there';
    const parts = [
      `Hello ${name}, thanks for reaching out about \u201c${snippet}\u201d.`,
      tone ? `We will keep it ${tone.slice(0, 120)}.` : 'We will keep this clear and courteous.',
      replies.length > 0
        ? `I checked our approved notes (${replies.map((r) => r.title).join(', ')}) before drafting this.`
        : 'I checked our approved notes before drafting this.',
      'A team member will review this draft before anything is sent — nothing here promises prices, refunds, delivery dates or policies we have not approved.',
    ];
    const draft = parts.join(' ');
    await prisma.auditLog.create({
      data: {
        workspaceId: staff.workspaceId,
        actorId: staff.userId,
        action: 'ai_draft.requested',
        entityType: 'Conversation',
        entityId: conv.id,
      },
    });
    return NextResponse.json({
      draft,
      aiGenerated: true,
      reviewRequired: true,
      tone: tone || null,
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/ai-draft failed', e);
    return NextResponse.json({ error: 'Could not create a draft.' }, { status: 500 });
  }
}
