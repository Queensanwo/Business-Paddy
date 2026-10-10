'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';

interface BusinessMetrics {
  received: number;
  answered: number;
  unanswered: number;
  autoAcknowledgedOnly: number;
  responseRate: number | null;
  avgFirstReplyMinutes: number | null;
  resolved: number;
  overdue: number;
  csat: number | null;
  rated: number;
  escalations: number;
  escalationsByReason: Record<string, number>;
}

interface StaffRow {
  id: string;
  name: string;
  handled: number;
  resolved: number;
  overdue: number;
  escalations: number;
  avgReplyMin: number | null;
  csat: number | null;
}

interface TeamUser {
  id: string;
  name: string;
  role: string;
}

function fmtPct(v: number | null): string {
  return v === null ? '—' : `${v}%`;
}

function fmtMins(v: number | null): string {
  if (v === null) return '—';
  if (v < 60) return `${v} min`;
  const h = Math.floor(v / 60);
  return `${h} hr${h > 1 ? 's' : ''} ${v % 60 ? `${v % 60} min` : ''}`.trim();
}

export default function ReportsPage() {
  const { user } = useSessionUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [biz, setBiz] = useState<BusinessMetrics | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [filter, setFilter] = useState('');
  const [defs, setDefs] = useState('');
  const isManager = user?.role === 'OWNER' || user?.role === 'MANAGER';

  useEffect(() => {
    const q = filter ? `?assigneeId=${encodeURIComponent(filter)}` : '';
    fetch(`/api/reports/summary${q}`)
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/sign-in';
          throw new Error('Sign in required.');
        }
        if (!res.ok) throw new Error('Report failed.');
        return res.json();
      })
      .then((json) => {
        setBiz((json as { business: BusinessMetrics }).business);
        setStaff((json as { staff: StaffRow[] }).staff ?? []);
        setUsers((json as { users: TeamUser[] }).users ?? []);
        setDefs((json as { definitions: string }).definitions ?? '');
      })
      .catch(() => setBiz(null));
  }, [filter]);

  function card(label: string, value: string, sub: string) {
    return (
      <article className="card received" key={label}>
        <div className="label">{label}</div>
        <div className="value" style={{ fontSize: '1.5rem' }}>{value}</div>
        <p className="assignee" style={{ marginTop: '4px' }}>{sub}</p>
      </article>
    );
  }

  return (
    <div className="app app-single" id="app">
      <Navigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        active="reports"
        userName={user?.name ?? 'Business Paddy'}
        userSub={user ? `${roleLabel(user.role)} · ${user.workspaceName}` : 'Reports'}
      />
      <section className="main">
        <header className="topbar">
          <button className="menu-btn" type="button" onClick={() => setIsMobileMenuOpen(true)}>Menu</button>
          <div>
            <strong>How is the business doing?</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Received, answered, speed, resolved, happy customers</div>
          </div>
          <a className="chip" href="/inbox">Back to Inbox</a>
        </header>
        {!biz ? (
          <p className="assignee" style={{ padding: '20px' }}>Loading report…</p>
        ) : (
          <div className="metrics metrics-single">
            {isManager && users.length > 0 ? (
              <article className="card received">
                <div className="label">Look at one person</div>
                <select
                  aria-label="Filter by staff member"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', marginTop: '8px', width: '100%' }}
                >
                  <option value="">Everyone</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </article>
            ) : null}
            {card('Conversations received', String(biz.received), 'Every customer chat in this business')}
            {card('Answered', String(biz.answered), `Unanswered: ${biz.unanswered}${biz.autoAcknowledgedOnly ? ` (${biz.autoAcknowledgedOnly} got only an automatic greeting)` : ''}`)}
            {card('Response rate', fmtPct(biz.responseRate), 'Share of chats with a human reply')}
            {card('Average first reply', fmtMins(biz.avgFirstReplyMinutes), 'How fast customers hear from a person')}
            {card('Resolved', String(biz.resolved), `Still needing action: ${biz.overdue} overdue`)}
            {card('Customer happiness', fmtPct(biz.csat), biz.rated === 0 ? 'No ratings yet' : `From ${biz.rated} rating${biz.rated === 1 ? '' : 's'}`)}
            {card('Escalations', String(biz.escalations), Object.keys(biz.escalationsByReason).length === 0 ? 'None needed a manager' : Object.entries(biz.escalationsByReason).map(([r, n]) => `${r}: ${n}`).join(' · '))}
            {isManager && staff.length > 0 ? (
              <article className="card received">
                <div className="label">Per person</div>
                <div className="conv-list" style={{ marginTop: '10px' }}>
                  {staff.map((s) => (
                    <div key={s.id} className="conv" style={{ cursor: 'default' }}>
                      <div className="conv-top"><strong>{s.name}</strong><span className="status">{s.handled} handled</span></div>
                      <div className="preview" style={{ whiteSpace: 'normal' }}>
                        Resolved {s.resolved} · Avg reply {fmtMins(s.avgReplyMin)} · Overdue {s.overdue} · Escalations {s.escalations} · Happiness {fmtPct(s.csat)}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
            {defs ? <p className="assignee">{defs}</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}
