'use client';

import { useEffect, useState } from 'react';
import { emptyProfessionalProfile } from '@/lib/professionalProfile';
import type { ProfessionalProfile, ProfileLink, WorkspaceKind } from '@/lib/professionalProfile';

interface SiteInfo {
  siteEnabled: boolean;
  siteDescription: string | null;
  siteProducts: string | null;
  siteHours: string | null;
  siteContact: string | null;
  workspaceKind: WorkspaceKind;
  siteProfessionalProfile: ProfessionalProfile | null;
}

function ProfileLinks({ title, entries, onChange, disabled }: {
  title: string; entries: ProfileLink[]; onChange: (entries: ProfileLink[]) => void; disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend>{title}</legend>
      {entries.map((entry, index) => (
        <div key={index} style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
          <label className="auth-field">Label {index + 1}
            <input required maxLength={80} value={entry.label} onChange={(e) => onChange(entries.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} />
          </label>
          <label className="auth-field">HTTPS link {index + 1}
            <input type="url" required maxLength={500} placeholder="https://" value={entry.url} onChange={(e) => onChange(entries.map((item, i) => i === index ? { ...item, url: e.target.value } : item))} />
          </label>
          <button type="button" className="chip" onClick={() => onChange(entries.filter((_, i) => i !== index))}>Remove link {index + 1}</button>
        </div>
      ))}
      {entries.length < 6 && <button type="button" className="chip" onClick={() => onChange([...entries, { label: '', url: '' }])}>Add link</button>}
    </fieldset>
  );
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
  const [kind, setKind] = useState<WorkspaceKind>('BUSINESS');
  const [profile, setProfile] = useState(emptyProfessionalProfile);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    fetch('/api/site')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const s = (json as { site?: SiteInfo } | null)?.site;
        if (!s) throw new Error('Could not load website settings. Refresh to try again.');
        setEnabled(s.siteEnabled);
        setDescription(s.siteDescription ?? '');
        setProducts(s.siteProducts ?? '');
        setHours(s.siteHours ?? '');
        setContact(s.siteContact ?? '');
        setKind(s.workspaceKind);
        setProfile(s.siteProfessionalProfile ?? emptyProfessionalProfile);
        setPublished(s.siteEnabled);
        setLoaded(true);
      })
      .catch(() => setMsg('Could not load website settings. Refresh to try again.'));
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
          workspaceKind: kind,
          ...(kind === 'PROFESSIONAL' ? { siteProfessionalProfile: profile } : {}),
        }),
      });
      const json = (await res.json()) as { site?: SiteInfo; error?: string };
      if (!res.ok || !json.site) throw new Error(json.error || 'Could not save.');
      setPublished(json.site.siteEnabled);
      setMsg(json.site.siteEnabled ? 'Website saved and published.' : 'Website saved privately.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not save.');
    }
    setBusy(false);
  }

  return (
    <article className="card received">
      <div className="label">{kind === 'PROFESSIONAL' ? 'Professional profile' : 'Business website'}</div>
      {!loaded && <p className="assignee" role="status">{msg || 'Loading…'}</p>}
      {loaded && (
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <label className="auth-field">Workspace type
            <select value={kind} disabled={!canManage || busy} onChange={(e) => {
              setKind(e.target.value === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'BUSINESS');
              setEnabled(false);
            }}>
              <option value="BUSINESS">Business</option>
              <option value="PROFESSIONAL">Professional</option>
            </select>
          </label>
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
          {kind === 'PROFESSIONAL' && (
            <>
              <label className="auth-field">Specialty
                <input maxLength={100} value={profile.specialty} placeholder="e.g. Wedding photographer" disabled={!canManage || busy}
                  onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} />
              </label>
              <label className="auth-field">Public email (optional)
                <input type="email" maxLength={254} value={profile.email} disabled={!canManage || busy}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </label>
              <ProfileLinks title="Social profiles" entries={profile.socials} disabled={!canManage || busy} onChange={(socials) => setProfile({ ...profile, socials })} />
              <ProfileLinks title="Work samples" entries={profile.portfolio} disabled={!canManage || busy} onChange={(portfolio) => setProfile({ ...profile, portfolio })} />
            </>
          )}
          {workspaceId && published ? (
            <p className="auth-alt"><a href={`/site/${workspaceId}`} target="_blank" rel="noreferrer">View public page</a></p>
          ) : null}
          {msg ? <p className="assignee" role="status">{msg}</p> : null}
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
