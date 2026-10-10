'use client';

import { useEffect, useState } from 'react';

interface ApprovalRow {
  id: string;
  conversationId: string;
  text: string;
  status: string;
}

export function ApprovalsCard({ canReview }: { canReview: boolean }) {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [msg, setMsg] = useState('');

  function refresh() {
    fetch('/api/approvals')
      .then((res) => (res.ok ? res.json() : { approvals: [] }))
      .then((json) => setRows((json as { approvals: ApprovalRow[] }).approvals ?? []))
      .catch(() => {});
  }

  useEffect(refresh, []);

  async function decide(id: string, decision: 'approve' | 'reject') {
    setMsg('');
    try {
      const res = await fetch(`/api/approvals/${id}/${decision}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Decision failed.');
      setRows((prev) => prev.filter((r) => r.id !== id));
      setMsg(decision === 'approve' ? 'Approved and sent.' : 'Rejected.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Decision failed.');
    }
  }

  return (
    <article className="card received">
      <div className="label">Approvals queue</div>
      <div className="conv-list" style={{ marginTop: '10px' }}>
        {rows.length === 0 ? <p className="assignee">No pending approvals.</p> : null}
        {rows.map((r) => (
          <div key={r.id} className="conv" style={{ cursor: 'default' }}>
            <div className="preview" style={{ whiteSpace: 'normal' }}>{r.text}</div>
            {canReview ? (
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button className="chip" type="button" onClick={() => decide(r.id, 'approve')}>Approve &amp; send</button>
                <button className="chip" type="button" onClick={() => decide(r.id, 'reject')}>Reject</button>
              </div>
            ) : (
              <p className="assignee">Waiting for owner/manager review.</p>
            )}
          </div>
        ))}
      </div>
      {msg ? <p className="assignee">{msg}</p> : null}
    </article>
  );
}
