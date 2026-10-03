'use client';

import { useEffect, useState } from 'react';

interface GuestMessage {
  who: string;
  role: 'customer' | 'staff';
  text: string;
}

interface GuestThread {
  businessName: string;
  guestName: string;
  status: string;
  messages: GuestMessage[];
}

export default function GuestReturnPage({ params }: { params: { token: string } }) {
  const [thread, setThread] = useState<GuestThread | null>(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/paddy-chat/thread/${params.token}`)
      .then(async (res) => {
        const json = (await res.json()) as GuestThread & { error?: string };
        if (!res.ok) throw new Error(json.error || 'Chat unavailable.');
        setThread(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Chat unavailable.'));
  }, [params.token]);

  async function onReply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/paddy-chat/thread/${params.token}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const json = (await res.json()) as GuestThread & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not send.');
      setThread(json);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.');
    }
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ width: 'min(560px, 100%)' }}>
        <div className="brand" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
          <div className="logo">BP</div>
          <div>
            <h1>{thread?.businessName ?? 'Business Paddy'}</h1>
            <p>{thread ? `Chatting as ${thread.guestName}` : 'Loading your chat…'}</p>
          </div>
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        {thread ? (
          <>
            <div className="messages" style={{ borderRadius: '12px', maxHeight: '320px' }}>
              {thread.messages.map((m, i) => (
                <div key={i} className={`bubble ${m.role === 'staff' ? 'staff' : 'customer'}`}>
                  <div className="who">{m.who}</div>
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={onReply} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
                required
                style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }}
              />
              <button className="send" type="submit" disabled={busy}>Send</button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
