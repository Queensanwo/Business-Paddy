'use client';

import { useEffect, useState } from 'react';

interface TeamUser {
  id: string;
  name: string;
  role: string;
}

interface PendingTransfer {
  id: string;
  recipientEmail: string;
  expiresAt: string;
}

export function OwnershipCard({ isOwner }: { isOwner: boolean }) {
  const [pending, setPending] = useState<PendingTransfer | null>(null);
  const [staff, setStaff] = useState<(TeamUser & { email: string })[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [link, setLink] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  function refresh() {
    fetch('/api/ownership/transfer')
      .then((res) => (res.ok ? res.json() : { pending: null }))
      .then((json) => setPending((json as { pending: PendingTransfer | null }).pending))
      .catch(() => {});
  }

  useEffect(refresh, []);
  useEffect(() => {
    if (!isOwner) return;
    fetch('/api/team')
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((json) => setStaff((json as { users: (TeamUser & { email: string })[] }).users ?? []))
      .catch(() => {});
  }, [isOwner]);

  async function onStart(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setLink('');
    setBusy(true);
    try {
      const res = await fetch('/api/ownership/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: email, password }),
      });
      const json = (await res.json()) as { id?: string; acceptUrl?: string; emailed?: boolean; note?: string; error?: string };
      if (!res.ok || !json.acceptUrl) throw new Error(json.error || 'Could not start.');
      setLink(json.acceptUrl);
      setPassword('');
      setMsg(json.note ?? 'Handover started.');
      refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not start.');
    }
    setBusy(false);
  }

  async function onCancel(id: string) {
    setMsg('');
    try {
      const res = await fetch(`/api/ownership/transfer/${id}/cancel`, { method: 'POST' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not cancel.');
      setMsg('Handover cancelled. Nothing changed.');
      refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not cancel.');
    }
  }

  return (
    <article className="card received">
      <div className="label">Ownership handover</div>
      {!isOwner ? (
        <p className="assignee" style={{ marginTop: '8px' }}>Only the workspace owner can hand over ownership.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          {pending ? (
            <div>
              <p className="assignee">Waiting on <strong>{pending.recipientEmail}</strong> (expires {new Date(pending.expiresAt).toLocaleString()}). Nothing has changed yet.</p>
              <button className="chip" type="button" style={{ marginTop: '6px' }} onClick={() => onCancel(pending.id)}>Cancel handover</button>
            </div>
          ) : (
            <form onSubmit={onStart} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="auth-field">
                Hand over to (must already be staff here)
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="successor@example.com"
                  list="handover-staff"
                />
                <datalist id="handover-staff">
                  {staff.filter((s) => s.role !== 'OWNER').map((s) => (
                    <option key={s.id} value={s.email}>{s.name}</option>
                  ))}
                </datalist>
              </label>
              <label className="auth-field">
                Confirm with your password
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </label>
              <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
                {busy ? 'Starting…' : 'Start handover'}
              </button>
              <p className="assignee">You become a manager when they accept. Connected accounts do not move — the new owner reconnects them.</p>
            </form>
          )}
          {link ? <p className="auth-alt">Forward this single-use link: <a href={link}>{link}</a></p> : null}
          {msg ? <p className="assignee">{msg}</p> : null}
        </div>
      )}
    </article>
  );
}
