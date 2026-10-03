import { PrismaClient, Channel, ConvStatus } from '@prisma/client';

const prisma = new PrismaClient();

const OWNER_ID = 'demo-user-owner';
const AGENT_ID = 'demo-user-agent';

interface SeedMessage {
  kind: 'CUSTOMER' | 'STAFF';
  who: string;
  text: string;
  atMinutesAgo: number;
}

interface SeedConversation {
  id: string;
  customer: string;
  contact: string;
  channel: Channel;
  status: ConvStatus;
  assigneeId: string | null;
  sortOrder: number;
  messages: SeedMessage[];
}

// Same threads as the Phase 1 mock inbox, stored as clearly-marked demo data.
// Statuses mirror the mock: New threads have customer messages only; the
// unanswered set is derived from "no STAFF message", giving c1, c6, c8, c9.
const CONVERSATIONS: SeedConversation[] = [
  {
    id: 'c1', customer: 'Ngozi Adeyemi', contact: 'whatsapp:+2340000000001',
    channel: 'WHATSAPP', status: 'NEW', assigneeId: null, sortOrder: 1,
    messages: [
      { kind: 'CUSTOMER', who: 'Ngozi Adeyemi', text: 'Good evening. Please, do you still have the Ankara set in size 14?', atMinutesAgo: 2 },
    ],
  },
  {
    id: 'c2', customer: 'Ibrahim Musa', contact: 'instagram:@ibrahim.musa',
    channel: 'INSTAGRAM', status: 'IN_PROGRESS', assigneeId: AGENT_ID, sortOrder: 2,
    messages: [
      { kind: 'CUSTOMER', who: 'Ibrahim Musa', text: 'The brown sandals in your story — how much for two pairs?', atMinutesAgo: 21 },
      { kind: 'STAFF', who: 'Funke Bello', text: 'Hi Ibrahim, two pairs are ₦28,000 including delivery in Abuja. Shall I hold them?', atMinutesAgo: 18 },
    ],
  },
  {
    id: 'c3', customer: 'Chioma Okeke', contact: 'chioma.okeke@example.com',
    channel: 'EMAIL', status: 'WAITING_FOR_CUSTOMER', assigneeId: OWNER_ID, sortOrder: 3,
    messages: [
      { kind: 'CUSTOMER', who: 'Chioma Okeke', text: 'Hello, I paid for order 1042 this morning. Can you confirm it will go to Enugu, Independence Layout?', atMinutesAgo: 70 },
      { kind: 'STAFF', who: 'Ayo Sanwo', text: 'Chioma, thank you. Please reply with the street number and a landmark so we can book the rider.', atMinutesAgo: 60 },
    ],
  },
  {
    id: 'c4', customer: 'Tunde Bakare', contact: 'whatsapp:+2340000000004',
    channel: 'WHATSAPP', status: 'FOLLOW_UP', assigneeId: AGENT_ID, sortOrder: 4,
    messages: [
      { kind: 'CUSTOMER', who: 'Tunde Bakare', text: 'Paddy, has the wholesale crate of tomatoes arrived from Mile 12?', atMinutesAgo: 1560 },
      { kind: 'STAFF', who: 'Funke Bello', text: 'Tunde, the truck is due this afternoon. I will message you as soon as we offload.', atMinutesAgo: 1500 },
    ],
  },
  {
    id: 'c5', customer: 'Amaka Eze', contact: 'instagram:@amaka.eze',
    channel: 'INSTAGRAM', status: 'ESCALATED', assigneeId: OWNER_ID, sortOrder: 5,
    messages: [
      { kind: 'CUSTOMER', who: 'Amaka Eze', text: 'You sent royal blue instead of mustard. I need a replacement today before the event.', atMinutesAgo: 200 },
      { kind: 'STAFF', who: 'Funke Bello', text: 'Amaka, I am sorry. I have escalated this so the owner can approve a same-day swap.', atMinutesAgo: 180 },
    ],
  },
  {
    id: 'c6', customer: 'David Mensah', contact: 'david.mensah@example.com',
    channel: 'EMAIL', status: 'NEW', assigneeId: null, sortOrder: 6,
    messages: [
      { kind: 'CUSTOMER', who: 'David Mensah', text: 'I run a shop in Accra and need 40kg of unrefined shea butter. What is your wholesale rate and shipping time?', atMinutesAgo: 240 },
    ],
  },
  {
    id: 'c7', customer: 'Halima Bello', contact: 'whatsapp:+2340000000007',
    channel: 'WHATSAPP', status: 'RESOLVED', assigneeId: OWNER_ID, sortOrder: 7,
    messages: [
      { kind: 'CUSTOMER', who: 'Halima Bello', text: 'Has my wrapper left the shop?', atMinutesAgo: 2900 },
      { kind: 'STAFF', who: 'Ayo Sanwo', text: 'Yes Halima, GIG is collecting it at 3pm. Tracking will follow.', atMinutesAgo: 2800 },
      { kind: 'CUSTOMER', who: 'Halima Bello', text: 'Thank you, the wrapper arrived in good condition.', atMinutesAgo: 2700 },
    ],
  },
  {
    id: 'c8', customer: 'Ruth Boateng', contact: 'ruth.boateng@example.com',
    channel: 'EMAIL', status: 'IN_PROGRESS', assigneeId: AGENT_ID, sortOrder: 8,
    messages: [
      { kind: 'CUSTOMER', who: 'Ruth Boateng', text: 'Please change my Saturday pickup to Monday morning. I will be travelling.', atMinutesAgo: 300 },
    ],
  },
  {
    id: 'c9', customer: 'Adaeze Nwosu', contact: 'tiktok:@adaeze.nwosu',
    channel: 'TIKTOK', status: 'NEW', assigneeId: null, sortOrder: 9,
    messages: [
      { kind: 'CUSTOMER', who: 'Adaeze Nwosu', text: 'Hello! I saw your TikTok video. Is the skincare bundle still on promo?', atMinutesAgo: 32 },
    ],
  },
];

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { id: 'demo-workspace-1' },
    update: { name: 'Lagos Market Hub', mode: 'DEMO' },
    create: {
      id: 'demo-workspace-1',
      name: 'Lagos Market Hub',
      industry: 'Retail',
      contactEmail: 'owner@example.com',
      contactPhone: '+2340000000000',
      mode: 'DEMO',
    },
  });

  const owner = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: 'owner@example.com' } },
    update: {},
    create: {
      id: OWNER_ID, workspaceId: workspace.id, name: 'Ayo Sanwo',
      email: 'owner@example.com', role: 'OWNER',
    },
  });

  const agent = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: 'agent@example.com' } },
    update: {},
    create: {
      id: AGENT_ID, workspaceId: workspace.id, name: 'Funke Bello',
      email: 'agent@example.com', role: 'AGENT',
    },
  });

  // Deterministic demo dataset: clear all demo workspace conversations,
  // customers and reminders first (including rows from earlier seeds), then recreate.
  await prisma.message.deleteMany({ where: { conversation: { workspaceId: workspace.id } } });
  await prisma.reminder.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.conversation.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.customer.deleteMany({ where: { workspaceId: workspace.id } });

  for (const conv of CONVERSATIONS) {
    const customer = await prisma.customer.create({
      data: {
        workspaceId: workspace.id, name: conv.customer, contactDetail: conv.contact,
      },
    });
    const last = conv.messages[conv.messages.length - 1];
    await prisma.conversation.create({
      data: {
        id: conv.id,
        workspaceId: workspace.id,
        customerId: customer.id,
        channel: conv.channel,
        status: conv.status,
        sortOrder: conv.sortOrder,
        assigneeId: conv.assigneeId,
        preview: last.text,
        messages: {
          create: conv.messages.map((m, i) => ({
            id: `${conv.id}-m${i + 1}`,
            kind: m.kind,
            senderName: m.who,
            text: m.text,
            createdAt: new Date(Date.now() - m.atMinutesAgo * 60000),
          })),
        },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id, actorId: owner.id, action: 'workspace.seeded',
      entityType: 'Workspace', entityId: workspace.id,
    },
  });

  const counts = {
    workspaces: await prisma.workspace.count(),
    users: await prisma.user.count({ where: { workspaceId: workspace.id } }),
    customers: await prisma.customer.count({ where: { workspaceId: workspace.id } }),
    conversations: await prisma.conversation.count({ where: { workspaceId: workspace.id } }),
    messages: await prisma.message.count({ where: { conversation: { workspaceId: workspace.id } } }),
  };
  console.log(`Seed complete (agent id: ${agent.id}):`, JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
