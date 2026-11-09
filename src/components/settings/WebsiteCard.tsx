'use client';

import { useEffect, useState } from 'react';
import styles from './WebsiteCard.module.css';
import { emptyProfessionalProfile, MAX_WORK_PHOTOS, parseProfessionalDraft, profileAccentStyle } from '@/lib/professionalProfile';
import { ProfessionalPhotos, professionalPhotoUrl } from '@/components/ProfessionalPhotos';
import { preparePhoto } from '@/lib/preparePhoto';
import type { ProfessionalDraft, ProfessionalProfile, ProfileLink, WorkspaceKind } from '@/lib/professionalProfile';

interface SiteInfo {
  name: string;
  siteEnabled: boolean;
  siteDescription: string | null;
  siteProducts: string | null;
  siteHours: string | null;
  siteContact: string | null;
  workspaceKind: WorkspaceKind;
  siteProfessionalProfile: ProfessionalProfile | null;
  siteProfessionalDraft: ProfessionalDraft | null;
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
  const [name, setName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch('/api/site')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const s = (json as { site?: SiteInfo } | null)?.site;
        if (!s) throw new Error('Could not load website settings. Refresh to try again.');
        const draft = s.siteProfessionalDraft;
        setEnabled(s.siteEnabled && (!draft || s.workspaceKind === 'PROFESSIONAL'));
        setDescription(draft?.description ?? s.siteDescription ?? '');
        setProducts(draft?.products ?? s.siteProducts ?? '');
        setHours(draft?.hours ?? s.siteHours ?? '');
        setContact(draft?.contact ?? s.siteContact ?? '');
        setKind(draft ? 'PROFESSIONAL' : s.workspaceKind);
        setProfile({ ...emptyProfessionalProfile, ...(draft?.profile ?? s.siteProfessionalProfile) });
        setPublished(s.siteEnabled);
        setName(s.name);
        setLoaded(true);
      })
      .catch(() => setMsg('Could not load website settings. Refresh to try again.'));
  }, []);

  async function uploadPhoto(file: File, kind: 'portrait' | 'work') {
    setBusy(true);
    setMsg('Uploading photo…');
    try {
      const form = new FormData();
      form.append('file', await preparePhoto(file));
      if ((form.get('file') as File).size > 2 * 1024 * 1024) throw new Error('Choose a photo under 2 MB.');
      const response = await fetch('/api/site/photos', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok || typeof result.id !== 'string') throw new Error(result.error || 'Could not upload the photo.');
      setProfile((current) => kind === 'portrait' ? { ...current, portraitId: result.id }
        : { ...current, photos: [...current.photos, { id: result.id, caption: '' }] });
      setMsg('Photo added. Save a private draft to keep it, or publish to show it on your profile.');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Could not upload the photo.');
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    setBusy(true);
    setMsg('');
    try {
      const professionalDraft = parseProfessionalDraft({ description, products, hours, contact, profile });
      const res = await fetch('/api/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalDraft }),
      });
      const result = await res.json();
      if (!res.ok || !result.saved) throw new Error(result.error || 'Could not save draft.');
      setMsg('Draft saved privately. Your public page is unchanged.');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Could not save draft.');
    } finally {
      setBusy(false);
    }
  }

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
      {loaded && kind === 'PROFESSIONAL' && <p className="assignee">{published ? 'Your page is public.' : 'Your page is private.'} Only saved and published changes appear to visitors.</p>}
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
          {kind === 'BUSINESS' ? (
            <>
          <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={!canManage} />
            Make my page public
          </label>
          <label className="auth-field">
            About you
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
            </>
          ) : (
            <>
              <nav className={styles.steps} aria-label="Jump to a profile setup step">
                <a href="#setup-about">1. About you</a>
                <a href="#setup-services">2. Your services</a>
                <a href="#setup-photos">3. Photos and colours</a>
                <a href="#setup-contact">4. Contact</a>
                <a href="#setup-publish">5. Preview and publish</a>
              </nav>
              <section id="setup-about" className={styles.step}>
                <h2>1. Tell people about yourself</h2>
                <p>Write a short introduction so visitors know who you are.</p>
              <label className="auth-field">What do you do?
                <input maxLength={100} value={profile.specialty} placeholder="e.g. Wedding photographer" disabled={!canManage || busy}
                  onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} />
              </label>
          <label className="auth-field">
            About you
            <textarea value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Family-run fabric shop in Lagos since 2012." disabled={!canManage}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }} />
          </label>
              </section>
              <section id="setup-services" className={styles.step}>
                <h2>2. Add what you offer</h2>
                <p>Add one service at a time. Leave the price blank if people should ask for a quote.</p>
          <label className="auth-field">
            Products or services
            <textarea value={products} maxLength={2000} onChange={(e) => setProducts(e.target.value)} placeholder="e.g. Ankara, lace, aso-ebi packages." disabled={!canManage}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }} />
          </label>
              <fieldset disabled={!canManage || busy}>
                <legend>Service cards</legend>
                {profile.services.map((service, index) => (
                  <div key={service.id} style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                    {([['name', 'Service name', 100], ['description', 'Description', 500], ['price', 'Price (optional)', 80]] as const).map(([key, label, maxLength]) => (
                      <label className="auth-field" key={key}>{label} {index + 1}
                        <input required={key === 'name'} maxLength={maxLength} value={service[key]}
                          onChange={(e) => setProfile({ ...profile, services: profile.services.map((row) => row.id === service.id ? { ...row, [key]: e.target.value } : row) })} />
                      </label>
                    ))}
                    <button className="chip" type="button" onClick={() => setProfile({ ...profile, services: profile.services.filter((row) => row.id !== service.id) })}>Remove service {index + 1}</button>
                  </div>
                ))}
                {profile.services.length < 8 && <button className="chip" type="button" onClick={() => setProfile({ ...profile, services: [...profile.services, { id: crypto.randomUUID(), name: '', description: '', price: '' }] })}>Add service</button>}
              </fieldset>
              </section>
              <section id="setup-photos" className={styles.step}>
                <h2>3. Make the page yours</h2>
                <p>Optional: add a photo of yourself, show examples of your work, or pick a colour.</p>
              <fieldset disabled={!canManage || busy}>
                <legend>Profile photo and colours</legend>
                {profile.portraitId && <img src={professionalPhotoUrl(profile.portraitId)} alt="Profile photo preview"
                  style={{ width: '88px', height: '88px', objectFit: 'cover', borderRadius: '50%' }} />}
                <label className="auth-field">{profile.portraitId ? 'Replace profile photo' : 'Upload profile photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                    const file = e.target.files?.[0]; e.target.value = '';
                    if (file) void uploadPhoto(file, 'portrait');
                  }} />
                </label>
                {profile.portraitId && <button className="chip" type="button" onClick={() => setProfile({ ...profile, portraitId: null })}>Remove profile photo</button>}
                <label className="auth-field">Choose a colour
                  <input type="color" value={profile.accent ?? '#1d4fb8'} onChange={(e) => setProfile({ ...profile, accent: e.target.value })} />
                </label>
                {profile.accent && <button className="chip" type="button" onClick={() => setProfile({ ...profile, accent: null })}>Use default colour</button>}
              </fieldset>
              <fieldset disabled={!canManage || busy}>
                <legend>Work gallery</legend>
                <p className="assignee">Upload up to six JPEG, PNG or WebP photos, up to 2 MB each.</p>
                {profile.photos.map((photo, index) => (
                  <div key={photo.id} style={{ marginBottom: '12px' }}>
                    <img src={professionalPhotoUrl(photo.id)} alt={photo.caption || `Work sample ${index + 1}`}
                      style={{ width: '112px', height: '84px', objectFit: 'contain' }} />
                    <label className="auth-field">Caption for photo {index + 1}
                      <input value={photo.caption} maxLength={160} onChange={(e) => setProfile({ ...profile, photos: profile.photos.map((item) => item.id === photo.id ? { ...item, caption: e.target.value } : item) })} />
                    </label>
                    <button className="chip" type="button" onClick={() => setProfile({ ...profile, photos: profile.photos.filter((item) => item.id !== photo.id) })}>Remove work photo {index + 1}</button>
                  </div>
                ))}
                {profile.photos.length < MAX_WORK_PHOTOS && <label className="auth-field">Upload a work photo
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                    const file = e.target.files?.[0]; e.target.value = '';
                    if (file) void uploadPhoto(file, 'work');
                  }} />
                </label>}
              </fieldset>
              <ProfileLinks title="Work samples" entries={profile.portfolio} disabled={!canManage || busy} onChange={(portfolio) => setProfile({ ...profile, portfolio })} />
              </section>
              <section id="setup-contact" className={styles.step}>
                <h2>4. Help people reach you</h2>
                <p>Your page already has Paddy Chat and a form for people to ask for a reply. Add public contact details only if you want to share them.</p>
          <label className="auth-field">
            Opening hours
            <input value={hours} maxLength={500} onChange={(e) => setHours(e.target.value)} placeholder="e.g. Mon–Sat, 9am–6pm." disabled={!canManage} />
          </label>
          <label className="auth-field">
            Contact details
            <input value={contact} maxLength={500} onChange={(e) => setContact(e.target.value)} placeholder="e.g. 0800 000 0000, shop 12, Main Market." disabled={!canManage} />
          </label>
              <label className="auth-field">Public email (optional)
                <input type="email" maxLength={254} value={profile.email} disabled={!canManage || busy}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </label>
              <ProfileLinks title="Social profiles" entries={profile.socials} disabled={!canManage || busy} onChange={(socials) => setProfile({ ...profile, socials })} />
              </section>
              <section id="setup-publish" className={styles.step}>
                <h2>5. Preview and publish</h2>
                <p>Preview your page first. Save a draft to keep working privately, or choose to make the page public when it is ready.</p>
          <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={!canManage} />
            Make my page public
          </label>
              </section>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="chip" type="button" onClick={() => setShowPreview(!showPreview)} aria-expanded={showPreview}>
                  {showPreview ? 'Hide private preview' : 'Preview my page'}
                </button>
                {canManage && <button className="chip" type="button" onClick={saveDraft} disabled={busy}>Save private draft</button>}
              </div>
              {showPreview && (
                <section className="card received" aria-label="Private mobile preview"
                  style={{ width: '100%', maxWidth: '360px', margin: '8px auto', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                  <p className="label">Private mobile preview</p>
                  {profile.portraitId && <img src={professionalPhotoUrl(profile.portraitId)} alt="Profile photo"
                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '50%' }} />}
                  <h2>{name}</h2>
                  {profile.specialty && <p>{profile.specialty}</p>}
                  <span className="chip" style={profileAccentStyle(profile.accent)}>Enquire on Paddy Chat</span>
                  <ProfessionalPhotos photos={profile.photos} />
                  {description && <section><h3>About</h3><p>{description}</p></section>}
                  {products && <section><h3>Services</h3><p>{products}</p></section>}
                  {profile.services.filter((service) => service.name).map((service) => (
                    <section className="card" key={service.id}><h3>{service.name}</h3><p>{service.description}</p><p>{service.price || 'Request a quote'}</p></section>
                  ))}
                  {profile.portfolio.some((entry) => entry.label) && <section><h3>Portfolio</h3>{profile.portfolio.map((entry, index) => <p key={index}>{entry.label}</p>)}</section>}
                  {profile.socials.some((entry) => entry.label) && <section><h3>Social profiles</h3>{profile.socials.map((entry, index) => <p key={index}>{entry.label}</p>)}</section>}
                  {(hours || contact || profile.email) && <section><h3>Contact</h3><p>{hours}</p><p>{contact}</p><p>{profile.email}</p></section>}
                </section>
              )}
            </>
          )}
          {workspaceId && published ? (
            <p className="auth-alt"><a href={`/site/${workspaceId}`} target="_blank" rel="noreferrer">Open my public page</a></p>
          ) : null}
          {msg ? <p className="assignee" role="status">{msg}</p> : null}
          {canManage ? (
            <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : enabled ? 'Publish website page' : published ? 'Unpublish and save website' : 'Save unpublished website'}
            </button>
          ) : (
            <p className="assignee">Only owners and managers can edit this page.</p>
          )}
        </form>
      )}
    </article>
  );
}
