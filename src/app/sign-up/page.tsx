'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function SignUpPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'DEMO' | 'LIVE'>('DEMO');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const wsRes = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: businessName, industry, mode }),
      });
      const ws = (await wsRes.json()) as { id?: string; error?: string };
      if (!wsRes.ok || !ws.id) throw new Error(ws.error || 'Workspace creation failed.');

      const { error: err } = await authClient.signUp.email({
        name: ownerName,
        email,
        password,
        workspaceId: ws.id,
        role: 'OWNER',
      } as Parameters<typeof authClient.signUp.email>[0]);
      if (err) {
        throw new Error(
          typeof (err as { message?: unknown }).message === 'string' &&
            (err as { message: string }).message
            ? (err as { message: string }).message
            : 'Owner account creation failed. If the email is new, the database may be waking up — wait a minute and try again.',
        );
      }
      router.push('/inbox');
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : 'Sign up failed. If the email is new, the database may be waking up — wait a minute and try again.',
      );
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
            <p>Create your business workspace</p>
          </div>
        </div>
        <label className="auth-field">
          Business name
          <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </label>
        <label className="auth-field">
          Industry (optional)
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </label>
        <label className="auth-field">
          Owner name
          <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} autoComplete="name" />
        </label>
        <label className="auth-field">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="auth-field">
          Password (8+ characters)
          <span style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button className="chip" type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>
        <div className="auth-field">
          <span>Mode</span>
          <div className="filters">
            <button type="button" className={`chip${mode === 'DEMO' ? ' active' : ''}`} onClick={() => setMode('DEMO')}>Demo</button>
            <button type="button" className={`chip${mode === 'LIVE' ? ' active' : ''}`} onClick={() => setMode('LIVE')}>Live</button>
          </div>
          {mode === 'LIVE' ? (
            <p className="assignee">Live mode needs email/phone verification (next step). You can start in Demo.</p>
          ) : null}
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Creating…' : 'Create workspace'}
        </button>
        <p className="auth-alt">
          Already registered? <Link href="/sign-in">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
