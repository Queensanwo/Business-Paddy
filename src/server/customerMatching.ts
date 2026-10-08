import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';

/**
 * Customer matching utilities for cross-channel identity resolution.
 *
 * FR14: The product suggests possible cross channel matches and requires staff confirmation.
 * FR15: Authorised users can separate conversations that were matched incorrectly.
 */

export interface MatchCandidate {
  customerId: string;
  customerName: string;
  contactDetail: string | null;
  matchScore: number;
  matchReasons: string[];
  conversations: {
    id: string;
    channel: string;
    status: string;
    preview: string;
    createdAt: Date;
  }[];
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a score between 0 and 1
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  if (aLower === bLower) return 1;

  const len1 = aLower.length;
  const len2 = bLower.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / Math.max(len1, len2);
}

function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\+]/g, '');
}

function normalizeEmail(email: string | null): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

function getNameParts(name: string): string[] {
  return name.toLowerCase().trim().split(/\s+/).filter(p => p.length > 1);
}

export function calculateMatchScore(
  customerA: { name: string; contactDetail: string | null },
  customerB: { name: string; contactDetail: string | null }
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalScore = 0;
  let factors = 0;

  const namePartsA = getNameParts(customerA.name);
  const namePartsB = getNameParts(customerB.name);

  let nameScore = 0;
  if (namePartsA.length > 0 && namePartsB.length > 0) {
    if (customerA.name.toLowerCase().trim() === customerB.name.toLowerCase().trim()) {
      nameScore = 1;
      reasons.push('Exact name match');
    } else {
      const commonParts = namePartsA.filter(p => namePartsB.includes(p));
      if (commonParts.length > 0) {
        nameScore = Math.min(0.8, commonParts.length / Math.max(namePartsA.length, namePartsB.length) * 1.5);
        if (nameScore > 0.5) {
          reasons.push('Name parts match: ' + commonParts.join(', '));
        }
      }

      if (nameScore === 0) {
        nameScore = stringSimilarity(customerA.name, customerB.name) * 0.5;
        if (nameScore > 0.3) {
          reasons.push('Similar names (' + Math.round(nameScore * 100) + '%)');
        }
      }
    }

    totalScore += nameScore * 0.5;
    factors += 0.5;
  }

  const contactA = customerA.contactDetail || '';
  const contactB = customerB.contactDetail || '';

  let contactScore = 0;

  const phoneA = contactA.match(/(\+?\d[\d\s\-]{6,})/g) || [];
  const phoneB = contactB.match(/(\+?\d[\d\s\-]{6,})/g) || [];

  for (const pA of phoneA) {
    const normA = normalizePhone(pA);
    for (const pB of phoneB) {
      const normB = normalizePhone(pB);
      if (normA && normB && (normA === normB || normA.endsWith(normB) || normB.endsWith(normA))) {
        contactScore = Math.max(contactScore, 0.9);
        reasons.push('Phone match: ' + pA.trim());
        break;
      }
    }
  }

  const emailA = contactA.match(/[^\s@]+@[^\s@]+\.[^\s@]+/g) || [];
  const emailB = contactB.match(/[^\s@]+@[^\s@]+\.[^\s@]+/g) || [];

  for (const eA of emailA) {
    for (const eB of emailB) {
      if (normalizeEmail(eA) === normalizeEmail(eB)) {
        contactScore = Math.max(contactScore, 0.95);
        reasons.push('Email match: ' + eA);
        break;
      }
    }
  }

  if (contactScore === 0) {
    const wordsA = contactA.toLowerCase().split(/[\s@:\/]/).filter(w => w.length > 3);
    const wordsB = contactB.toLowerCase().split(/[\s@:\/]/).filter(w => w.length > 3);

    const commonWords = wordsA.filter(w => wordsB.includes(w));
    if (commonWords.length > 0) {
      contactScore = Math.min(0.4, commonWords.length / Math.max(wordsA.length, wordsB.length) * 2);
      if (contactScore > 0.2) {
        reasons.push('Contact info overlap: ' + commonWords.slice(0, 3).join(', '));
      }
    }
  }

  totalScore += contactScore * 0.5;
  factors += 0.5;

  return {
    score: factors > 0 ? totalScore / factors : 0,
    reasons: reasons.length > 0 ? reasons : ['Low confidence match']
  };
}

