'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';

interface MenuItem {
  href: string;
  icon: string;
  name: string;
  description: string;
}

interface MenuGroup {
  heading: string;
  items: MenuItem[];
}

const GROUPS: MenuGroup[] = [
  {
    heading: 'Business',
    items: [
      { href: '/settings/profile', icon: '🏢', name: 'Business profile', description: 'Name, industry and owner' },
      { href: '/settings/branding', icon: '🎨', name: 'Branding', description: 'Logo, themes and colours' },
      { href: '/settings/website', icon: '🌐', name: 'Website page', description: 'The public page customers see' },
    ],
  },
  {
    heading: 'Replies',
    items: [
      { href: '/settings/replies', icon: '💬', name: 'Saved replies', description: 'Approved answers to reuse' },
      { href: '/settings/macros', icon: '⚡', name: 'Macros', description: 'One tap: text plus actions' },
      { href: '/settings/controls', icon: '🎛️', name: 'Reply controls', description: 'Tone, auto-replies and approvals' },
      { href: '/settings/approvals', icon: '✅', name: 'Approvals', description: 'Replies waiting for review' },
    ],
  },
  {
    heading: 'Channels',
    items: [
      { href: '/settings/whatsapp', icon: '🟢', name: 'WhatsApp connection', description: 'Link the test number' },
      { href: '/settings/channels', icon: '🔌', name: 'Other channels', description: 'Status of every channel' },
      { href: '/settings/safety', icon: '🛡️', name: 'WhatsApp safety', description: 'Costs, limits and safe sending' },
    ],
  },
  {
    heading: 'Workspace',
    items: [
      { href: '/settings/billing', icon: '💳', name: 'Billing', description: 'Test payments and history' },
      { href: '/settings/ownership', icon: '🔑', name: 'Ownership', description: 'Hand over to a new owner' },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useSessionUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Paystack returns here after checkout (?payment=callback&reference=…).
    // The billing sub-page owns verification — forward it there untouched.
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'callback') {
      window.location.replace(`/settings/billing?${params.toString()}`);
    }
  }, []);

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
          {GROUPS.map((g) => (
            <section key={g.heading} aria-label={g.heading}>
              <p className="menu-group">{g.heading}</p>
              <nav className="menu-list" aria-label={`${g.heading} settings`}>
                {g.items.map((item) => (
                  <a key={item.href} className="menu-row" href={item.href}>
                    <span className="menu-icon" aria-hidden="true">{item.icon}</span>
                    <span className="menu-text">
                      <strong>{item.name}</strong>
                      <span className="assignee">{item.description}</span>
                    </span>
                    <span className="menu-arrow" aria-hidden="true">›</span>
                  </a>
                ))}
              </nav>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
