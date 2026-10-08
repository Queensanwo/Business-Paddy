'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface InviteResult {
  invitation: { id: string; email: string };
}

export default function TeamPage() {
  const { user } = useSessionUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('AGENT');
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/team')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/sign-in';
          throw new Error('Sign in required.');
        }
        if (res.status === 403) {
          setLoadState('denied');
          return null;
        }
        if (!res.ok) throw new Error('Team request failed.');
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setStaff((data as { users: StaffUser[] }).users);
        setLoadState('ready');
      })
      .catch(() => {
        setLoadState((prev) => (prev === 'denied' ? prev : 'error'));
      });
  }, []);

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setInviteResult(null);
    setBusy(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      });
      const data = (await res.json()) as InviteResult & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Invitation failed.');
      setInviteResult(data);
      setName('');
      setEmail('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Invitation failed.');
    }
    setBusy(false);
  }

  return (
    <div className="app app-single" id="app">
      <Navigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        active="team"
        userName={user?.name ?? 'Business Paddy'}
        userSub={user ? `${roleLabel(user.role)} · ${user.workspaceName}` : 'Shared inbox'}
      />
      <section className="main">
        <header className="topbar">
          <button className="menu-btn" id="menuBtn" type="button" onClick={() => setIsMobileMenuOpen(true)}>Menu</button>
          <div>
            <strong>Team</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Staff, roles and invitations</div>
          </div>
        </header>
        <div className="metrics metrics-single">
          <article className="card received">
            <div className="label">Signed in</div>
            <div className="value" style={{ fontSize: '1.2rem' }}>{user?.name ?? 'Loading…'}</div>
            <p className="assignee" style={{ marginTop: '8px' }}>
              {user ? `${user.email} — ${roleLabel(user.role)} of ${user.workspaceName}` : 'Loading workspace…'}
            </p>
          </article>

          {loadState === 'denied' ? (
            <article className="card received">
              <div className="label">Restricted</div>
              <div className="value" style={{ fontSize: '1.1rem' }}>Owners and managers only</div>
              <p className="assignee" style={{ marginTop: '8px' }}>Your role cannot view or invite staff.</p>
            </article>
          ) : null}

          {loadState === 'ready' ? (
            <article className="card received">
              <div className="label">Invite staff</div>
              <form onSubmit={onInvite} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <label className="auth-field">
                  Staff name
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adaeze Nwosu" />
                </label>
                <label className="auth-field">
                  Staff email
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@business.com" />
                </label>
                <label className="auth-field">
                  Role
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)' }}
                  >
                    <option value="AGENT">Agent</option>
                    <option value="MANAGER">Manager</option>
                    <option value="TRAINEE">Trainee</option>
                  </select>
                </label>
                {formError ? <p className="auth-error">{formError}</p> : null}
                <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
                  {busy ? 'Sending…' : 'Send Invitation'}
                </button>
              </form>
              {inviteResult ? (
                <p className="assignee" style={{ marginTop: '10px' }}>
                  Invitation email sent to <strong>{inviteResult.invitation.email}</strong>. They
                  have 48 hours to accept through the secure link and set their own password.
                  No password was emailed.
                </p>
              ) : null}
            </article>
          ) : null}

          {loadState === 'ready' ? (
            <article className="card received">
              <div className="label">Staff ({staff.length})</div>
              <div className="conv-list" style={{ marginTop: '10px' }}>
                {staff.map((s) => (
                  <div key={s.id} className="conv" style={{ cursor: 'default' }}>
                    <div className="conv-top">
                      <strong>{s.name}</strong>
                      <span className="status">{roleLabel(s.role)}</span>
                    </div>
                    <div className="preview">{s.email}</div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {loadState === 'loading' ? (
            <article className="card received">
              <div className="label">Team</div>
              <div className="value" style={{ fontSize: '1.1rem' }}>Loading…</div>
            </article>
          ) : null}

          {loadState === 'error' ? (
            <article className="card received">
              <div className="label">Team unavailable</div>
              <div className="value" style={{ fontSize: '1.1rem' }}>Could not load the team.</div>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