export async function findCustomerMatches(workspaceId: string, customerId: string) {
  // Target scoped to the staff workspace: ids from other businesses resolve to 404.
  const targetCustomer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId },
    select: { id: true, name: true, contactDetail: true }
  });

  if (!targetCustomer) {
    throw new InboxApiError(404, 'Customer not found.');
  }

  const otherCustomers = await prisma.customer.findMany({
    where: {
      workspaceId,
      id: { not: customerId }
    },
    include: {
      conversations: {
        where: { channel: { not: 'PADDY_CHAT' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          channel: true,
          status: true,
          preview: true,
          createdAt: true
        }
      }
    }
  });

  const candidates = [];

  for (const other of otherCustomers) {
    const { score, reasons } = calculateMatchScore(
      { name: targetCustomer.name, contactDetail: targetCustomer.contactDetail },
      { name: other.name, contactDetail: other.contactDetail }
    );

    if (score >= 0.3) {
      candidates.push({
        customerId: other.id,
        customerName: other.name,
        contactDetail: other.contactDetail,
        matchScore: Math.round(score * 100),
        matchReasons: reasons,
        conversations: other.conversations.map(c => ({
          id: c.id,
          channel: c.channel,
          status: c.status,
          preview: c.preview || '',
          createdAt: c.createdAt
        }))
      });
    }
  }

  return candidates.sort((a, b) => b.matchScore - a.matchScore);
}

export async function getWorkspaceMatchSuggestions(workspaceId: string) {
  const customers = await prisma.customer.findMany({
    where: { workspaceId },
    include: {
      conversations: {
        where: { channel: { not: 'PADDY_CHAT' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          channel: true,
          status: true,
          preview: true,
          createdAt: true
        }
      }
    }
  });

  const groups = [];

  for (const customer of customers) {
    const matches = await findCustomerMatches(workspaceId, customer.id);
    if (matches.length > 0) {
      groups.push({
        primaryCustomerId: customer.id,
        primaryCustomerName: customer.name,
        matches
      });
    }
  }

  return { groups };
}

export async function confirmCustomerMatch(
  workspaceId: string,
  primaryCustomerId: string,
  matchCustomerId: string,
  confirmedBy: string
): Promise<void> {
  if (primaryCustomerId === matchCustomerId) {
    throw new InboxApiError(400, 'A customer cannot be merged with itself.');
  }
  // Both records must belong to the staff workspace.
  const inScope = await prisma.customer.count({
    where: { id: { in: [primaryCustomerId, matchCustomerId] }, workspaceId },
  });
  if (inScope !== 2) throw new InboxApiError(404, 'Customer not found.');
  await prisma.$transaction(async (tx) => {
    await tx.conversation.updateMany({
      where: { customerId: matchCustomerId },
      data: { customerId: primaryCustomerId }
    });

    // Reminders follow their conversations, so nothing extra to update.

    const [primary, match] = await Promise.all([
      tx.customer.findUnique({ where: { id: primaryCustomerId }, select: { contactDetail: true } }),
      tx.customer.findUnique({ where: { id: matchCustomerId }, select: { contactDetail: true } })
    ]);

    if (match?.contactDetail && !primary?.contactDetail) {
      await tx.customer.update({
        where: { id: primaryCustomerId },
        data: { contactDetail: match.contactDetail }
      });
    }

    await tx.customer.delete({ where: { id: matchCustomerId } });

    await tx.auditLog.create({
      data: {
        workspaceId,
        actorId: confirmedBy,
        action: 'customer.matched',
        entityType: 'Customer',
        entityId: primaryCustomerId,
      },
    });
  });
}

export async function separateCustomerMatch(
  workspaceId: string,
  conversationIds: string[],
  separatedBy: string
): Promise<void> {
  if (conversationIds.length === 0) {
    throw new InboxApiError(400, 'No conversations provided for separation.');
  }
  // Every conversation must belong to the staff workspace.
  const inScope = await prisma.conversation.count({
    where: { id: { in: conversationIds }, workspaceId },
  });
  if (inScope !== conversationIds.length) {
    throw new InboxApiError(404, 'Conversation not found.');
  }

  await prisma.$transaction(async (tx) => {
    const firstConv = await tx.conversation.findUnique({
      where: { id: conversationIds[0] },
      include: { customer: true }
    });

    if (!firstConv || !firstConv.customer) throw new Error('Conversation not found');

    const newCustomer = await prisma.customer.create({
      data: {
        workspaceId,
        name: firstConv.customer.name + ' (separated)',
        contactDetail: firstConv.customer.contactDetail || null,
      }
    });

    await prisma.conversation.updateMany({
      where: { id: { in: conversationIds } },
      data: { customerId: newCustomer.id }
    });

    // Reminders follow their conversations, so nothing extra to update.

    await tx.auditLog.create({
      data: {
        workspaceId,
        actorId: separatedBy,
        action: 'customer.separated',
        entityType: 'Conversation',
        entityId: conversationIds[0],
      },
    });
  });
}
