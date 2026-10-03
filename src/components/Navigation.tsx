'use client';

export type NavSection = 'inbox' | 'customers' | 'team' | 'settings' | 'workspace';

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount?: number;
  active?: NavSection;
  userName?: string;
  userSub?: string;
}

export function Navigation({
  isOpen,
  onClose,
  totalCount = 0,
  active = 'inbox',
  userName = 'Business Paddy',
  userSub = 'Shared inbox',
}: NavigationProps) {
  return (
    <>
      <div className={`overlay ${isOpen ? 'show' : ''}`} onClick={onClose} id="overlay" />
      <aside className={`nav ${isOpen ? 'open' : ''}`} id="nav">
        <div className="brand">
          <div className="logo">BP</div>
          <div>
            <h1>Business Paddy</h1>
            <p>Shared inbox</p>
          </div>
        </div>
        <nav className="nav-links">
          <a className={active === 'inbox' ? 'active' : ''} href="/">Inbox{totalCount > 0 ? <span className="count">{totalCount}</span> : null}</a>
          <a className={active === 'customers' ? 'active' : ''} href="/customers">Customers</a>
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