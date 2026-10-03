'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Badge } from '@/components/UI/Badge';
import { authClient } from '@/lib/auth-client';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';

async function signOut() {
  await authClient.signOut();
  window.location.href = '/sign-in';
}

export default function WorkspacePage() {
  const { user } = useSessionUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app app-single" id="app">
      <Navigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        active="workspace"
        userName={user?.name ?? 'Business Paddy'}
        userSub={user ? `${roleLabel(user.role)} · ${user.workspaceName}` : 'Shared inbox'}
      />
      <section className="main">
        <header className="topbar">
          <button className="menu-btn" id="menuBtn" type="button" onClick={() => setIsMobileMenuOpen(true)}>Menu</button>
          <div>
            <strong>Workspace</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Your business and sign-in</div>
          </div>
        </header>
        <div className="metrics metrics-single">
          <article className="card received">
            <div className="label">Business</div>
            <div className="value" style={{ fontSize: '1.3rem' }}>{user?.workspaceName ?? 'Loading…'}</div>
            <p className="assignee" style={{ marginTop: '8px' }}>
              {user ? (
                <>
                  Signed in as {user.name} ({user.email}) — {roleLabel(user.role)}.{' '}
                  <Badge variant="status" statusType={user.workspaceMode === 'LIVE' ? 'in-progress' : 'new'}>
                    {user.workspaceMode === 'LIVE' ? 'Live mode' : 'Demo mode'}
                  </Badge>
                </>
              ) : (
                'Loading workspace…'
              )}
            </p>
            <p className="assignee" style={{ marginTop: '8px' }}>
              <button className="chip" type="button" onClick={signOut}>Sign out</button>
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
