import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Idempotent demo seed (fixed ids). Roles/statuses are enums, so the
  // seed covers one demo workspace, staff, a customer and conversations.
  const workspace = await prisma.workspace.upsert({
    where: { id: 'demo-workspace-1' },
    update: {},
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
      id: 'demo-user-owner',
      workspaceId: workspace.id,
      name: 'Ayo Sanwo',
      email: 'owner@example.com',
      role: 'OWNER',
    },
  });

  const agent = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: 'agent@example.com' } },
    update: {},
    create: {
      id: 'demo-user-agent',
      workspaceId: workspace.id,
      name: 'Funke Bello',
      email: 'agent@example.com',
      role: 'AGENT',
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: 'demo-customer-1' },
    update: {},
    create: {
      id: 'demo-customer-1',
      workspaceId: workspace.id,
      name: 'Ngozi Adeyemi',
      contactDetail: 'whatsapp:+2340000000001',
    },
  });

  const conversation = await prisma.conversation.upsert({
    where: { id: 'demo-conversation-1' },
    update: {},
    create: {
      id: 'demo-conversation-1',
      workspaceId: workspace.id,
      customerId: customer.id,
      channel: 'WHATSAPP',
      status: 'NEW',
      preview: 'Please, do you still have the Ankara set in size 14?',
    },
  });

  await prisma.message.upsert({
    where: { id: 'demo-message-1' },
    update: {},
    create: {
      id: 'demo-message-1',
      conversationId: conversation.id,
      kind: 'CUSTOMER',
      senderName: 'Ngozi Adeyemi',
      text: 'Good evening. Please, do you still have the Ankara set in size 14?',
    },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      actorId: owner.id,
      action: 'workspace.seeded',
      entityType: 'Workspace',
      entityId: workspace.id,
    },
  });

  const counts = {
    workspaces: await prisma.workspace.count(),
    users: await prisma.user.count({ where: { workspaceId: workspace.id } }),
    customers: await prisma.customer.count({ where: { workspaceId: workspace.id } }),
    conversations: await prisma.conversation.count({ where: { workspaceId: workspace.id } }),
    messages: await prisma.message.count(),
  };
  console.log('Seed complete (agent id: ' + agent.id + '):', JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
