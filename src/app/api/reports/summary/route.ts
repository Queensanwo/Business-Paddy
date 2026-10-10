import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ESCALATION_REASONS, InboxApiError } from '@/server/inboxStore';
import { requireStaff } from '@/server/requireStaff';

// Metric definitions (shown in the UI alongside the numbers):
// - received: conversations in this workspace (demo workspaces are separate
//   workspaces, so their data never mixes in).
// - answered: at least one HUMAN staff reply. Automatic greetings
//   (sender "... (automatic reply)") are reported separately, never as answers.
// - response rate: answered / received.
// - average first reply time: mean minutes from conversation start to the first
//   human staff reply, over answered conversations only.
// - overdue: unanswered and older than 24h (default target; per-business targets
//   are a later setting).
// - CSAT: helpful / (helpful + not helpful) over rated conversations.

const OVERDUE_MS = 24 * 3600 * 1000;

const db = prisma as unknown as {
  conversation: {
    findMany(args: unknown): Promise<ConvRow[]>;
  };
  user: typeof prisma.user;
};

interface MsgRow {
  kind: string;
  senderName: string;
  text: string;
  createdAt: Date;
}

interface ConvRow {
  id: string;
  status: string;
  assigneeId: string | null;
  createdAt: Date;
  rating: string | null;
  assignee: { id: string; name: string } | null;
  messages: MsgRow[];
}

function isHumanReply(m: MsgRow): boolean {
  return m.kind === 'STAFF' && !m.senderName.includes('(automatic reply)');
}

function escalationReasonOf(messages: MsgRow[]): string | null {
  for (const m of messages) {
    // Notes are stored as `Escalated to <manager>: <reason>[ — <note>]`.
    if (m.kind === 'NOTE' && m.text.startsWith('Escalated to ')) {
      const after = m.text.slice('Escalated to '.length);
      const idx = after.indexOf(':');
      const reasonPart = (idx >= 0 ? after.slice(idx + 1) : after).trim();
      return ESCALATION_REASONS.find((r) => reasonPart.startsWith(r)) ?? 'Other';
    }
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const staff = await requireStaff();
    const url = new URL(req.url);
    const assigneeId = url.searchParams.get('assigneeId');
    const isManager = staff.role === 'OWNER' || staff.role === 'MANAGER';

    let targetAssignee: string | null = null;
    if (assigneeId) {
      if (!isManager && assigneeId !== staff.userId) {
        return NextResponse.json({ error: 'You can only view your own performance.' }, { status: 403 });
      }
      targetAssignee = assigneeId;
    }

    const rows = await db.conversation.findMany({
      where: { workspaceId: staff.workspaceId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        status: true,
        assigneeId: true,
        createdAt: true,
        rating: true,
        assignee: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' }, select: { kind: true, senderName: true, text: true, createdAt: true } },
      },
    });

    const now = Date.now();
    const inScope = targetAssignee ? rows.filter((r) => r.assigneeId === targetAssignee) : rows;

    let answered = 0;
    let resolved = 0;
    let helpful = 0;
    let rated = 0;
    let replyMsTotal = 0;
    let replyMsCount = 0;
    let overdue = 0;
    let autoOnly = 0;
    const byReason: Record<string, number> = {};
    let escalations = 0;

    for (const c of inScope) {
      const human = c.messages.filter(isHumanReply);
      const hasHuman = human.length > 0;
      if (hasHuman) {
        answered += 1;
        replyMsTotal += human[0].createdAt.getTime() - c.createdAt.getTime();
        replyMsCount += 1;
      } else {
        if (c.messages.some((m) => m.kind === 'STAFF')) autoOnly += 1;
        if (now - c.createdAt.getTime() > OVERDUE_MS && c.status !== 'RESOLVED') overdue += 1;
      }
      if (c.status === 'RESOLVED') resolved += 1;
      if (c.rating === 'HELPFUL' || c.rating === 'NOT_HELPFUL') {
        rated += 1;
        if (c.rating === 'HELPFUL') helpful += 1;
      }
      const reason = escalationReasonOf(c.messages);
      if (reason || c.status === 'ESCALATED') {
        escalations += 1;
        const key = reason ?? 'Other';
        byReason[key] = (byReason[key] ?? 0) + 1;
      }
    }

    const received = inScope.length;
    const business = {
      received,
      answered,
      unanswered: received - answered,
      autoAcknowledgedOnly: autoOnly,
      responseRate: received === 0 ? null : Math.round((answered / received) * 1000) / 10,
      avgFirstReplyMinutes: replyMsCount === 0 ? null : Math.round(replyMsTotal / replyMsCount / 60000),
      resolved,
      overdue,
      csat: rated === 0 ? null : Math.round((helpful / rated) * 1000) / 10,
      rated,
      escalations,
      escalationsByReason: byReason,
    };

    // Staff table: managers see everyone, others see only themselves.
    const staffRows: Record<string, { id: string; name: string; handled: number; resolved: number; overdue: number; escalations: number; avgReplyMin: number | null; csat: number | null }> = {};
    const acc: Record<string, { ms: number; n: number; h: number; r: number }> = {};
    for (const c of rows) {
      if (!c.assigneeId) continue;
      if (!isManager && c.assigneeId !== staff.userId) continue;
      const key = c.assigneeId;
      if (!staffRows[key]) {
        staffRows[key] = { id: key, name: c.assignee?.name ?? 'Staff', handled: 0, resolved: 0, overdue: 0, escalations: 0, avgReplyMin: null, csat: null };
        acc[key] = { ms: 0, n: 0, h: 0, r: 0 };
      }
      const s = staffRows[key];
      s.handled += 1;
      if (c.status === 'RESOLVED') s.resolved += 1;
      const human = c.messages.filter(isHumanReply);
      if (human.length > 0) {
        acc[key].ms += human[0].createdAt.getTime() - c.createdAt.getTime();
        acc[key].n += 1;
      } else if (now - c.createdAt.getTime() > OVERDUE_MS && c.status !== 'RESOLVED') {
        s.overdue += 1;
      }
      if (escalationReasonOf(c.messages) || c.status === 'ESCALATED') s.escalations += 1;
      if (c.rating === 'HELPFUL' || c.rating === 'NOT_HELPFUL') {
        acc[key].r += 1;
        if (c.rating === 'HELPFUL') acc[key].h += 1;
      }
    }
    for (const key of Object.keys(staffRows)) {
      if (acc[key].n > 0) staffRows[key].avgReplyMin = Math.round(acc[key].ms / acc[key].n / 60000);
      if (acc[key].r > 0) staffRows[key].csat = Math.round((acc[key].h / acc[key].r) * 1000) / 10;
    }

    const users = isManager
      ? await prisma.user.findMany({
          where: { workspaceId: staff.workspaceId },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, role: true },
        })
      : [];

    return NextResponse.json({
      business,
      staff: Object.values(staffRows),
      users,
      definitions: 'Answered counts human replies only; automatic greetings are separate. Overdue = unanswered over 24h (default).',
    });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('GET /api/reports/summary failed', e);
    return NextResponse.json({ error: 'Could not load the report.' }, { status: 500 });
  }
}
