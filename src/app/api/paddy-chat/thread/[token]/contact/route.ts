import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { threadByToken } from '@/server/paddyChat';
import { InboxApiError } from '@/server/inboxStore';
import { checkRateLimit } from '@/server/rateLimit';

function cleanEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InboxApiError(400, 'That email address does not look valid.');
  }
  return email;
}

function cleanPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const phone = value.trim();
  if (!phone) return null;
  if (!/^\+?[0-9][0-9\s-]{6,17}$/.test(phone)) {
    throw new InboxApiError(400, 'That phone number does not look valid.');
  }
  return phone;
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    checkRateLimit(req, 'paddy-contact', 10, 3600000);
    const conv = await threadByToken(params.token);
    if (conv.status !== 'RESOLVED') {
      return NextResponse.json(
        { error: 'Contact saving is offered after your chat is resolved.' },
        { status: 400 },
      );
    }
    const body = (await req.json()) as { email?: unknown; phone?: unknown; consent?: unknown };
    if (body.consent !== true) {
      return NextResponse.json({ error: 'Please tick the consent box first.' }, { status: 400 });
    }
    const email = cleanEmail(body.email);
    const phone = cleanPhone(body.phone);
    if (!email && !phone) {
      return NextResponse.json({ error: 'Share an email address or a phone number.' }, { status: 400 });
    }
    const parts: string[] = [];
    if (email) parts.push(`email:${email}`);
    if (phone) parts.push(`phone:${phone}`);
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: conv.customerId as string },
        data: { contactDetail: parts.join(', '), contactConsentAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          workspaceId: conv.workspaceId,
          action: 'paddy_chat.contact_saved',
          entityType: 'Conversation',
          entityId: conv.id,
        },
      }),
    ]);
    return NextResponse.json({ saved: true });
  } catch (e) {
    if (e instanceof InboxApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('POST /api/paddy-chat/thread/contact failed', e);
    return NextResponse.json({ error: 'Could not save contact details.' }, { status: 500 });
  }
}
