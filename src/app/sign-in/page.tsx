'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [supportsPasskey, setSupportsPasskey] = useState(false);

  useEffect(() => {
    setSupportsPasskey(window.isSecureContext && typeof PublicKeyCredential !== 'undefined');
    void authClient.getSession().then(({ data }) => {
      if (data?.session) router.replace('/inbox');
    }).catch(() => {});
  }, [router]);

  async function signInWithPasskey() {
    setBusy(true);
    setError('');
    try {
      const result = await authClient.signIn.passkey();
      if (result.error) throw new Error(result.error.message || 'Passkey sign-in was not completed.');
      router.replace('/inbox');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Passkey sign-in was not completed. You can use your email and password.');
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    let signInError = '';
    try {
      const { error: err, data } = await authClient.signIn.email({ email, password, rememberMe });
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
          <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>
        <label className="auth-field">
          Password
          <span style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button className="chip" type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '44px' }}>
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
          Remember me on this device
        </label>
        <p className="auth-alt">Stay signed in for up to 30 days. Use this on a device you trust.</p>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {supportsPasskey && <>
          <button className="chip" type="button" disabled={busy} onClick={() => void signInWithPasskey()} style={{ width: '100%', minHeight: '44px', marginTop: '12px' }}>
            Sign in with fingerprint or passkey
          </button>
          <p className="auth-alt">First sign in with your password and add a passkey in Settings → Easy sign-in. Your device may use fingerprint, face unlock, or its screen lock.</p>
        </>}
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
