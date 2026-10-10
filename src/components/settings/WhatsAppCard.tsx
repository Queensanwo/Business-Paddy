'use client';

import { useEffect, useState } from 'react';

interface WhatsAppStatus {
  configured: boolean;
  linked: boolean;
  maskedNumber: string | null;
}

export function WhatsAppCard({ canManage }: { canManage: boolean }) {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  function refresh() {
    fetch('/api/channels/whatsapp')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setStatus(json as WhatsAppStatus);
      })
      .catch(() => {});
  }

  useEffect(refresh, []);

  async function connect() {
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/channels/whatsapp', { method: 'POST' });
      const json = (await res.json()) as WhatsAppStatus & { note?: string; error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not connect.');
      setStatus(json);
      setMsg(json.note ?? 'Connected.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not connect.');
    }
    setBusy(false);
  }

  async function disconnect() {
    setMsg('');
    try {
      const res = await fetch('/api/channels/whatsapp', { method: 'DELETE' });
      const json = (await res.json()) as WhatsAppStatus & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not disconnect.');
      setStatus(json);
      setMsg('Disconnected. History stays; new replies save locally only.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not disconnect.');
    }
  }

  return (
    <article className="card received">
      <div className="label">WhatsApp connection (test)</div>
      {!status && <p className="assignee">Loading…</p>}
      {status && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p className="assignee">
            <span className="status">
              {!status.configured ? 'Not configured' : status.linked ? `Connected ${status.maskedNumber ?? ''}` : 'Not connected'}
            </span>
          </p>
          {!status.configured ? (
            <p className="assignee">Server credentials are missing. Add the WHATSAPP_* values to .env and restart the app — the full number is never shown here.</p>
          ) : (
            <p className="assignee">Links this business to the test number. Inbox replies on WhatsApp threads then send for real; incoming messages arrive via the webhook.</p>
          )}
          {msg ? <p className="assignee">{msg}</p> : null}
          {canManage && status.configured && !status.linked ? (
            <button className="send" type="button" disabled={busy} style={{ width: '100%' }} onClick={connect}>
              {busy ? 'Connecting…' : 'Connect WhatsApp test number'}
            </button>
          ) : null}
          {canManage && status.linked ? (
            <button className="chip" type="button" onClick={disconnect}>Disconnect</button>
          ) : null}
          {!canManage ? <p className="assignee">Only owners and managers can connect channels.</p> : null}
        </div>
      )}
    </article>
  );
}
