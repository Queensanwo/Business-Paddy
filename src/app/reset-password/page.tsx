'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (err) {
      setError('This link is invalid or has expired. Request a new one.');
      return;
    }
    setDone(true);
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="brand" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
          <div className="logo">BP</div>
          <div>
            <h1>Business Paddy</h1>
            <p>Choose a new password</p>
          </div>
        </div>
        {!token ? (
          <p className="auth-error">This reset link is missing its token. Request a new link below.</p>
        ) : done ? (
          <p className="assignee">
            Password updated. <Link href="/sign-in">Sign in with your new password</Link>.
          </p>
        ) : (
          <>
            <label className="auth-field">
              New password (8+ characters)
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : 'Set new password'}
            </button>
          </>
        )}
        <p className="auth-alt">
          <Link href="/forgot-password">Request a new link</Link>
        </p>
      </form>
    </div>
  );
}
