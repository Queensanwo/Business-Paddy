'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });
    setBusy(false);
    if (err) {
      setError('Could not send the reset email. Try again later.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="brand" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
          <div className="logo">BP</div>
          <div>
            <h1>Business Paddy</h1>
            <p>Reset your password</p>
          </div>
        </div>
        {sent ? (
          <p className="assignee">
            If an account uses that email, a reset link is on its way. Check your inbox
            (and spam folder), then follow the link to choose a new password.
          </p>
        ) : (
          <>
            <label className="auth-field">
              Account email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </>
        )}
        <p className="auth-alt">
          <Link href="/sign-in">Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}
