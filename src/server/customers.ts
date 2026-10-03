import { prisma } from '@/lib/db';
import { Channel } from '@/types/conversation';
import { toUiConversation, timeAgo, InboxApiError } from '@/server/inboxStore';

export interface CustomerSummary {
  id: string;
  name: string;
  contactDetail: string | null;
  channels: Channel[];
  conversationCount: number;
  openCount: number;
  lastActive: string;
}

export interface CustomerDetail {
  id: string;
  name: string;
  contactDetail: string | null;
  channels: Channel[];
  conversationCount: number;
  openCount: number;
  conversations: ReturnType<typeof toUiConversation>[];
}

function latestActivity(messages: { createdAt: Date }[]): Date | null {
  let latest: Date | null = null;
  messages.forEach((m) => {
    if (!latest || m.createdAt > latest) latest = m.createdAt;
  });
  return latest;
}

const DB_CHANNEL_LABEL = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  EMAIL: 'email',
} as const;

function uniqueUiChannels(channels: string[]): Channel[] {
  const seen: Record<string, boolean> = {};
  const out: Channel[] = [];
  channels.forEach((ch) => {
    const ui = (DB_CHANNEL_LABEL as Record<string, Channel | undefined>)[ch];
    if (ui && !seen[ui]) {
      seen[ui] = true;
      out.push(ui);
    }
  });
  return out;
}

export async function loadCustomers(workspaceId: string): Promise<CustomerSummary[]> {
  const customers = await prisma.customer.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    include: {
      conversations: {
        orderBy: { sortOrder: 'asc' },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      },
    },
  });
  return customers.map((c) => {
    const allMessages = c.conversations.flatMap((conv) => conv.messages);
    const channels = uniqueUiChannels(c.conversations.map((conv) => conv.channel));
    const latest = latestActivity(allMessages);
    return {
      id: c.id,
      name: c.name,
      contactDetail: c.contactDetail,
      channels,
      conversationCount: c.conversations.length,
      openCount: c.conversations.filter((conv) => conv.status !== 'RESOLVED').length,
      lastActive: latest ? timeAgo(latest) : '—',
    };
  });
}

export async function loadCustomerDetail(
  workspaceId: string,
  customerId: string,
): Promise<CustomerDetail> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId },
    include: {
      conversations: {
        orderBy: { sortOrder: 'asc' },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          assignee: true,
          customer: true,
        },
      },
    },
  });
  if (!customer) throw new InboxApiError(404, 'Customer not found.');
  const conversations = customer.conversations.map(toUiConversation);
  return {
    id: customer.id,
    name: customer.name,
    contactDetail: customer.contactDetail,
    channels: uniqueUiChannels(conversations.map((v) => v.channel)),
    conversationCount: conversations.length,
    openCount: conversations.filter((v) => v.status !== 'Resolved').length,
    conversations,
  };
}
