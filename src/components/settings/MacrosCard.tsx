'use client';

import { useEffect, useState } from 'react';

interface TeamUser {
  id: string;
  name: string;
  role: string;
}

interface MacroRow {
  id: string;
  title: string;
  body: string;
  assignUserId: string | null;
  status: string | null;
  escalateToId: string | null;
  escalateReason: string | null;
  createdById: string | null;
}

const MACRO_STATUSES = ['', 'NEW', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'FOLLOW_UP', 'NEEDS_APPROVAL', 'ESCALATED', 'RESOLVED'];
const MACRO_STATUS_LABELS: Record<string, string> = {
  '': 'No status change',
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  WAITING_FOR_CUSTOMER: 'Waiting for customer',
  FOLLOW_UP: 'Follow up',
  NEEDS_APPROVAL: 'Needs approval',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
};

export function MacrosCard({ canManage, currentUserId }: { canManage: boolean; currentUserId: string | null }) {
  const canDelete = (m: MacroRow) => canManage || (currentUserId !== null && m.createdById === currentUserId);
  const [macros, setMacros] = useState<MacroRow[]>([]);
  const [staff, setStaff] = useState<TeamUser[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [status, setStatus] = useState('');
  const [escalateToId, setEscalateToId] = useState('');
  const [escalateReason, setEscalateReason] = useState('Complaint');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/macros')
      .then((res) => (res.ok ? res.json() : { macros: [] }))
      .then((json) => setMacros((json as { macros: MacroRow[] }).macros ?? []))
      .catch(() => {});
    if (canManage) {
      fetch('/api/team')
        .then((res) => (res.ok ? res.json() : { users: [] }))
        .then((json) => setStaff((json as { users: TeamUser[] }).users ?? []))
        .catch(() => {});
    }
  }, [canManage]);

  function describe(m: MacroRow): string {
    const parts: string[] = [];
    if (m.body) parts.push('inserts text');
    const assignee = staff.find((s) => s.id === m.assignUserId);
    if (m.assignUserId) parts.push(`assigns to ${assignee ? assignee.name : 'staff'}`);
    if (m.status) parts.push(`sets ${MACRO_STATUS_LABELS[m.status] ?? m.status}`);
    if (m.escalateToId) parts.push('escalates');
    return parts.length > 0 ? parts.join(' · ') : 'No actions';
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          assignUserId: assignUserId || null,
          status: status || null,
          escalateToId: escalateToId || null,
          escalateReason: escalateToId ? escalateReason : null,
        }),
      });
      const json = (await res.json()) as { macro?: MacroRow; error?: string };
      if (!res.ok || !json.macro) throw new Error(json.error || 'Could not create.');
      setMacros((prev) => [...prev, json.macro as MacroRow].sort((a, b) => a.title.localeCompare(b.title)));
      setTitle('');
      setBody('');
      setAssignUserId('');
      setStatus('');
      setEscalateToId('');
      setMsg('Macro created.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not create.');
    }
    setBusy(false);
  }

  async function onDelete(id: string) {
    setMsg('');
    try {
      const res = await fetch(`/api/macros/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not delete.');
      setMacros((prev) => prev.filter((m) => m.id !== id));
      setMsg('Macro deleted.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not delete.');
    }
  }

  return (
    <article className="card received">
      <div className="label">Macros</div>
      <div className="conv-list" style={{ marginTop: '10px' }}>
        {macros.length === 0 ? <p className="assignee">No macros yet.</p> : null}
        {macros.map((m) => (
          <div key={m.id} className="conv" style={{ cursor: 'default' }}>
            <div className="conv-top">
              <strong>{m.title}</strong>
              {canDelete(m) ? (
                <button
                  type="button"
                  aria-label={`Delete ${m.title}`}
                  style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
                  onClick={() => onDelete(m.id)}
                >
                  ✕
                </button>
              ) : null}
            </div>
            <div className="preview" style={{ whiteSpace: 'normal' }}>{describe(m)}</div>
          </div>
        ))}
      </div>
      {
        <form onSubmit={onCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <label className="auth-field">
            Title
            <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Refund + escalate" />
          </label>
          <label className="auth-field">
            Text to insert (optional)
            <textarea
              value={body}
              maxLength={2000}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Text added to the reply box for editing before sending."
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '64px' }}
            />
          </label>
          <label className="auth-field">
            Assign to (optional)
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)' }}
            >
              <option value="">No change</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="auth-field">
            Set status (optional)
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)' }}
            >
              {MACRO_STATUSES.map((s) => (
                <option key={s} value={s}>{MACRO_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <label className="auth-field">
            Escalate to (optional)
            <select
              value={escalateToId}
              onChange={(e) => setEscalateToId(e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)' }}
            >
              <option value="">No escalation</option>
              {staff
                .filter((s) => s.role === 'OWNER' || s.role === 'MANAGER')
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
          </label>
          {msg ? <p className="assignee">{msg}</p> : null}
          <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Saving…' : 'Create macro'}
          </button>
          <p className="assignee">Everyone on the team can create macros. Owners and managers can delete any macro; others can delete only their own.</p>
        </form>
      }
    </article>
  );
}
