'use client';

import { useEffect, useState } from 'react';

export type NavSection = 'inbox' | 'customers' | 'team' | 'settings' | 'workspace' | 'reminders' | 'reports';

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount?: number;
  reminderCount?: number;
  active?: NavSection;
  userName?: string;
  userSub?: string;
}

export function Navigation({
  isOpen,
  onClose,
  totalCount = 0,
  reminderCount = 0,
  active = 'inbox',
  userName = 'Business Paddy',
  userSub = 'Shared inbox',
}: NavigationProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Per-business branding: preset theme + optional custom accent + logo.
    // Scoped to the app shell (#app) so the landing page keeps its design.
    // Uploading a logo never changes the theme.
    fetch('/api/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const b = (json as { branding?: { theme?: string; accentColor?: string | null; logoUrl?: string | null } | null })?.branding;
        if (!b) return;
        const shell = document.getElementById('app');
        if (shell) {
          if (b.theme && b.theme !== 'NAVY') shell.dataset.theme = b.theme;
          else shell.removeAttribute('data-theme');
          if (b.accentColor) {
            shell.setAttribute('data-accent', '1');
            shell.style.setProperty('--accent', b.accentColor);
            shell.style.setProperty('--accent-deep', b.accentColor);
          } else {
            shell.removeAttribute('data-accent');
            shell.style.removeProperty('--accent');
            shell.style.removeProperty('--accent-deep');
          }
        }
        setLogoUrl(b.logoUrl ?? null);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className={`overlay ${isOpen ? 'show' : ''}`} onClick={onClose} id="overlay" />
      <aside className={`nav ${isOpen ? 'open' : ''}`} id="nav">
        <div className="brand">
          {logoUrl ? (
            <img className="brand-logo" src={logoUrl} alt="Business logo" />
          ) : (
            <div className="logo">BP</div>
          )}
          <div>
            <h1>Business Paddy</h1>
            <p>Shared inbox</p>
          </div>
        </div>
        <nav className="nav-links">
          <a className={active === 'inbox' ? 'active' : ''} href="/inbox">Inbox{totalCount > 0 ? <span className="count">{totalCount}</span> : null}</a>
          <a className={active === 'customers' ? 'active' : ''} href="/customers">Customers</a>
          <a className={active === 'reminders' ? 'active' : ''} href="/reminders">Reminders{reminderCount > 0 ? <span className="count">{reminderCount}</span> : null}</a>
          <a className={active === 'reports' ? 'active' : ''} href="/reports">Reports</a>
          <a className={active === 'team' ? 'active' : ''} href="/team">Team</a>
          <a className={active === 'settings' ? 'active' : ''} href="/settings">Settings</a>
          <a className={active === 'workspace' ? 'active' : ''} href="/workspace">Workspace</a>
        </nav>
        <div className="nav-foot">
          <strong>{userName}</strong>
          <span>{userSub}</span>
        </div>
      </aside>
    </>
  );
}