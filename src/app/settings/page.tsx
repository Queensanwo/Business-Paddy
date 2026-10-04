'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';

const CHANNELS = ['WhatsApp', 'Instagram', 'TikTok', 'Email', 'Website', 'Paddy Chat'];

interface SettingsData {
  workspace: { id: string; name: string; industry: string | null; mode: 'DEMO' | 'LIVE' };
  owner: { name: string; email: string } | null;
}

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

export default function SettingsPage() {
  const { user } = useSessionUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [data, setData] = useState<SettingsData | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [billingMsg, setBillingMsg] = useState('');
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/sign-in';
          throw new Error('Sign in required.');
        }
        if (!res.ok) throw new Error('Settings request failed.');
        return res.json();
      })
      .then((json) => {
        const parsed = json as SettingsData;
        setData(parsed);
        setBusinessName(parsed.workspace.name);
        setIndustry(parsed.workspace.industry ?? '');
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
    fetch('/api/billing/payments')
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => setPayments(json as PaymentRow[]))
      .catch(() => {});
    // Paystack redirects back here after checkout (?payment=callback&reference=…).
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'callback') {
      const reference = params.get('reference') ?? params.get('trxref') ?? '';
      window.history.replaceState({}, '', '/settings');
      if (reference) {
        verifyPayment(reference);
      } else {
        setBillingMsg('Checkout was closed before finishing. No payment was recorded as successful.');
      }
    }
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    setBusy(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: businessName, industry }),
      });
      const json = (await res.json()) as { workspace?: SettingsData['workspace']; error?: string };
      if (!res.ok) throw new Error(json.error || 'Save failed.');
      if (json.workspace && data) setData({ ...data, workspace: json.workspace });
      setStatus('Settings saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed.');
    }
    setBusy(false);
  }

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

  return (
    <div className="app app-single" id="app">
      <Navigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        active="settings"
        userName={user?.name ?? 'Business Paddy'}
        userSub={user ? `${roleLabel(user.role)} · ${user.workspaceName}` : 'Shared inbox'}
      />
      <section className="main">
        <header className="topbar">
          <button className="menu-btn" id="menuBtn" type="button" onClick={() => setIsMobileMenuOpen(true)}>Menu</button>
          <div>
            <strong>Settings</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Business profile and channels</div>
          </div>
          <a className="chip" href="/">Back to Inbox</a>
        </header>
        <div className="metrics metrics-single">
          <article className="card received">
            <div className="label">Business profile</div>
            {loadState === 'loading' ? <p className="assignee">Loading…</p> : null}
            {loadState === 'error' ? <p className="auth-error">Could not load settings.</p> : null}
            {data ? (
              <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <label className="auth-field">
                  Business name
                  <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </label>
                <label className="auth-field">
                  Industry
                  <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Retail" />
                </label>
                <p className="assignee">Workspace: {data.workspace.name}</p>
                <p className="assignee">Owner email: {data.owner ? data.owner.email : '—'}</p>
                {status ? <p className="assignee">{status}</p> : null}
                <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
                  {busy ? 'Saving…' : 'Save Settings'}
                </button>
              </form>
            ) : null}
          </article>
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
          <article className="card received">
            <div className="label">Channel connections</div>
            <div className="conv-list" style={{ marginTop: '10px' }}>
              {CHANNELS.map((ch) => (
                <div key={ch} className="conv" style={{ cursor: 'default' }}>
                  <div className="conv-top">
                    <strong>{ch}</strong>
                    <span className="status">Not connected yet</span>
                  </div>
                  <div className="preview">Official connection arrives in a later phase.</div>
                </div>
              ))}
            </div>
            <p className="assignee" style={{ marginTop: '8px' }}>
              No channel or storage integration is connected yet. Payments above run in
              Paystack test mode only and move no real money.
            </p>
          </article>
          <article className="card received">
            <div className="label">WhatsApp Cost &amp; Safety Centre</div>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <span className="status">No WhatsApp account connected</span>
            </p>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <strong>How WhatsApp business messaging works.</strong> Businesses reply free
              inside an open 24-hour customer-service window. Starting a conversation
              outside the window — or sending bulk notifications — uses pre-approved
              message templates, which Meta bills per message.
            </p>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <strong>Estimates, not charges.</strong> No live usage exists yet, so every
              figure here is illustrative. Real per-message rates depend on your country,
              template category (utility, marketing or authentication) and Meta&apos;s
              current pricing. Nothing below is a bill.
            </p>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <strong>Sending limits &amp; trust.</strong> New numbers start with low
              throughput and earn higher limits with quality history. Limits will be shown
              per business once an account is connected; nothing is enforced yet.
            </p>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <strong>Stay safe.</strong> Always honour opt-outs, never spam, keep
              templates truthful, and warm new numbers gradually. Poor quality ratings
              can restrict or ban a number.
            </p>
            <p className="auth-alt" style={{ marginTop: '8px' }}>
              Official docs:{' '}
              <a href="https://developers.facebook.com/docs/whatsapp/pricing" target="_blank" rel="noreferrer">Pricing</a>
              {' · '}
              <a href="https://developers.facebook.com/docs/whatsapp/conversation-types" target="_blank" rel="noreferrer">Conversation types</a>
              {' · '}
              <a href="https://developers.facebook.com/docs/whatsapp/message-templates" target="_blank" rel="noreferrer">Templates</a>
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
