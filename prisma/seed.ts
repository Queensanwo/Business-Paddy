import { PrismaClient, Channel, ConvStatus } from '@prisma/client';
import { auth } from '../src/server/auth';

const prisma = new PrismaClient();

// Demo-only credentials (documented in README, never for real data).
const OWNER_EMAIL = 'owner@example.com';
const OWNER_PASSWORD = 'demo-owner-123';
const AGENT_EMAIL = 'agent@example.com';
const AGENT_PASSWORD = 'demo-agent-123';

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
  assignee: 'OWNER' | 'AGENT' | null;
  guestToken?: string;
  sortOrder: number;
  messages: SeedMessage[];
}

// Same threads as the Phase 1 mock inbox, stored as clearly-marked demo data.
// Statuses mirror the mock: New threads have customer messages only; the
// unanswered set is derived from "no STAFF message", giving c1, c6, c8, c9.
const CONVERSATIONS: SeedConversation[] = [
  {
    id: 'c1', customer: 'Ngozi Adeyemi', contact: 'whatsapp:+2340000000001',
    channel: 'WHATSAPP', status: 'NEW', assignee: null, sortOrder: 1,
    messages: [
      { kind: 'CUSTOMER', who: 'Ngozi Adeyemi', text: 'Good evening. Please, do you still have the Ankara set in size 14?', atMinutesAgo: 2 },
    ],
  },
  {
    id: 'c2', customer: 'Ibrahim Musa', contact: 'instagram:@ibrahim.musa',
    channel: 'INSTAGRAM', status: 'IN_PROGRESS', assignee: 'AGENT', sortOrder: 2,
    messages: [
      { kind: 'CUSTOMER', who: 'Ibrahim Musa', text: 'The brown sandals in your story — how much for two pairs?', atMinutesAgo: 21 },
      { kind: 'STAFF', who: 'Funke Bello', text: 'Hi Ibrahim, two pairs are ₦28,000 including delivery in Abuja. Shall I hold them?', atMinutesAgo: 18 },
    ],
  },
  {
    id: 'c3', customer: 'Chioma Okeke', contact: 'chioma.okeke@example.com',
    channel: 'EMAIL', status: 'WAITING_FOR_CUSTOMER', assignee: 'OWNER', sortOrder: 3,
    messages: [
      { kind: 'CUSTOMER', who: 'Chioma Okeke', text: 'Hello, I paid for order 1042 this morning. Can you confirm it will go to Enugu, Independence Layout?', atMinutesAgo: 70 },
      { kind: 'STAFF', who: 'Ayo Sanwo', text: 'Chioma, thank you. Please reply with the street number and a landmark so we can book the rider.', atMinutesAgo: 60 },
    ],
  },
  {
    id: 'c4', customer: 'Tunde Bakare', contact: 'whatsapp:+2340000000004',
    channel: 'WHATSAPP', status: 'FOLLOW_UP', assignee: 'AGENT', sortOrder: 4,
    messages: [
      { kind: 'CUSTOMER', who: 'Tunde Bakare', text: 'Paddy, has the wholesale crate of tomatoes arrived from Mile 12?', atMinutesAgo: 1560 },
      { kind: 'STAFF', who: 'Funke Bello', text: 'Tunde, the truck is due this afternoon. I will message you as soon as we offload.', atMinutesAgo: 1500 },
    ],
  },
  {
    id: 'c5', customer: 'Amaka Eze', contact: 'instagram:@amaka.eze',
    channel: 'INSTAGRAM', status: 'ESCALATED', assignee: 'OWNER', sortOrder: 5,
    messages: [
      { kind: 'CUSTOMER', who: 'Amaka Eze', text: 'You sent royal blue instead of mustard. I need a replacement today before the event.', atMinutesAgo: 200 },
      { kind: 'STAFF', who: 'Funke Bello', text: 'Amaka, I am sorry. I have escalated this so the owner can approve a same-day swap.', atMinutesAgo: 180 },
    ],
  },
  {
    id: 'c6', customer: 'David Mensah', contact: 'david.mensah@example.com',
    channel: 'EMAIL', status: 'NEW', assignee: null, sortOrder: 6,
    messages: [
      { kind: 'CUSTOMER', who: 'David Mensah', text: 'I run a shop in Accra and need 40kg of unrefined shea butter. What is your wholesale rate and shipping time?', atMinutesAgo: 240 },
    ],
  },
  {
    id: 'c7', customer: 'Halima Bello', contact: 'whatsapp:+2340000000007',
    channel: 'WHATSAPP', status: 'RESOLVED', assignee: 'OWNER', sortOrder: 7,
    messages: [
      { kind: 'CUSTOMER', who: 'Halima Bello', text: 'Has my wrapper left the shop?', atMinutesAgo: 2900 },
      { kind: 'STAFF', who: 'Ayo Sanwo', text: 'Yes Halima, GIG is collecting it at 3pm. Tracking will follow.', atMinutesAgo: 2800 },
      { kind: 'CUSTOMER', who: 'Halima Bello', text: 'Thank you, the wrapper arrived in good condition.', atMinutesAgo: 2700 },
    ],
  },
  {
    id: 'c8', customer: 'Ruth Boateng', contact: 'ruth.boateng@example.com',
    channel: 'EMAIL', status: 'IN_PROGRESS', assignee: 'AGENT', sortOrder: 8,
    messages: [
      { kind: 'CUSTOMER', who: 'Ruth Boateng', text: 'Please change my Saturday pickup to Monday morning. I will be travelling.', atMinutesAgo: 300 },
    ],
  },
  {
    id: 'c9', customer: 'Adaeze Nwosu', contact: 'tiktok:@adaeze.nwosu',
    channel: 'TIKTOK', status: 'NEW', assignee: null, sortOrder: 9,
    messages: [
      { kind: 'CUSTOMER', who: 'Adaeze Nwosu', text: 'Hello! I saw your TikTok video. Is the skincare bundle still on promo?', atMinutesAgo: 32 },
    ],
  },
  {
    id: 'c10', customer: 'Emeka Obi', contact: 'paddy-chat:guest',
    channel: 'PADDY_CHAT', status: 'NEW', assignee: null, sortOrder: 10,
    guestToken: 'b'.repeat(64),
    messages: [
      { kind: 'CUSTOMER', who: 'Emeka Obi', text: 'Good afternoon! Do you deliver Ankara fabrics to Ikeja?', atMinutesAgo: 12 },
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

  // Recreate demo staff through Better Auth so credential accounts exist.
  await prisma.user.deleteMany({
    where: { workspaceId: workspace.id, email: { in: [OWNER_EMAIL, AGENT_EMAIL] } },
  });
  const ownerSignup = await auth.api.signUpEmail({
    headers: new Headers(),
    body: {
      name: 'Ayo Sanwo', email: OWNER_EMAIL, password: OWNER_PASSWORD,
      workspaceId: workspace.id, role: 'OWNER',
    },
  });
  const agentSignup = await auth.api.signUpEmail({
    headers: new Headers(),
    body: {
      name: 'Funke Bello', email: AGENT_EMAIL, password: AGENT_PASSWORD,
      workspaceId: workspace.id, role: 'AGENT',
    },
  });
  const owner = { id: ownerSignup.user.id };
  const agent = { id: agentSignup.user.id };

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
        guestToken: conv.guestToken ?? null,
        assigneeId: conv.assignee === 'OWNER' ? owner.id : conv.assignee === 'AGENT' ? agent.id : null,
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
