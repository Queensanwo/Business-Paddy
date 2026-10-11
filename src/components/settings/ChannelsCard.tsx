'use client';

import { useEffect, useState } from 'react';

interface Mailbox {
  id: string;
  emailAddress: string;
}

const COMING = ['Instagram', 'TikTok', 'Facebook'];
const BUILT_IN = ['Website', 'Paddy Chat'];

export function ChannelsCard({ canManage }: { canManage: boolean }) {
  const [configured, setConfigured] = useState(false);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  function refresh() {
    fetch('/api/channels/google')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json as { configured?: boolean; accounts?: Mailbox[] } | null;
        if (!data) return;
        setConfigured(data.configured === true);
        setMailboxes(data.accounts ?? []);
      })
      .catch(() => {});
  }

  useEffect(refresh, []);

  async function connect() {
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/channels/google', { method: 'POST' });
      const json = (await res.json()) as { authorizationUrl?: string; error?: string };
      if (!res.ok || !json.authorizationUrl) throw new Error(json.error || 'Could not start.');
      window.location.href = json.authorizationUrl;
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not start.');
      setBusy(false);
    }
  }

  async function disconnect(id: string) {
    setMsg('');
    try {
      const res = await fetch(`/api/channels/google?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not disconnect.');
      setMsg('Mailbox disconnected. History stays.');
      refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not disconnect.');
    }
  }

  async function checkMail() {
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/channels/google/poll', { method: 'POST' });
      const json = (await res.json()) as { stored?: number; duplicates?: number; note?: string; error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not check mail.');
      setMsg(json.note ?? `Found ${json.stored ?? 0} new emails.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not check mail.');
    }
    setBusy(false);
  }

  return (
    <article className="card received">
      <div className="label">Channel connections</div>
      <div className="conv-list" style={{ marginTop: '10px' }}>
        <div className="conv" style={{ cursor: 'default' }}>
          <div className="conv-top">
            <strong>Email (Google)</strong>
            <span className="status">{mailboxes.length > 0 ? `${mailboxes.length} connected` : configured ? 'Not connected' : 'Needs setup'}</span>
          </div>
          <div className="preview" style={{ whiteSpace: 'normal' }}>
            {mailboxes.length > 0
              ? mailboxes.map((m) => m.emailAddress).join(', ')
              : 'Connect a Gmail mailbox. Replies send through Gmail; new mail is checked into the inbox.'}
          </div>
          {mailboxes.map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="assignee">{m.emailAddress}</span>
              {canManage ? (
                <button className="chip" type="button" onClick={() => disconnect(m.id)}>Disconnect</button>
              ) : null}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {canManage && mailboxes.length === 0 ? (
              <button className="send" type="button" disabled={busy || !configured} style={{ flex: 1 }} onClick={connect} title={configured ? 'Connect with Google' : 'This integration is not available yet — server keys missing'}>
                {busy ? 'Opening Google…' : 'Connect with Google'}
              </button>
            ) : null}
            {mailboxes.length > 0 ? (
              <button className="chip" type="button" disabled={busy} onClick={checkMail}>Check mail now</button>
            ) : null}
          </div>
          {!configured ? <p className="assignee" style={{ marginTop: '6px' }}>Server keys missing — ask the person running the server to add them, then this button switches on.</p> : null}
          {!canManage ? <p className="assignee" style={{ marginTop: '6px' }}>Only owners and managers can connect mailboxes.</p> : null}
        </div>
        {BUILT_IN.map((ch) => (
          <div key={ch} className="conv" style={{ cursor: 'default' }}>
            <div className="conv-top">
              <strong>{ch}</strong>
              <span className="status">Built in</span>
            </div>
            <div className="preview">Works out of the box — no connection needed.</div>
          </div>
        ))}
        {COMING.map((ch) => (
          <div key={ch} className="conv" style={{ cursor: 'default' }}>
            <div className="conv-top">
              <strong>{ch}</strong>
              <span className="status">In progress</span>
            </div>
            <div className="preview">This integration is not available yet.</div>
            <div style={{ marginTop: '6px' }}>
              <button className="chip" type="button" disabled title="This integration is not available yet">Connect</button>
            </div>
          </div>
        ))}
      </div>
      {msg ? <p className="assignee" style={{ marginTop: '8px' }}>{msg}</p> : null}
    </article>
  );
}
