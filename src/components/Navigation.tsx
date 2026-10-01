'use client';

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
}

export function Navigation({ isOpen, onClose, totalCount }: NavigationProps) {
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
          <a className="active" href="#inbox">Inbox <span className="count">{totalCount}</span></a>
          <a href="#customers">Customers</a>
          <a href="#team">Team</a>
          <a href="#settings">Settings</a>
        </nav>
        <div className="nav-foot">
          <strong>Ayo Sanwo</strong>
          <span>Owner · Lagos Market Hub</span>
        </div>
      </aside>
    </>
  );
}