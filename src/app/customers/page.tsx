'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Badge } from '@/components/UI/Badge';
import { channelLabel, Conversation } from '@/types/conversation';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';

interface CustomerSummary {
  id: string;
  name: string;
  contactDetail: string | null;
  channels: string[];
  conversationCount: number;
  openCount: number;
  lastActive: string;
}

interface CustomerDetail extends CustomerSummary {
  conversations: Conversation[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isListMode, setIsListMode] = useState(true);
  const { user } = useSessionUser();

  useEffect(() => {
    fetch('/api/customers')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/sign-in';
          throw new Error('Sign in required.');
        }
        if (!res.ok) throw new Error('Customers request failed.');
        return res.json();
      })
      .then((data) => {
        setCustomers(data as CustomerSummary[]);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  function selectCustomer(id: string) {
    setSelectedId(id);
    setDetail(null);
    setIsListMode(false);
    setIsMobileMenuOpen(false);
    fetch(`/api/customers/${id}`)
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/sign-in';
          throw new Error('Sign in required.');
        }
        if (!res.ok) throw new Error('Customer request failed.');
        return res.json();
      })
      .then((data) => setDetail(data as CustomerDetail))
      .catch(() => {});
  }

  if (loadState === 'loading') {
    return (
      <div className="app" id="app">
        <section className="main">
          <div className="thread-wrap">
            <div className="thread-head">
              <div>
                <h3>Loading customers…</h3>
                <div className="assignee">Fetching customer records from the database.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="app" id="app">
        <section className="main">
          <div className="thread-wrap">
            <div className="thread-head">
              <div>
                <h3>Customers unavailable</h3>
                <div className="assignee">Could not load customers. Is the database running?</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`app ${isListMode ? 'list-mode' : ''}`} id="app">
      <Navigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        totalCount={customers.reduce((n, c) => n + c.conversationCount, 0)}
        active="customers"
        userName={user?.name ?? 'Business Paddy'}
        userSub={user ? `${roleLabel(user.role)} · ${user.workspaceName}` : 'Shared inbox'}
      />
      <section className="inbox" id="inbox">
        <div className="inbox-head">
          <h2>Customers <span className="status">Demo data</span></h2>
          <p>Combined histories across every connected channel</p>
        </div>
        <div className="conv-list" id="convList">
          {customers.map((c) => (
            <button
              key={c.id}
              className={`conv${c.id === selectedId ? ' selected' : ''}`}
              type="button"
              onClick={() => selectCustomer(c.id)}
            >
              <div className="conv-top">
                <strong>{c.name}</strong>
                <span className="time">{c.lastActive}</span>
              </div>
              <div className="preview">{c.contactDetail ?? 'No contact detail'}</div>
              <div className="conv-meta">
                <span>
                  {c.channels.map((ch) => (
                    <Badge key={ch} variant={ch as 'whatsapp' | 'instagram' | 'email' | 'tiktok'}>
                      {channelLabel[ch as keyof typeof channelLabel]}
                    </Badge>
                  ))}{' '}
                  <span className="status">
                    {c.conversationCount} conversation{c.conversationCount === 1 ? '' : 's'} · {c.openCount} open
                  </span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="main">
        <header className="topbar">
          <button className="menu-btn" id="menuBtn" type="button" onClick={() => setIsMobileMenuOpen(true)}>Menu</button>
          <div>
            <strong>{detail ? detail.name : 'Customer history'}</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
              {detail
                ? `${detail.contactDetail ?? 'No contact detail'}`
                : 'Select a customer to see every conversation'}
            </div>
          </div>
          <button className="chip" id="backBtn" type="button" onClick={() => setIsListMode(true)}>Customer list</button>
        </header>
        <div className="messages" style={{ flex: 1, overflow: 'auto' }}>
          {!selectedId ? <p className="assignee">Choose a customer from the list.</p> : null}
          {selectedId && !detail ? <p className="assignee">Loading history…</p> : null}
          {detail?.conversations.map((conv) => (
            <div key={conv.id} className="thread-wrap" style={{ margin: '0 0 12px' }}>
              <div className="thread-head">
                <div>
                  <h3>{channelLabel[conv.channel]} conversation</h3>
                  <div className="assignee">{conv.status} · Assigned to {conv.assignee}</div>
                </div>
                <div>
                  <Badge variant={conv.channel}>{channelLabel[conv.channel]}</Badge>{' '}
                  <Badge variant="status" statusType={conv.statusClass}>{conv.status}</Badge>
                </div>
              </div>
              <div className="messages">
                {conv.messages.map((m, i) => (
                  <div key={i} className={`bubble ${m.role === 'staff' ? 'staff' : 'customer'}`}>
                    <div className="who">{m.who}</div>
                    {m.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
