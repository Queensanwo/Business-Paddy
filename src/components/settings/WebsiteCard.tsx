'use client';

import { useEffect, useState } from 'react';

interface SiteInfo {
  siteEnabled: boolean;
  siteDescription: string | null;
  siteProducts: string | null;
  siteHours: string | null;
  siteContact: string | null;
}

export function WebsiteCard({ canManage, workspaceId }: { canManage: boolean; workspaceId: string | null }) {
  const [enabled, setEnabled] = useState(true);
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState('');
  const [hours, setHours] = useState('');
  const [contact, setContact] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/site')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const s = (json as { site?: SiteInfo } | null)?.site;
        if (!s) return;
        setEnabled(s.siteEnabled);
        setDescription(s.siteDescription ?? '');
        setProducts(s.siteProducts ?? '');
        setHours(s.siteHours ?? '');
        setContact(s.siteContact ?? '');
        setLoaded(true);
      })
      .catch(() => {});
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteEnabled: enabled,
          siteDescription: description,
          siteProducts: products,
          siteHours: hours,
          siteContact: contact,
        }),
      });
      const json = (await res.json()) as { site?: SiteInfo; error?: string };
      if (!res.ok || !json.site) throw new Error(json.error || 'Could not save.');
      setMsg('Website page saved. Only what you write here is ever public.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not save.');
    }
    setBusy(false);
  }

  return (
    <article className="card received">
      <div className="label">Business website front</div>
      {!loaded && <p className="assignee">Loading…</p>}
      {loaded && (
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={!canManage} />
            Public page visible to customers
          </label>
          <label className="auth-field">
            Description
            <textarea value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Family-run fabric shop in Lagos since 2012." disabled={!canManage}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }} />
          </label>
          <label className="auth-field">
            Products or services
            <textarea value={products} maxLength={2000} onChange={(e) => setProducts(e.target.value)} placeholder="e.g. Ankara, lace, aso-ebi packages." disabled={!canManage}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }} />
          </label>
          <label className="auth-field">
            Opening hours
            <input value={hours} maxLength={500} onChange={(e) => setHours(e.target.value)} placeholder="e.g. Mon–Sat, 9am–6pm." disabled={!canManage} />
          </label>
          <label className="auth-field">
            Contact details
            <input value={contact} maxLength={500} onChange={(e) => setContact(e.target.value)} placeholder="e.g. 0800 000 0000, shop 12, Main Market." disabled={!canManage} />
          </label>
          {workspaceId ? (
            <p className="auth-alt"><a href={`/site/${workspaceId}`} target="_blank" rel="noreferrer">View public page</a></p>
          ) : null}
          {msg ? <p className="assignee">{msg}</p> : null}
          {canManage ? (
            <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : 'Save website page'}
            </button>
          ) : (
            <p className="assignee">Only owners and managers can edit this page.</p>
          )}
        </form>
      )}
    </article>
  );
}
