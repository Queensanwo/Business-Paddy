'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface InvitationInfo {
  name: string;
  email: string;
  role: string;
  workspaceName: string;
  expiresAt: string;
}

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/team/invite/${params.token}`)
      .then(async (res) => {
        const json = (await res.json()) as InvitationInfo & { error?: string };
        if (!res.ok) throw new Error(json.error || 'Invitation unavailable.');
        setInfo(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Invitation unavailable.'));
  }, [params.token]);

  async function onAccept(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`/api/team/invite/${params.token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not accept the invitation.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept the invitation.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
          <div className="logo">BP</div>
          <div>
            <h1>Business Paddy</h1>
            <p>Staff invitation</p>
          </div>
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        {!error && !info ? <p className="assignee">Loading invitation…</p> : null}
        {info && !done ? (
          <form onSubmit={onAccept} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p className="assignee">
              {info.name}, you&apos;ve been invited to join <strong>{info.workspaceName}</strong> as{' '}
              <strong>{info.role}</strong> ({info.email}).
            </p>
            <label className="auth-field">
              Set your password (8+ characters)
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Joining…' : 'Accept & Join'}
            </button>
          </form>
        ) : null}
        {done ? (
          <>
            <p className="assignee">Welcome aboard! Your login is ready.</p>
            <p className="auth-alt">
              <Link href="/sign-in">Sign in to the inbox</Link>
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
