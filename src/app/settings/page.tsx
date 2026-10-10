'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';

const CHANNELS = ['WhatsApp', 'Instagram', 'TikTok', 'Email', 'Website', 'Paddy Chat'];

interface SavedReplyRow {
  id: string;
  title: string;
  body: string;
}

interface MacroRow {
  id: string;
  title: string;
  body: string;
  assignUserId: string | null;
  status: string | null;
  escalateToId: string | null;
  escalateReason: string | null;
  createdById: string | null;
}

interface TeamUser {
  id: string;
  name: string;
  role: string;
}

interface SiteInfo {
  siteEnabled: boolean;
  siteDescription: string | null;
  siteProducts: string | null;
  siteHours: string | null;
  siteContact: string | null;
}

function WebsiteCard({ canManage, workspaceId }: { canManage: boolean; workspaceId: string | null }) {
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

interface BrandingInfo {
  theme: string;
  accentColor: string | null;
  logoUrl: string | null;
  hasLogo: boolean;
}

interface ThemeOption {
  name: string;
  label: string;
}

function BrandingCard({ canManage }: { canManage: boolean }) {
  const [saved, setSaved] = useState<BrandingInfo | null>(null);
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [suggestions, setSuggestions] = useState<{ hex: string; label: string }[]>([]);
  const [theme, setTheme] = useState('NAVY');
  const [accent, setAccent] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch('/api/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json as {
          branding?: BrandingInfo;
          themes?: ThemeOption[];
          suggestions?: { hex: string; label: string }[];
        } | null;
        if (!data?.branding) return;
        setSaved(data.branding);
        setThemes(data.themes ?? []);
        setSuggestions(data.suggestions ?? []);
        setTheme(data.branding.theme);
        setAccent(data.branding.accentColor ?? '');
        setLogoUrl(data.branding.logoUrl);
      })
      .catch(() => {});
  }

  useEffect(load, []);

  function applyPreview(nextTheme: string, nextAccent: string) {
    // Instant preview on the app shell; Save persists, Cancel reverts.
    const shell = document.getElementById('app');
    if (shell) {
      if (nextTheme && nextTheme !== 'NAVY') shell.dataset.theme = nextTheme;
      else shell.removeAttribute('data-theme');
      if (nextAccent) {
        shell.setAttribute('data-accent', '1');
        shell.style.setProperty('--accent', nextAccent);
        shell.style.setProperty('--accent-deep', nextAccent);
      } else {
        shell.removeAttribute('data-accent');
        shell.style.removeProperty('--accent');
        shell.style.removeProperty('--accent-deep');
      }
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, accentColor: accent.trim() || null }),
      });
      const json = (await res.json()) as { branding?: BrandingInfo; error?: string };
      if (!res.ok || !json.branding) throw new Error(json.error || 'Could not save.');
      setSaved(json.branding);
      applyPreview(json.branding.theme, json.branding.accentColor ?? '');
      setMsg('Branding saved. It applies on every device you sign in on.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not save.');
    }
    setBusy(false);
  }

  function onCancel() {
    if (!saved) return;
    setTheme(saved.theme);
    setAccent(saved.accentColor ?? '');
    setLogoUrl(saved.logoUrl);
    applyPreview(saved.theme, saved.accentColor ?? '');
    setMsg('Reverted to the saved branding.');
  }

  async function onRestore() {
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      const json = (await res.json()) as { branding?: BrandingInfo; error?: string };
      if (!res.ok || !json.branding) throw new Error(json.error || 'Could not restore.');
      setSaved(json.branding);
      setTheme('NAVY');
      setAccent('');
      applyPreview('NAVY', '');
      setMsg('Defaults restored (logo kept).');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not restore.');
    }
    setBusy(false);
  }

  async function onUpload(file: File) {
    setMsg('');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/branding/logo', { method: 'POST', body: form });
      const json = (await res.json()) as { logoUrl?: string; error?: string };
      if (!res.ok || !json.logoUrl) throw new Error(json.error || 'Upload failed.');
      setLogoUrl(`${json.logoUrl}?t=${Date.now()}`);
      setSaved((prev) => (prev ? { ...prev, hasLogo: true, logoUrl: json.logoUrl as string } : prev));
      setMsg('Logo uploaded. Your theme is unchanged.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed.');
    }
    setBusy(false);
  }

  async function onRemoveLogo() {
    setMsg('');
    try {
      const res = await fetch('/api/branding/logo', { method: 'DELETE' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not remove.');
      setLogoUrl(null);
      setSaved((prev) => (prev ? { ...prev, hasLogo: false, logoUrl: null } : prev));
      setMsg('Logo removed.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not remove.');
    }
  }

  return (
    <article className="card received">
      <div className="label">Business branding</div>
      {!saved && <p className="assignee">Loading…</p>}
      {saved && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Business logo" style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'contain', background: '#fff', border: '1px solid var(--line)' }} />
            ) : (
              <div className="logo">BP</div>
            )}
            {canManage ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <label className="chip" style={{ cursor: 'pointer' }}>
                  {logoUrl ? 'Replace logo' : 'Upload logo'}
                  <input
                    type="file"
                    hidden
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {logoUrl ? (
                  <button className="chip" type="button" onClick={onRemoveLogo}>Remove</button>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="assignee">PNG, JPEG, GIF or WebP, under 2 MB. Proportions preserved. Uploading a logo never changes your theme.</p>
          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="auth-field">
              <span>Preset theme</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {themes.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    className={`chip${theme === t.name ? ' active' : ''}`}
                    disabled={!canManage}
                    onClick={() => {
                      setTheme(t.name);
                      applyPreview(t.name, accent.trim());
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="auth-field">
              Custom accent colour (optional, e.g. #526BB1)
              <input
                value={accent}
                maxLength={7}
                onChange={(e) => {
                  setAccent(e.target.value);
                  applyPreview(theme, e.target.value.trim());
                }}
                placeholder="#526BB1"
                disabled={!canManage}
              />
            </label>
            <p className="assignee">Accents must stay readable with white button text — very light colours are rejected.</p>
            {suggestions.length > 0 ? (
              <div className="auth-field">
                <span>Curated suggestions (nothing auto-applied)</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {suggestions.map((s) => (
                    <button
                      key={s.hex}
                      type="button"
                      className="chip"
                      disabled={!canManage}
                      onClick={() => {
                        setAccent(s.hex);
                        applyPreview(theme, s.hex);
                      }}
                    >
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', background: s.hex, marginRight: '6px', verticalAlign: 'baseline' }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {msg ? <p className="assignee">{msg}</p> : null}
            {canManage ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button className="send" type="submit" disabled={busy} style={{ flex: 1 }}>
                  {busy ? 'Saving…' : 'Save branding'}
                </button>
                <button className="chip" type="button" onClick={onCancel}>Cancel</button>
                <button className="chip" type="button" onClick={onRestore}>Restore defaults</button>
              </div>
            ) : (
              <p className="assignee">Only owners and managers can change branding.</p>
            )}
          </form>
        </div>
      )}
    </article>
  );
}

interface ReplySettings {
  toneGuidance: string | null;
  autoReplyEnabled: boolean;
  autoReplyGreeting: string | null;
  requireTraineeApproval: boolean;
  feedbackEnabled: boolean;
}

interface ApprovalRow {
  id: string;
  conversationId: string;
  text: string;
  status: string;
}

function ReplyControlsCard({ canManage }: { canManage: boolean }) {
  const [settings, setSettings] = useState<ReplySettings | null>(null);
  const [tone, setTone] = useState('');
  const [greeting, setGreeting] = useState('');
  const [autoOn, setAutoOn] = useState(false);
  const [traineeApproval, setTraineeApproval] = useState(true);
  const [feedbackOn, setFeedbackOn] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/reply-settings')
      .then((res) => (res.ok ? res.json() : { settings: null }))
      .then((json) => {
        const s = (json as { settings: ReplySettings | null }).settings;
        if (s) {
          setSettings(s);
          setTone(s.toneGuidance ?? '');
          setGreeting(s.autoReplyGreeting ?? '');
          setAutoOn(s.autoReplyEnabled);
          setTraineeApproval(s.requireTraineeApproval);
          setFeedbackOn(s.feedbackEnabled !== false);
        }
      })
      .catch(() => {});
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/reply-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toneGuidance: tone,
          autoReplyEnabled: autoOn,
          autoReplyGreeting: greeting,
          requireTraineeApproval: traineeApproval,
          feedbackEnabled: feedbackOn,
        })
      });
      const json = (await res.json()) as { settings?: ReplySettings; error?: string };
      if (!res.ok || !json.settings) throw new Error(json.error || 'Could not save.');
      setSettings(json.settings);
      setMsg('Reply controls saved.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not save.');
    }
    setBusy(false);
  }

  return (
    <article className="card received">
      <div className="label">Reply controls (tone, auto-replies, approvals)</div>
      {!settings && <p className="assignee">Loading…</p>}
      {settings && (
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <label className="auth-field">
            Tone guidance for staff and AI drafts (optional)
            <textarea
              value={tone}
              maxLength={500}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g. Friendly, short sentences, no slang."
              disabled={!canManage}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }}
            />
          </label>
          <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={autoOn} onChange={(e) => setAutoOn(e.target.checked)} disabled={!canManage} />
            Send an automatic greeting when a guest starts a Paddy Chat
          </label>
          <label className="auth-field">
            Automatic greeting (only sent when enabled)
            <textarea
              value={greeting}
              maxLength={500}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="e.g. Hello! Thanks for contacting us — a team member will reply shortly."
              disabled={!canManage}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }}
            />
          </label>
          <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={traineeApproval} onChange={(e) => setTraineeApproval(e.target.checked)} disabled={!canManage} />
            Trainee replies need owner/manager approval
          </label>
          <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={feedbackOn} onChange={(e) => setFeedbackOn(e.target.checked)} disabled={!canManage} />
            Ask customers for a Helpful / Not helpful rating after resolved chats
          </label>
          {msg ? <p className="assignee">{msg}</p> : null}
          {canManage ? (
            <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : 'Save reply controls'}
            </button>
          ) : (
            <p className="assignee">Only owners and managers can change these. AI drafts always need review before sending.</p>
          )}
        </form>
      )}
    </article>
  );
}

