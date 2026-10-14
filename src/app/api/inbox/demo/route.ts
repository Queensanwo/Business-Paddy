import { NextResponse } from 'next/server';
import { Channel, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireStaff } from '@/server/requireStaff';
import { InboxApiError } from '@/server/inboxStore';
import { mockConversations } from '@/data/mockConversations';

const channels: Record<string, Channel> = {
  whatsapp: 'WHATSAPP', instagram: 'INSTAGRAM', email: 'EMAIL',
  tiktok: 'TIKTOK', facebook: 'FACEBOOK', paddy_chat: 'PADDY_CHAT',
};

/** Add fictional examples only to an empty demo workspace; never replace history. */
export async function POST() {
  try {
    const staff = await requireStaff();
    if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      throw new InboxApiError(403, 'Only owners and managers can load demo examples.');
    }
    const created = await prisma.$transaction(async (db) => {
      const workspace = await db.workspace.findUnique({ where: { id: staff.workspaceId } });
      if (!workspace || workspace.mode !== 'DEMO') {
        throw new InboxApiError(403, 'Sample conversations are available only in Demo mode.');
      }
      const count = await db.conversation.count({ where: { workspaceId: staff.workspaceId } });
      if (count > 0) return 0;
      for (let index = 0; index < mockConversations.length; index += 1) {
        const conversation = mockConversations[index];
        const customer = await db.customer.create({
          data: { workspaceId: staff.workspaceId, name: conversation.name },
        });
        await db.conversation.create({
          data: {
            workspaceId: staff.workspaceId, customerId: customer.id,
            channel: channels[conversation.channel], sortOrder: index,
            status: conversation.messages.some((message) => message.role === 'staff') ? 'IN_PROGRESS' : 'NEW',
            preview: conversation.preview,
            messages: { create: conversation.messages.map((message) => ({
              kind: message.role === 'staff' ? 'STAFF' : 'CUSTOMER',
              senderName: message.who, text: message.text,
            })) },
          },
        });
      }
      await db.auditLog.create({ data: {
        workspaceId: staff.workspaceId, actorId: staff.userId,
        action: 'workspace.demo_samples_loaded', entityType: 'Workspace', entityId: staff.workspaceId,
      } });
      return mockConversations.length;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
    return NextResponse.json({ created });
  } catch (error) {
    if (error instanceof InboxApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'Another request is loading samples. Refresh your inbox.' }, { status: 409 });
    }
    console.error('Load demo samples failed', error);
    return NextResponse.json({ error: 'Could not load demo examples.' }, { status: 500 });
  }
}
