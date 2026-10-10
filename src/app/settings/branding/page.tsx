'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';
import { BrandingCard } from '@/components/settings/BrandingCard';

export default function BrandingSettingsPage() {
  const { user } = useSessionUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <button className="menu-btn" type="button" onClick={() => setIsMobileMenuOpen(true)}>Menu</button>
          <div>
            <strong>Branding</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Logo, themes and colours</div>
          </div>
          <a className="chip" href="/settings">Back</a>
        </header>
        <div className="metrics metrics-single">
          <BrandingCard canManage={user?.role === 'OWNER' || user?.role === 'MANAGER'} />
        </div>
      </section>
    </div>
  );
}