function ApprovalsCard({ canReview }: { canReview: boolean }) {
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

const MACRO_STATUSES = ['', 'NEW', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'FOLLOW_UP', 'NEEDS_APPROVAL', 'ESCALATED', 'RESOLVED'];
const MACRO_STATUS_LABELS: Record<string, string> = {
  '': 'No status change',
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  WAITING_FOR_CUSTOMER: 'Waiting for customer',
  FOLLOW_UP: 'Follow up',
  NEEDS_APPROVAL: 'Needs approval',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
};

function MacrosCard({ canManage, currentUserId }: { canManage: boolean; currentUserId: string | null }) {
  const canDelete = (m: MacroRow) => canManage || (currentUserId !== null && m.createdById === currentUserId);
  const [macros, setMacros] = useState<MacroRow[]>([]);
  const [staff, setStaff] = useState<TeamUser[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [status, setStatus] = useState('');
  const [escalateToId, setEscalateToId] = useState('');
  const [escalateReason, setEscalateReason] = useState('Complaint');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/macros')
      .then((res) => (res.ok ? res.json() : { macros: [] }))
      .then((json) => setMacros((json as { macros: MacroRow[] }).macros ?? []))
      .catch(() => {});
    if (canManage) {
      fetch('/api/team')
        .then((res) => (res.ok ? res.json() : { users: [] }))
        .then((json) => setStaff((json as { users: TeamUser[] }).users ?? []))
        .catch(() => {});
    }
  }, [canManage]);

  function describe(m: MacroRow): string {
    const parts: string[] = [];
    if (m.body) parts.push('inserts text');
    const assignee = staff.find((s) => s.id === m.assignUserId);
    if (m.assignUserId) parts.push(`assigns to ${assignee ? assignee.name : 'staff'}`);
    if (m.status) parts.push(`sets ${MACRO_STATUS_LABELS[m.status] ?? m.status}`);
    if (m.escalateToId) parts.push('escalates');
    return parts.length > 0 ? parts.join(' · ') : 'No actions';
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          assignUserId: assignUserId || null,
          status: status || null,
          escalateToId: escalateToId || null,
          escalateReason: escalateToId ? escalateReason : null,
        }),
      });
      const json = (await res.json()) as { macro?: MacroRow; error?: string };
      if (!res.ok || !json.macro) throw new Error(json.error || 'Could not create.');
      setMacros((prev) => [...prev, json.macro as MacroRow].sort((a, b) => a.title.localeCompare(b.title)));
      setTitle('');
      setBody('');
      setAssignUserId('');
      setStatus('');
      setEscalateToId('');
      setMsg('Macro created.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not create.');
    }
    setBusy(false);
  }

  async function onDelete(id: string) {
    setMsg('');
    try {
      const res = await fetch(`/api/macros/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not delete.');
      setMacros((prev) => prev.filter((m) => m.id !== id));
      setMsg('Macro deleted.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not delete.');
    }
  }

  return (
    <article className="card received">
      <div className="label">Macros</div>
      <div className="conv-list" style={{ marginTop: '10px' }}>
        {macros.length === 0 ? <p className="assignee">No macros yet.</p> : null}
        {macros.map((m) => (
          <div key={m.id} className="conv" style={{ cursor: 'default' }}>
            <div className="conv-top">
              <strong>{m.title}</strong>
              {canDelete(m) ? (
                <button
                  type="button"
                  aria-label={`Delete ${m.title}`}
                  style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
                  onClick={() => onDelete(m.id)}
                >
                  ✕
                </button>
              ) : null}
            </div>
            <div className="preview" style={{ whiteSpace: 'normal' }}>{describe(m)}</div>
          </div>
        ))}
      </div>
      {
        <form onSubmit={onCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <label className="auth-field">
            Title
            <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Refund + escalate" />
          </label>
          <label className="auth-field">
            Text to insert (optional)
            <textarea
              value={body}
              maxLength={2000}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Text added to the reply box for editing before sending."
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '64px' }}
            />
          </label>
          <label className="auth-field">
            Assign to (optional)
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)' }}
            >
              <option value="">No change</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="auth-field">
            Set status (optional)
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)' }}
            >
              {MACRO_STATUSES.map((s) => (
                <option key={s} value={s}>{MACRO_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <label className="auth-field">
            Escalate to (optional)
            <select
              value={escalateToId}
              onChange={(e) => setEscalateToId(e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)' }}
            >
              <option value="">No escalation</option>
              {staff
                .filter((s) => s.role === 'OWNER' || s.role === 'MANAGER')
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
          </label>
          {msg ? <p className="assignee">{msg}</p> : null}
          <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Saving…' : 'Create macro'}
          </button>
          <p className="assignee">Everyone on the team can create macros. Owners and managers can delete any macro; others can delete only their own.</p>
        </form>
      }
    </article>
  );
}

function SavedRepliesCard({ canManage }: { canManage: boolean }) {
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

interface SettingsData {
  workspace: { id: string; name: string; industry: string | null; mode: 'DEMO' | 'LIVE' };
  owner: { name: string; email: string } | null;
}

interface PaymentRow {
  id: string;
  reference: string;
  amountKobo: number;
  currency: string;
  status: string;
  channel: string | null;
  paidAt: string | null;
  isTest: boolean;
}

function formatAmount(amountKobo: number, currency: string): string {
  const symbol = currency === 'NGN' ? '₦' : `${currency} `;
  return `${symbol}${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function SettingsPage() {
  const { user } = useSessionUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [data, setData] = useState<SettingsData | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [billingMsg, setBillingMsg] = useState('');
  const [billingBusy, setBillingBusy] = useState(false);

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
    fetch('/api/billing/payments')
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => setPayments(json as PaymentRow[]))
      .catch(() => {});
    // Paystack redirects back here after checkout (?payment=callback&reference=…).
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'callback') {
      const reference = params.get('reference') ?? params.get('trxref') ?? '';
      window.history.replaceState({}, '', '/settings');
      if (reference) {
        verifyPayment(reference);
      } else {
        setBillingMsg('Checkout was closed before finishing. No payment was recorded as successful.');
      }
    }
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

  async function refreshPayments() {
    try {
      const res = await fetch('/api/billing/payments');
      if (res.ok) setPayments((await res.json()) as PaymentRow[]);
    } catch {
      /* payments list is informational; inbox still works */
    }
  }

  async function verifyPayment(reference: string) {
    setBillingBusy(true);
    setBillingMsg('Verifying payment with Paystack…');
    try {
      const res = await fetch(`/api/billing/verify?reference=${encodeURIComponent(reference)}`);
      const json = (await res.json()) as PaymentRow & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Verification failed.');
      setBillingMsg(
        `Payment successful: ${formatAmount(json.amountKobo, json.currency)} (reference ${json.reference}). ` +
          'Test mode — no real subscription was activated.',
      );
      await refreshPayments();
    } catch (err) {
      setBillingMsg(err instanceof Error ? err.message : 'Verification failed.');
    }
    setBillingBusy(false);
  }

  async function startCheckout() {
    setBillingMsg('');
    setBillingBusy(true);
    try {
      const res = await fetch('/api/billing/initialize', { method: 'POST' });
      const json = (await res.json()) as { authorizationUrl?: string; error?: string };
      if (!res.ok || !json.authorizationUrl) {
        throw new Error(json.error || 'Could not start checkout.');
      }
      window.location.href = json.authorizationUrl;
    } catch (err) {
      setBillingMsg(err instanceof Error ? err.message : 'Could not start checkout.');
      setBillingBusy(false);
    }
  }

  return (
    <div className="app app-single" id="app">
      <Navigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        active="settings"
        userName={user?.name ?? 'Business Paddy'}
        userSub={user ? `${roleLabel(user.role)} · ${user.workspaceName}` : 'Shared inbox'}
      />
      <section className="main">
        <header className="topbar">
          <button className="menu-btn" id="menuBtn" type="button" onClick={() => setIsMobileMenuOpen(true)}>Menu</button>
          <div>
            <strong>Settings</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Business profile and channels</div>
          </div>
          <a className="chip" href="/inbox">Back to Inbox</a>
        </header>
        <div className="metrics metrics-single">
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
          <article className="card received">
            <div className="label">Billing (Paystack test mode)</div>
            <p className="assignee" style={{ marginTop: '8px' }}>
              Test Premium Upgrade — ₦100.00 test charge to exercise the payment flow.
              Test payments never activate a real subscription.
            </p>
            <button className="send" type="button" disabled={billingBusy} style={{ width: '100%', marginTop: '10px' }} onClick={startCheckout}>
              {billingBusy ? 'Working…' : 'Test Premium Upgrade'}
            </button>
            {billingMsg ? <p className="assignee" style={{ marginTop: '8px' }}>{billingMsg}</p> : null}
            {payments.length > 0 ? (
              <div className="conv-list" style={{ marginTop: '10px' }}>
                {payments.map((p) => (
                  <div key={p.id} className="conv" style={{ cursor: 'default' }}>
                    <div className="conv-top">
                      <strong>{formatAmount(p.amountKobo, p.currency)}</strong>
                      <span className="status">{p.status}{p.isTest ? ' · test' : ''}</span>
                    </div>
                    <div className="preview">{p.reference}</div>
                    {p.status === 'PENDING' ? (
                      <button className="chip" type="button" disabled={billingBusy} onClick={() => verifyPayment(p.reference)}>
                        Verify
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </article>
          <SavedRepliesCard canManage={user?.role === 'OWNER' || user?.role === 'MANAGER'} />
          <BrandingCard canManage={user?.role === 'OWNER' || user?.role === 'MANAGER'} />
          <WebsiteCard canManage={user?.role === 'OWNER' || user?.role === 'MANAGER'} workspaceId={data?.workspace.id ?? null} />
          <ReplyControlsCard canManage={user?.role === 'OWNER' || user?.role === 'MANAGER'} />
          <ApprovalsCard canReview={user?.role === 'OWNER' || user?.role === 'MANAGER'} />
          <MacrosCard
            canManage={user?.role === 'OWNER' || user?.role === 'MANAGER'}
            currentUserId={user?.id ?? null}
          />
          <article className="card received">
            <div className="label">Channel connections</div>
            <div className="conv-list" style={{ marginTop: '10px' }}>
              {CHANNELS.map((ch) => (
                <div key={ch} className="conv" style={{ cursor: 'default' }}>
                  <div className="conv-top">
                    <strong>{ch}</strong>
                    <span className="status">Not connected yet</span>
                  </div>
                  <div className="preview">Official connection arrives in a later phase.</div>
                </div>
              ))}
            </div>
            <p className="assignee" style={{ marginTop: '8px' }}>
              No channel or storage integration is connected yet. Payments above run in
              Paystack test mode only and move no real money.
            </p>
          </article>
          <article className="card received">
            <div className="label">WhatsApp Cost &amp; Safety Centre</div>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <span className="status">No WhatsApp account connected</span>
            </p>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <strong>How WhatsApp business messaging works.</strong> Businesses reply free
              inside an open 24-hour customer-service window. Starting a conversation
              outside the window — or sending bulk notifications — uses pre-approved
              message templates, which Meta bills per message.
            </p>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <strong>Estimates, not charges.</strong> No live usage exists yet, so every
              figure here is illustrative. Real per-message rates depend on your country,
              template category (utility, marketing or authentication) and Meta&apos;s
              current pricing. Nothing below is a bill.
            </p>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <strong>Sending limits &amp; trust.</strong> New numbers start with low
              throughput and earn higher limits with quality history. Limits will be shown
              per business once an account is connected; nothing is enforced yet.
            </p>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <strong>Stay safe.</strong> Always honour opt-outs, never spam, keep
              templates truthful, and warm new numbers gradually. Poor quality ratings
              can restrict or ban a number.
            </p>
            <p className="auth-alt" style={{ marginTop: '8px' }}>
              Official docs:{' '}
              <a href="https://developers.facebook.com/docs/whatsapp/pricing" target="_blank" rel="noreferrer">Pricing</a>
              {' · '}
              <a href="https://developers.facebook.com/docs/whatsapp/conversation-types" target="_blank" rel="noreferrer">Conversation types</a>
              {' · '}
              <a href="https://developers.facebook.com/docs/whatsapp/message-templates" target="_blank" rel="noreferrer">Templates</a>
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
