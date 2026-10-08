'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function GuestStartPage({ params }: { params: { workspaceId: string } }) {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [returnLink, setReturnLink] = useState('');
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/paddy-chat/business/${params.workspaceId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = (await res.json()) as { name: string };
        setBusinessName(json.name);
      })
      .catch(() => setMissing(true));
  }, [params.workspaceId]);

  async function onStart(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/paddy-chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: params.workspaceId, name, text }),
      });
      const json = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !json.token) throw new Error(json.error || 'Could not start the chat.');
      setReturnLink(`/chat/return/${json.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the chat.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
          <div className="logo">BP</div>
          <div>
            <h1>{businessName || 'Business Paddy'}</h1>
            <p>Chat with us — no account needed</p>
          </div>
        </div>
        {missing ? (
          <p className="auth-error">This chat link is not valid. Please ask the business for a fresh link.</p>
        ) : returnLink ? (
          <>
            <p className="assignee">
              Thanks {name}! Your message is with the business. Save this private link to
              continue the conversation later:
            </p>
            <p className="auth-alt">
              <Link href={returnLink}>{returnLink}</Link>
            </p>
          </>
        ) : (
          <form onSubmit={onStart} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="auth-field">
              Your name
              <input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adaeze" />
            </label>
            <label className="auth-field">
              Your message
              <textarea
                required
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How can we help?"
                style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '90px' }}
              />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Sending…' : 'Start chat'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
