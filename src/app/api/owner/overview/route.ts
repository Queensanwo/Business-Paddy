import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireStaff } from '@/server/requireStaff';
import { InboxApiError } from '@/server/inboxStore';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 20;
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(req: Request) {
  try {
    const staff = await requireStaff();
    // Role and workspace are reloaded from the database by requireStaff.
    if (staff.role !== 'OWNER') {
      return NextResponse.json({ error: 'This overview is only available to the business owner.' }, { status: 403, headers });
    }
    const url = new URL(req.url);
    const pageText = url.searchParams.get('page') ?? '1';
    const page = Number(pageText);
    const filter = url.searchParams.get('filter') ?? 'all';
    if (!/^\d+$/.test(pageText) || !Number.isSafeInteger(page) || page < 1 || page > 10000 || !['all', 'attention', 'feedback'].includes(filter)) {
      return NextResponse.json({ error: 'Choose a valid page and conversation filter.' }, { status: 400, headers });
    }
    const scope = { workspaceId: staff.workspaceId };
    const where: Prisma.ConversationWhereInput = {
      ...scope,
      ...(filter === 'attention' ? { status: { in: ['NEW', 'FOLLOW_UP', 'NEEDS_APPROVAL', 'ESCALATED'] } } : {}),
      ...(filter === 'feedback' ? { rating: { in: ['HELPFUL', 'NOT_HELPFUL'] } } : {}),
    };
    const statusQuery = prisma.conversation.groupBy({ by: ['status'], orderBy: { status: 'asc' }, where: scope, _count: { _all: true } });
    const ratingQuery = prisma.conversation.groupBy({ by: ['rating'], orderBy: { rating: 'asc' }, where: { ...scope, rating: { in: ['HELPFUL', 'NOT_HELPFUL'] } }, _count: { _all: true } });
    const assignmentQuery = prisma.conversation.groupBy({ by: ['assigneeId'], orderBy: { assigneeId: 'asc' }, where: { ...scope, status: { not: 'RESOLVED' } }, _count: { _all: true } });
    const [statuses, ratings, assignments, users, total, conversations] = await prisma.$transaction([
      statusQuery, ratingQuery, assignmentQuery,
      prisma.user.findMany({ where: scope, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
        select: {
          id: true, channel: true, status: true, updatedAt: true,
          rating: true, feedbackComment: true, feedbackAt: true,
          customer: { select: { name: true } },
          assignee: { select: { id: true, name: true } },
          // Bounded excerpts, not generated claims about customer sentiment.
          messages: { where: { kind: { in: ['CUSTOMER', 'STAFF'] } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 8,
            select: { kind: true, senderName: true, text: true, createdAt: true } },
        },
      }),
    ]);
    const byStatus = Object.fromEntries(statuses.map((s) => [s.status, s._count._all]));
    const helpful = ratings.find((r) => r.rating === 'HELPFUL')?._count._all ?? 0;
    const notHelpful = ratings.find((r) => r.rating === 'NOT_HELPFUL')?._count._all ?? 0;
    const rated = helpful + notHelpful;
    const all = statuses.reduce((sum, s) => sum + s._count._all, 0);
    return NextResponse.json({
      updatedAt: new Date().toISOString(), page, pageSize: PAGE_SIZE, total,
      overview: {
        conversations: all, open: all - (byStatus.RESOLVED ?? 0),
        attention: ['NEW', 'FOLLOW_UP', 'NEEDS_APPROVAL', 'ESCALATED'].reduce((sum, key) => sum + (byStatus[key] ?? 0), 0),
        escalated: byStatus.ESCALATED ?? 0, awaitingApproval: byStatus.NEEDS_APPROVAL ?? 0,
        unassigned: assignments.find((a) => a.assigneeId === null)?._count._all ?? 0,
        helpful, notHelpful, rated, satisfaction: rated ? Math.round(helpful / rated * 100) : null,
      },
      team: users.map((u) => ({ ...u, open: assignments.find((a) => a.assigneeId === u.id)?._count._all ?? 0 })),
      conversations: conversations.map((c) => ({
        id: c.id, channel: c.channel, status: c.status, updatedAt: c.updatedAt,
        customer: c.customer?.name ?? 'Customer', assignee: c.assignee?.name ?? 'Unassigned',
        rating: c.rating === 'HELPFUL' || c.rating === 'NOT_HELPFUL' ? c.rating : null,
        feedbackComment: c.feedbackComment?.slice(0, 600) ?? null, feedbackAt: c.feedbackAt,
        excerpts: c.messages.slice(0, 3).reverse().map((m) => ({
          kind: m.kind, sender: m.senderName, at: m.createdAt,
          text: m.text.length > 280 ? `${m.text.slice(0, 280)}…` : m.text,
          automatic: m.kind === 'STAFF' && m.senderName.includes('(automatic reply)'),
        })),
      })),
    }, { headers });
  } catch (error) {
    if (error instanceof InboxApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    console.error('Owner overview could not be loaded');
    return NextResponse.json({ error: 'Could not load your overview. Please try again.' }, { status: 500, headers });
  }
}
