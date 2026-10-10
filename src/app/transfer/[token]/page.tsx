'use client';

import { useEffect, useState } from 'react';

interface TransferInfo {
  workspaceName: string;
  recipientEmail: string;
  expiresAt: string;
  initiatorName: string;
}

export default function TransferPage({ params }: { params: { token: string } }) {
  const [info, setInfo] = useState<TransferInfo | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/ownership/transfer/token/${params.token}`)
      .then(async (res) => {
        const json = (await res.json()) as TransferInfo & { error?: string };
        if (!res.ok) throw new Error(json.error || 'Handover unavailable.');
        setInfo(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Handover unavailable.'));
  }, [params.token]);

  async function onAccept() {
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch(`/api/ownership/transfer/token/${params.token}/accept`, { method: 'POST' });
      const json = (await res.json()) as { accepted?: boolean; note?: string; error?: string };
      if (res.status === 401) {
        window.location.href = '/sign-in';
        throw new Error('Sign in required.');
      }
      if (!res.ok || !json.accepted) throw new Error(json.error || 'Could not accept.');
      setMsg(`${json.note ?? 'You are now the owner.'} Opening your inbox…`);
      setTimeout(() => {
        window.location.href = '/inbox';
      }, 2500);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not accept.');
    }
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ width: 'min(520px, 100%)' }}>
        <div className="brand" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
          <div className="logo">BP</div>
          <div>
            <h1>Take ownership</h1>
            <p>Business Paddy workspace handover</p>
          </div>
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        {!error && !info ? <p className="assignee">Loading…</p> : null}
        {info ? (
          <>
            <p style={{ fontSize: '0.9rem' }}>
              <strong>{info.initiatorName}</strong> is handing over ownership of{' '}
              <strong>{info.workspaceName}</strong> to <strong>{info.recipientEmail}</strong>.
            </p>
            <p className="assignee">Sign in as {info.recipientEmail} first if asked. Until you accept, nothing changes.</p>
            <p className="assignee">After you accept, the previous owner becomes a manager. Connected social, email and payment accounts do not move — you reconnect them yourself.</p>
            {msg ? <p className="assignee">{msg}</p> : null}
            <button className="send" type="button" disabled={busy} style={{ width: '100%' }} onClick={onAccept}>
              {busy ? 'Working…' : 'Accept ownership'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
