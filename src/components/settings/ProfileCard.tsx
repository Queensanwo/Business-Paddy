'use client';

import { useEffect, useState } from 'react';

interface SettingsData {
  workspace: { id: string; name: string; industry: string | null; mode: 'DEMO' | 'LIVE' };
  owner: { name: string; email: string } | null;
}

export function ProfileCard() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/sign-in';
          throw new Error('Sign in required.');
        }
        if (!res.ok) throw new Error('Settings request failed.');
        return res.json();
      })
      .then((json) => {
        const parsed = json as SettingsData;
        setData(parsed);
        setBusinessName(parsed.workspace.name);
        setIndustry(parsed.workspace.industry ?? '');
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    setBusy(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: businessName, industry }),
      });
      const json = (await res.json()) as { workspace?: SettingsData['workspace']; error?: string };
      if (!res.ok) throw new Error(json.error || 'Save failed.');
      if (json.workspace && data) setData({ ...data, workspace: json.workspace });
      setStatus('Settings saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed.');
    }
    setBusy(false);
  }

  return (
    <article className="card received">
      <div className="label">Business profile</div>
      {loadState === 'loading' ? <p className="assignee">Loading…</p> : null}
      {loadState === 'error' ? <p className="auth-error">Could not load settings.</p> : null}
      {data ? (
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <label className="auth-field">
            Business name
            <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </label>
          <label className="auth-field">
            Industry
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Retail" />
          </label>
          <p className="assignee">Workspace: {data.workspace.name}</p>
          <p className="assignee">Owner email: {data.owner ? data.owner.email : '—'}</p>
          {status ? <p className="assignee">{status}</p> : null}
          <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      ) : null}
    </article>
  );
}
