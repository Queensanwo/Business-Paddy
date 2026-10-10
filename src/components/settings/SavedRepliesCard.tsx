'use client';

import { useEffect, useState } from 'react';

interface SavedReplyRow {
  id: string;
  title: string;
  body: string;
}

export function SavedRepliesCard({ canManage }: { canManage: boolean }) {
  const [replies, setReplies] = useState<SavedReplyRow[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/saved-replies')
      .then((res) => (res.ok ? res.json() : { replies: [] }))
      .then((json) => setReplies((json as { replies: SavedReplyRow[] }).replies ?? []))
      .catch(() => {});
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/saved-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const json = (await res.json()) as { reply?: SavedReplyRow; error?: string };
      if (!res.ok || !json.reply) throw new Error(json.error || 'Could not create.');
      setReplies((prev) => [...prev, json.reply as SavedReplyRow].sort((a, b) => a.title.localeCompare(b.title)));
      setTitle('');
      setBody('');
      setMsg('Saved reply created.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not create.');
    }
    setBusy(false);
  }

  async function onDelete(id: string) {
    setMsg('');
    try {
      const res = await fetch(`/api/saved-replies/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not delete.');
      setReplies((prev) => prev.filter((r) => r.id !== id));
      setMsg('Saved reply deleted.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not delete.');
    }
  }

  return (
    <article className="card received">
      <div className="label">Saved replies</div>
      <div className="conv-list" style={{ marginTop: '10px' }}>
        {replies.length === 0 ? <p className="assignee">No saved replies yet.</p> : null}
        {replies.map((r) => (
          <div key={r.id} className="conv" style={{ cursor: 'default' }}>
            <div className="conv-top">
              <strong>{r.title}</strong>
              {canManage ? (
                <button
                  type="button"
                  aria-label={`Delete ${r.title}`}
                  style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
                  onClick={() => onDelete(r.id)}
                >
                  ✕
                </button>
              ) : null}
            </div>
            <div className="preview" style={{ whiteSpace: 'normal' }}>{r.body}</div>
          </div>
        ))}
      </div>
      {canManage ? (
        <form onSubmit={onCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <label className="auth-field">
            Title
            <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Opening hours" />
          </label>
          <label className="auth-field">
            Reply text
            <textarea
              required
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Hello! We are open Monday to Saturday, 9am to 6pm."
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '64px' }}
            />
          </label>
          {msg ? <p className="assignee">{msg}</p> : null}
          <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Saving…' : 'Create saved reply'}
          </button>
        </form>
      ) : (
        <p className="assignee" style={{ marginTop: '8px' }}>Only owners and managers can add replies. Staff can insert them in any conversation.</p>
      )}
    </article>
  );
}
