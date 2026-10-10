'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';

interface ReminderItem {
  id: string;
  title: string;
  conversationId: string | null;
  assignedToId: string | null;
  scheduledAt: string;
  timezone: string | null;
  frequency: string | null;
  status: string;
  assignedTo?: { id: string; name: string } | null;
  conversation?: { id: string; preview: string | null } | null;
}

interface StaffRow {
  id: string;
  name: string;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RemindersPage() {
  const { user } = useSessionUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [rows, setRows] = useState<ReminderItem[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(() => toLocalInput(new Date(Date.now() + 24 * 3600 * 1000)));
  const [assignId, setAssignId] = useState('');
  const [frequency, setFrequency] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [moveId, setMoveId] = useState<string | null>(null);
  const [moveWhen, setMoveWhen] = useState(() => toLocalInput(new Date(Date.now() + 24 * 3600 * 1000)));
  const canAssignOthers = user?.role === 'OWNER' || user?.role === 'MANAGER';

  function refresh() {
    fetch('/api/reminders')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/sign-in';
          throw new Error('Sign in required.');
        }
        if (!res.ok) throw new Error('Load failed.');
        return res.json();
      })
      .then((json) => setRows((json as { reminders: ReminderItem[] }).reminders ?? []))
      .catch(() => setRows([]));
  }

  useEffect(refresh, []);
  useEffect(() => {
    if (!canAssignOthers) return;
    fetch('/api/team')
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((json) => setStaff((json as { users: StaffRow[] }).users ?? []))
      .catch(() => {});
  }, [canAssignOthers]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          assignedToId: assignId || null,
          scheduledAt: new Date(when).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          frequency: frequency || null,
        }),
      });
      const json = (await res.json()) as { reminder?: ReminderItem; error?: string };
      if (!res.ok || !json.reminder) throw new Error(json.error || 'Could not create.');
      setTitle('');
      setMsg('Reminder created. Staff only — never sent to customers.');
      refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not create.');
    }
    setBusy(false);
  }

  async function act(id: string, action: 'complete' | 'cancel') {
    setMsg('');
    try {
      const res = await fetch(`/api/reminders/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Action failed.');
      setMsg(action === 'complete' ? 'Reminder completed.' : 'Reminder cancelled.');
      refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Action failed.');
    }
  }

  async function move(id: string, action: 'snooze' | 'reschedule') {
    setMsg('');
    try {
      const res = await fetch(`/api/reminders/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: new Date(moveWhen).toISOString() }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Action failed.');
      setMoveId(null);
      setMsg(action === 'snooze' ? 'Reminder snoozed.' : 'Reminder rescheduled.');
      refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Action failed.');
    }
  }

  const now = Date.now();
  const open = rows.filter((r) => r.status === 'SCHEDULED' || r.status === 'SNOOZED');
  const overdue = open.filter((r) => new Date(r.scheduledAt).getTime() <= now);
  const upcoming = open.filter((r) => new Date(r.scheduledAt).getTime() > now);
  const done = rows.filter((r) => r.status !== 'SCHEDULED' && r.status !== 'SNOOZED');

  function card(r: ReminderItem) {
    return (
      <div key={r.id} className="conv" style={{ cursor: 'default' }}>
        <div className="conv-top">
          <strong>{r.title}</strong>
          <span className="status">{r.status === 'SCHEDULED' ? 'Scheduled' : r.status === 'SNOOZED' ? 'Snoozed' : r.status === 'COMPLETED' ? 'Done' : 'Cancelled'}</span>
        </div>
        <div className="preview" style={{ whiteSpace: 'normal' }}>
          {fmt(r.scheduledAt)}{r.timezone ? ` (${r.timezone})` : ''} · {r.assignedTo ? r.assignedTo.name : 'Unassigned'}
          {r.frequency ? ` · repeats ${r.frequency}` : ''}
          {r.conversation ? ` · linked conversation` : ''}
        </div>
        {r.conversation ? (
          <div style={{ marginTop: '4px' }}>
            <a className="chip" href={`/inbox`}>Open inbox</a>
          </div>
        ) : null}
        {(r.status === 'SCHEDULED' || r.status === 'SNOOZED') ? (
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
            <button className="chip" type="button" onClick={() => act(r.id, 'complete')}>Complete</button>
            <button className="chip" type="button" onClick={() => { setMoveId(r.id); setMoveWhen(toLocalInput(new Date(Date.now() + 24 * 3600 * 1000))); }}>Snooze / reschedule</button>
            <button className="chip" type="button" onClick={() => act(r.id, 'cancel')}>Cancel</button>
          </div>
        ) : null}
        {moveId === r.id ? (
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              aria-label="New date and time"
              type="datetime-local"
              value={moveWhen}
              onChange={(e) => setMoveWhen(e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '8px 10px', background: 'var(--off-white)', color: 'var(--ink)' }}
            />
            <button className="chip" type="button" onClick={() => move(r.id, 'snooze')}>Snooze</button>
            <button className="chip" type="button" onClick={() => move(r.id, 'reschedule')}>Reschedule</button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="app app-single" id="app">
      <Navigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        active="reminders"
        reminderCount={overdue.length}
        userName={user?.name ?? 'Business Paddy'}
        userSub={user ? `${roleLabel(user.role)} · ${user.workspaceName}` : 'Staff reminders'}
      />
      <section className="main">
        <header className="topbar">
          <button className="menu-btn" type="button" onClick={() => setIsMobileMenuOpen(true)}>Menu</button>
          <div>
            <strong>Reminders</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Staff only — never sent to customers</div>
          </div>
          <a className="chip" href="/inbox">Back to Inbox</a>
        </header>
        <div className="metrics metrics-single">
          <article className="card received">
            <div className="label">New reminder</div>
            <form onSubmit={onCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <label className="auth-field">
                Title
                <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call back about delivery" />
              </label>
              <label className="auth-field">
                Date and time
                <input type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} />
              </label>
              {canAssignOthers ? (
                <label className="auth-field">
                  Assign to
                  <select value={assignId} onChange={(e) => setAssignId(e.target.value)}>
                    <option value="">Me</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="auth-field">
                Repeats
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  <option value="">Does not repeat</option>
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              {msg ? <p className="assignee">{msg}</p> : null}
              <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
                {busy ? 'Saving…' : 'Create reminder'}
              </button>
            </form>
          </article>
          <article className="card received">
            <div className="label">Overdue ({overdue.length})</div>
            <div className="conv-list" style={{ marginTop: '10px' }}>
              {overdue.length === 0 ? <p className="assignee">Nothing overdue.</p> : overdue.map(card)}
            </div>
          </article>
          <article className="card received">
            <div className="label">Upcoming ({upcoming.length})</div>
            <div className="conv-list" style={{ marginTop: '10px' }}>
              {upcoming.length === 0 ? <p className="assignee">Nothing scheduled.</p> : upcoming.map(card)}
            </div>
          </article>
          <article className="card received">
            <div className="label">Done &amp; cancelled ({done.length})</div>
            <div className="conv-list" style={{ marginTop: '10px' }}>
              {done.length === 0 ? <p className="assignee">No history yet.</p> : done.map(card)}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
