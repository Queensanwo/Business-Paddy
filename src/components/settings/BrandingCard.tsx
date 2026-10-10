'use client';

import { useEffect, useState } from 'react';

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

export function BrandingCard({ canManage }: { canManage: boolean }) {
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
