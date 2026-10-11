'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';
import { ChannelsCard } from '@/components/settings/ChannelsCard';

export default function ChannelsSettingsPage() {
  const { user } = useSessionUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // Google OAuth lands back here (?google=connected|error).
    const params = new URLSearchParams(window.location.search);
    const kind = params.get('google');
    if (kind === 'connected') {
      const mailbox = params.get('mailbox') ?? '';
      setNotice(mailbox ? `Mailbox ${mailbox} connected.` : 'Mailbox connected.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (kind === 'error') {
      setNotice(params.get('message') || 'Google sign-in failed.');
      window.history.replaceState({}, '', window.location.pathname);
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
          <button className="menu-btn" type="button" onClick={() => setIsMobileMenuOpen(true)}>Menu</button>
          <div>
            <strong>Channels</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Status of every channel</div>
          </div>
          <a className="chip" href="/settings">Back</a>
        </header>
        <div className="metrics metrics-single">
          {notice ? <p className="assignee" style={{ padding: '0 4px' }}>{notice}</p> : null}
          <ChannelsCard canManage={user?.role === 'OWNER' || user?.role === 'MANAGER'} />
        </div>
      </section>
    </div>
  );
}
