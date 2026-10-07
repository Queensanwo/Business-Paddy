'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    let signInError = '';
    try {
      const { error: err } = await authClient.signIn.email({ email, password });
      if (err) {
        const message =
          typeof (err as { message?: unknown }).message === 'string' &&
          (err as { message: string }).message
            ? (err as { message: string }).message
            : '';
        signInError = message || 'Sign in failed. Check your email and password.';
      }
    } catch {
      signInError =
        'Could not reach the sign-in service. The database may be waking up — wait a minute and try again.';
    }
    setBusy(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    router.push('/inbox');
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="brand" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
          <div className="logo">BP</div>
          <div>
            <h1>Business Paddy</h1>
            <p>Owner sign in</p>
          </div>
        </div>
        <label className="auth-field">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="auth-field">
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="auth-alt">
          <Link href="/forgot-password">Forgot password?</Link>
        </p>
        <p className="auth-alt">
          New business? <Link href="/sign-up">Create a workspace</Link>
        </p>
      </form>
    </div>
  );
}
