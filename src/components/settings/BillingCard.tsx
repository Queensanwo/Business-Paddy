'use client';

import { useEffect, useState } from 'react';

interface PaymentRow {
  id: string;
  reference: string;
  amountKobo: number;
  currency: string;
  status: string;
  channel: string | null;
  paidAt: string | null;
  isTest: boolean;
}

function formatAmount(amountKobo: number, currency: string): string {
  const symbol = currency === 'NGN' ? '₦' : `${currency} `;
  return `${symbol}${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export function BillingCard() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [billingMsg, setBillingMsg] = useState('');
  const [billingBusy, setBillingBusy] = useState(false);

  async function refreshPayments() {
    try {
      const res = await fetch('/api/billing/payments');
      if (res.ok) setPayments((await res.json()) as PaymentRow[]);
    } catch {
      /* payments list is informational; inbox still works */
    }
  }

  async function verifyPayment(reference: string) {
    setBillingBusy(true);
    setBillingMsg('Verifying payment with Paystack…');
    try {
      const res = await fetch(`/api/billing/verify?reference=${encodeURIComponent(reference)}`);
      const json = (await res.json()) as PaymentRow & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Verification failed.');
      setBillingMsg(
        `Payment successful: ${formatAmount(json.amountKobo, json.currency)} (reference ${json.reference}). ` +
          'Test mode — no real subscription was activated.',
      );
      await refreshPayments();
    } catch (err) {
      setBillingMsg(err instanceof Error ? err.message : 'Verification failed.');
    }
    setBillingBusy(false);
  }

  async function startCheckout() {
    setBillingMsg('');
    setBillingBusy(true);
    try {
      const res = await fetch('/api/billing/initialize', { method: 'POST' });
      const json = (await res.json()) as { authorizationUrl?: string; error?: string };
      if (!res.ok || !json.authorizationUrl) {
        throw new Error(json.error || 'Could not start checkout.');
      }
      window.location.href = json.authorizationUrl;
    } catch (err) {
      setBillingMsg(err instanceof Error ? err.message : 'Could not start checkout.');
      setBillingBusy(false);
    }
  }

  useEffect(() => {
    refreshPayments();
    // Paystack redirects back here after checkout (?payment=callback&reference=…).
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'callback') {
      const reference = params.get('reference') ?? params.get('trxref') ?? '';
      window.history.replaceState({}, '', window.location.pathname);
      if (reference) {
        verifyPayment(reference);
      } else {
        setBillingMsg('Checkout was closed before finishing. No payment was recorded as successful.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <article className="card received">
      <div className="label">Billing (Paystack test mode)</div>
      <p className="assignee" style={{ marginTop: '8px' }}>
        Test Premium Upgrade — ₦100.00 test charge to exercise the payment flow.
        Test payments never activate a real subscription.
      </p>
      <button className="send" type="button" disabled={billingBusy} style={{ width: '100%', marginTop: '10px' }} onClick={startCheckout}>
        {billingBusy ? 'Working…' : 'Test Premium Upgrade'}
      </button>
      {billingMsg ? <p className="assignee" style={{ marginTop: '8px' }}>{billingMsg}</p> : null}
      {payments.length > 0 ? (
        <div className="conv-list" style={{ marginTop: '10px' }}>
          {payments.map((p) => (
            <div key={p.id} className="conv" style={{ cursor: 'default' }}>
              <div className="conv-top">
                <strong>{formatAmount(p.amountKobo, p.currency)}</strong>
                <span className="status">{p.status}{p.isTest ? ' · test' : ''}</span>
              </div>
              <div className="preview">{p.reference}</div>
              {p.status === 'PENDING' ? (
                <button className="chip" type="button" disabled={billingBusy} onClick={() => verifyPayment(p.reference)}>
                  Verify
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
