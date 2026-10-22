'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useSessionUser } from '@/hooks/useSessionUser';
import styles from './page.module.css';

interface Snapshot {
  updatedAt: string; page: number; pageSize: number; total: number;
  overview: { conversations: number; open: number; attention: number; escalated: number; awaitingApproval: number; unassigned: number; helpful: number; notHelpful: number; rated: number; satisfaction: number | null };
  team: { id: string; name: string; open: number }[];
  conversations: { id: string; channel: string; status: string; updatedAt: string; customer: string; assignee: string; rating: string | null; feedbackComment: string | null;
    excerpts: { kind: string; sender: string; text: string; at: string; automatic: boolean }[] }[];
}
const statusNames: Record<string, string> = { NEW: 'New', IN_PROGRESS: 'In progress', WAITING_FOR_CUSTOMER: 'Waiting for customer', FOLLOW_UP: 'Follow-up needed', NEEDS_APPROVAL: 'Needs approval', ESCALATED: 'Escalated', RESOLVED: 'Resolved' };
function date(value: string) { return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }

export default function OwnerPage() {
  const { user } = useSessionUser();
  const [menu, setMenu] = useState(false);
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    let pending = false;
    let controller: AbortController | null = null;
    setData(null);
    async function load() {
      if (pending) return;
      pending = true;
      controller = new AbortController();
      setBusy(true);
      try {
        const response = await fetch(`/api/owner/overview?page=${page}&filter=${filter}`, { cache: 'no-store', signal: controller.signal });
        if (!active) return;
        if (response.status === 401) { setData(null); window.location.href = '/sign-in'; return; }
        if (response.status === 403) { setData(null); throw new Error('This overview is only available to the business owner.'); }
        if (!response.ok) throw new Error('Could not refresh your overview. Please try again.');
        const result: Snapshot = await response.json();
        if (active) { setData(result); setError(''); }
      } catch (e) {
        if (active && !(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : 'Could not load your overview.');
      } finally { pending = false; if (active) setBusy(false); }
    }
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => { active = false; controller?.abort(); window.clearInterval(timer); };
  }, [page, filter, refresh]);

  const metrics = data?.overview;
  return <div className="app app-single" id="app">
    <Navigation isOpen={menu} onClose={() => setMenu(false)} active="owner" userName={user?.name} userSub={user?.workspaceName ?? 'Owner overview'} />
    <section className="main">
      <header className="topbar">
        <button className="menu-btn" onClick={() => setMenu(true)}>Menu</button>
        <strong>Owner overview</strong>
        <a className="chip" href="/inbox">Open inbox</a>
      </header>
      <main className={styles.content}>
        <div className={styles.heading}><div><p className={styles.eyebrow}>{user?.workspaceName ?? 'Your business'} · Private owner view</p><h1>Stay close to your customers. Wherever you are.</h1><p>See what needs attention and check how conversations are being handled.</p></div>
          <button className="chip" disabled={busy} onClick={() => setRefresh((v) => v + 1)}>{busy ? 'Refreshing…' : 'Refresh overview'}</button></div>
        {user?.workspaceMode === 'DEMO' && <p className={styles.notice}>Demo workspace: these figures are sample data, not live customer results.</p>}
        {error && <div className={styles.notice} role="alert">{error} {data && 'The figures below are from the last successful update.'}<button className="chip" disabled={busy} onClick={() => setRefresh((v) => v + 1)}>Try again</button></div>}
        {!data && busy && <p role="status">Loading your business overview…</p>}
        {data && metrics && <>
          <p className={styles.freshness}>Updated {date(data.updatedAt)} · Refreshes every 30 seconds while this page is visible · All-time workspace figures</p>
          <section className={styles.metrics} aria-label="Business at a glance">
            <article><p>Open conversations</p><strong>{metrics.open}</strong><small>Out of {metrics.conversations} total conversations</small></article>
            <article><p>Need attention</p><strong>{metrics.attention}</strong><small>New, follow-up, approval or escalated</small></article>
            <article><p>Unassigned open chats</p><strong>{metrics.unassigned}</strong><small>No team member currently assigned</small></article>
            <article><p>Customer ratings</p><strong>{metrics.satisfaction === null ? 'No ratings yet' : `${metrics.satisfaction}% helpful`}</strong><small>{metrics.rated} submitted ratings · {metrics.helpful} helpful · {metrics.notHelpful} not helpful</small></article>
          </section>
          <section className={styles.panel} aria-label="Business summary"><h2>Your quick update</h2><p>You have {metrics.open} open conversations. {metrics.escalated} are escalated and {metrics.awaitingApproval} need reply approval.</p><p>Ratings reflect customer feedback already submitted through Paddy Chat. They are not automatic scores or ratings from every channel.</p></section>
          <section className={styles.panel}><h2>Your team’s current workload</h2><p>Open chats currently assigned to each person. Assignment does not prove who sent every reply.</p><div className={styles.team}>{data.team.map((person) => <div key={person.id}><strong>{person.name}</strong><span>{person.open} open</span></div>)}</div></section>
          <section className={styles.conversations}>
            <div className={styles.heading}><div><h2>Conversation briefings</h2><p>Status, responsibility and recent message excerpts. Open the full chat for context.</p></div><label>Show <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}><option value="all">All conversations</option><option value="attention">Need attention</option><option value="feedback">Customer ratings</option></select></label></div>
            {data.conversations.length === 0 && <div className={styles.panel}><h3>No conversations here yet</h3><p>{filter === 'all' ? 'Conversations will appear when customers contact your connected channels.' : 'There are no conversations matching this view.'}</p></div>}
            {data.conversations.map((c) => <article className={styles.panel} key={c.id}>
              <div className={styles.heading}><div><h3>{c.customer}</h3><p>{c.channel.replace(/_/g, ' ')} · Assigned to: {c.assignee}</p></div><span className={styles.status}>{statusNames[c.status] ?? c.status}</span></div>
              <p className={styles.freshness}>Last activity: {date(c.updatedAt)}</p>
              <div className={styles.excerpts}>{c.excerpts.length ? c.excerpts.map((m, i) => <div key={`${m.at}-${i}`}><strong>{m.kind === 'CUSTOMER' ? 'Customer' : m.automatic ? 'Automatic greeting' : `Reply from ${m.sender}`}</strong><p>{m.text || '(Attachment or empty message — open the conversation to view.)'}</p></div>) : <p>No customer messages or replies yet.</p>}</div>
              {c.rating && <div className={styles.feedback}><strong>Customer feedback: {c.rating === 'HELPFUL' ? 'Helpful' : 'Not helpful'}</strong>{c.feedbackComment && <p>“{c.feedbackComment}”</p>}</div>}
              <a className={styles.link} href={`/inbox?conversationId=${encodeURIComponent(c.id)}`}>Open full conversation →</a>
            </article>)}
            <div className={styles.pagination}><button className="chip" disabled={busy || page === 1} onClick={() => setPage((v) => v - 1)}>Previous</button><span>Page {page} · {data.total} conversations</span><button className="chip" disabled={busy || page * data.pageSize >= data.total} onClick={() => setPage((v) => v + 1)}>Next</button></div>
          </section>
        </>}
      </main>
    </section>
  </div>;
}
