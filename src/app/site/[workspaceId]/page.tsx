'use client';

import { useEffect, useState } from 'react';

interface Business {
  id: string;
  name: string;
  description: string | null;
  products: string | null;
  hours: string | null;
  contact: string | null;
  theme: string;
  accentColor: string | null;
  logoUrl: string | null;
  chatUrl: string;
}

export default function SitePage({ params }: { params: { workspaceId: string } }) {
  const [biz, setBiz] = useState<Business | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/sites/${encodeURIComponent(params.workspaceId)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json) => setBiz((json as { business: Business }).business))
      .catch(() => setMissing(true));
  }, [params.workspaceId]);

  useEffect(() => {
    if (!biz) return;
    const shell = document.getElementById('site-shell');
    if (shell) {
      if (biz.theme && biz.theme !== 'NAVY') shell.dataset.theme = biz.theme;
      else shell.removeAttribute('data-theme');
      if (biz.accentColor) {
        shell.setAttribute('data-accent', '1');
        shell.style.setProperty('--accent', biz.accentColor);
        shell.style.setProperty('--accent-deep', biz.accentColor);
      }
    }
  }, [biz]);

  if (missing) {
    return (
      <div className="site" id="site-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--off-white)', color: 'var(--ink)' }}>
        <p className="assignee">This business page is unavailable.</p>
      </div>
    );
  }
  if (!biz) {
    return (
      <div className="site" id="site-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--off-white)', color: 'var(--ink)' }}>
        <p className="assignee">Loading…</p>
      </div>
    );
  }

  return (
    <div className="site" id="site-shell" style={{ minHeight: '100vh', background: 'var(--off-white)', color: 'var(--ink)' }}>
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <header style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {biz.logoUrl ? (
            <img src={biz.logoUrl} alt={`${biz.name} logo`} style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'contain', background: '#fff', border: '1px solid var(--line)' }} />
          ) : (
            <div className="logo" style={{ width: '64px', height: '64px', fontSize: '1.4rem' }}>{biz.name.trim().charAt(0).toUpperCase()}</div>
          )}
          <div>
            <h1 style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{biz.name}</h1>
            <p className="assignee">Official page — chat with us below</p>
          </div>
        </header>
        {biz.description ? (
          <section className="card received"><div className="label">About</div><p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{biz.description}</p></section>
        ) : null}
        {biz.products ? (
          <section className="card received"><div className="label">Products &amp; services</div><p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{biz.products}</p></section>
        ) : null}
        {(biz.hours || biz.contact) ? (
          <section className="card received">
            <div className="label">Visit or contact</div>
            {biz.hours ? <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>🕒 {biz.hours}</p> : null}
            {biz.contact ? <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>📞 {biz.contact}</p> : null}
          </section>
        ) : null}
        <a className="send" href={biz.chatUrl} style={{ textAlign: 'center', textDecoration: 'none', display: 'block', padding: '14px' }}>
          Chat with {biz.name}
        </a>
        <p className="assignee" style={{ textAlign: 'center' }}>No account or download needed — opens a private chat.</p>
      </main>
    </div>
  );
}
