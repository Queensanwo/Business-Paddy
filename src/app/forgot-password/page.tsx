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
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const { error: err } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: '/reset-password',
      });
      if (err) {
        setError('We could not request a reset email. Please try again or contact support.');
        return;
      }
      setSent(true);
    } catch {
      setError('Could not reach the reset service. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
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
          <p className="assignee" role="status">
            Your request was received. If this email belongs to an account, we’ll request a reset email.
            If it hasn’t arrived after a few minutes, check your account email or contact support.
          </p>
        ) : (
          <>
            <label className="auth-field">
              Account email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </>
        )}
        <p className="auth-alt">
          <Link href="/sign-in">Back to sign in</Link>
        </p>
        <p className="auth-alt">
          Need help? <a href="mailto:businesspaddysupport@gmail.com">Contact Business Paddy support</a>
        </p>
      </form>
    </div>
  );
}
