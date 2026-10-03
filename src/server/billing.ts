import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { InboxApiError } from '@/server/inboxStore';

// Test-mode premium used only to exercise the Paystack flow end to end.
// A test payment NEVER activates a real subscription (see verifyTestPayment).
export const TEST_PREMIUM_AMOUNT_KOBO = 10000; // NGN 100.00
export const TEST_PREMIUM_CURRENCY = 'NGN';

const PAYSTACK_API = 'https://api.paystack.co';

function getSecret(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new InboxApiError(
      503,
      'Paystack test key is not configured. Add PAYSTACK_SECRET_KEY to .env and restart the app.',
    );
  }
  return secret;
}

function appUrl(): string {
  return process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
}

export interface PaymentSummary {
  id: string;
  reference: string;
  email: string | null;
  amountKobo: number;
  currency: string;
  status: string;
  channel: string | null;
  paidAt: string | null;
  isTest: boolean;
  createdAt: string;
}

function toSummary(p: {
  id: string;
  reference: string;
  email: string | null;
  amountKobo: number;
  currency: string;
  status: string;
  channel: string | null;
  paidAt: Date | null;
  isTest: boolean;
  createdAt: Date;
}): PaymentSummary {
  return {
    id: p.id,
    reference: p.reference,
    email: p.email,
    amountKobo: p.amountKobo,
    currency: p.currency,
    status: p.status,
    channel: p.channel,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    isTest: p.isTest,
    createdAt: p.createdAt.toISOString(),
  };
}

function newReference(workspaceId: string): string {
  const short = workspaceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'ws';
  return `paddy_test_${short}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

interface PaystackInitResponse {
  status?: unknown;
  message?: unknown;
  data?: { authorization_url?: unknown; reference?: unknown };
}

interface PaystackVerifyResponse {
  status?: unknown;
  message?: unknown;
  data?: {
    status?: unknown;
    reference?: unknown;
    amount?: unknown;
    currency?: unknown;
    channel?: unknown;
    paid_at?: unknown;
    metadata?: unknown;
  };
}

/** Creates a PENDING row and starts a Paystack test checkout. Returns the hosted URL. */
export async function initializeTestPayment(
  workspaceId: string,
  email: string,
): Promise<{ authorizationUrl: string; payment: PaymentSummary }> {
  const secret = getSecret();
  const reference = newReference(workspaceId);
  const payment = await prisma.payment.create({
    data: {
      workspaceId,
      reference,
      email,
      amountKobo: TEST_PREMIUM_AMOUNT_KOBO,
      currency: TEST_PREMIUM_CURRENCY,
      status: 'PENDING',
      isTest: true,
      activatedSubscription: false,
    },
  });

  let init: PaystackInitResponse;
  try {
    const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: TEST_PREMIUM_AMOUNT_KOBO,
        currency: TEST_PREMIUM_CURRENCY,
        reference,
        callback_url: `${appUrl()}/settings?payment=callback`,
        metadata: { workspaceId, purpose: 'test_premium_upgrade' },
      }),
    });
    init = (await res.json()) as PaystackInitResponse;
    if (!res.ok || init.status !== true || typeof init.data?.authorization_url !== 'string') {
      throw new Error(typeof init.message === 'string' ? init.message : 'Paystack initialize failed.');
    }
  } catch (e) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });
    throw e instanceof InboxApiError
      ? e
      : new InboxApiError(502, 'Could not reach Paystack. Check the test key and connection.');
  }

  return {
    authorizationUrl: init.data.authorization_url as string,
    payment: toSummary(payment),
  };
}

/**
 * Verifies a reference with Paystack and records the outcome.
 * Only marks SUCCESS when status, reference, amount, currency AND workspace
 * all match. Test payments never flip activatedSubscription.
 */
export async function verifyTestPayment(
  workspaceId: string,
  reference: string,
): Promise<PaymentSummary> {
  const secret = getSecret();
  const row = await prisma.payment.findUnique({ where: { reference } });
  if (!row || row.workspaceId !== workspaceId) {
    throw new InboxApiError(404, 'Payment not found for this workspace.');
  }
  if (row.status === 'SUCCESS') return toSummary(row); // idempotent: no duplicate records

  let body: PaystackVerifyResponse;
  try {
    const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    body = (await res.json()) as PaystackVerifyResponse;
    if (!res.ok || body.status !== true || typeof body.data !== 'object' || body.data === null) {
      throw new Error('Paystack verify failed.');
    }
  } catch (e) {
    throw e instanceof InboxApiError
      ? e
      : new InboxApiError(502, 'Could not reach Paystack. Check the test key and connection.');
  }

  const data = body.data as NonNullable<PaystackVerifyResponse['data']>;
  const meta = (data.metadata ?? {}) as Record<string, unknown>;
  const matches =
    data.status === 'success' &&
    data.reference === reference &&
    data.amount === row.amountKobo &&
    data.currency === row.currency &&
    meta.workspaceId === workspaceId;

  const updated = await prisma.payment.update({
    where: { id: row.id },
    data: matches
      ? {
          status: 'SUCCESS',
          channel: typeof data.channel === 'string' ? data.channel : null,
          paidAt: typeof data.paid_at === 'string' ? new Date(data.paid_at) : new Date(),
          activatedSubscription: false, // test payments never activate subscriptions
        }
      : { status: 'FAILED' },
  });
  if (!matches) {
    throw new InboxApiError(400, 'Payment could not be verified as successful.');
  }
  return toSummary(updated);
}

export async function listPayments(workspaceId: string): Promise<PaymentSummary[]> {
  const rows = await prisma.payment.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return rows.map(toSummary);
}
