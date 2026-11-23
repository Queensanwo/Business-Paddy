'use client';
import { useState } from 'react';
import Link from 'next/link';

import { Conversation, channelLabel, InboxFilter } from '@/types/conversation';
import { Chip } from '@/components/UI/Chip';
import { Badge } from '@/components/UI/Badge';

interface InboxListProps {
  conversations: Conversation[];
  unansweredIds: Set<string>;
  filter: InboxFilter;
  selectedId: string;
  onFilterChange: (filter: InboxFilter) => void;
  onConversationClick: (id: string) => void;
  demoMode?: boolean;
  canManageChannels?: boolean;
  onOpenMenu?: () => void;
}

export function InboxList({ conversations, unansweredIds, filter, selectedId, onFilterChange, onConversationClick, demoMode, canManageChannels, onOpenMenu }: InboxListProps) {
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [search, setSearch] = useState('');
  async function loadSamples() {
    setDemoBusy(true);
    setDemoError('');
    try {
      const response = await fetch('/api/inbox/demo', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load sample conversations.');
      window.location.reload();
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : 'Could not load samples.');
      setDemoBusy(false);
    }
  }
  const filteredConversations = conversations.filter((c) => {
    if (search.trim() && !`${c.name} ${c.preview}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) return false;
    if (filter === 'all') return true;
    if (filter === 'unanswered') return unansweredIds.has(c.id);
    return c.channel === filter;
  });
  const showWhatsAppSetup = canManageChannels && (filter === 'whatsapp' || filter === 'all') && !conversations.some((c) => c.channel === 'whatsapp');

  return (
    <section className="inbox" id="inbox">
      <div className="inbox-head">
        <button className="menu-btn" type="button" onClick={onOpenMenu} aria-label="Open navigation for Team, Settings and Workspace" aria-controls="nav">Menu</button>
        <div className="inbox-title"><h2>Conversations</h2><span className="inbox-count">{conversations.length}</span></div>
        {demoMode ? <span className="status">Demo — no real messages are sent</span> : null}
        <p>Every customer. One thoughtful reply.</p>
        <label className="inbox-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations…" aria-label="Search conversations" /></label>
        <div className="filters" id="filters">
          <Chip data-filter="all" active={filter === 'all'} onClick={() => onFilterChange('all')}>All</Chip>
          <Chip data-filter="whatsapp" active={filter === 'whatsapp'} onClick={() => onFilterChange('whatsapp')}>WhatsApp</Chip>
          <Chip data-filter="instagram" active={filter === 'instagram'} onClick={() => onFilterChange('instagram')}>Instagram</Chip>
          <Chip data-filter="email" active={filter === 'email'} onClick={() => onFilterChange('email')}>Email</Chip>
          <Chip data-filter="tiktok" active={filter === 'tiktok'} onClick={() => onFilterChange('tiktok')}>TikTok</Chip>
          <Chip data-filter="unanswered" active={filter === 'unanswered'} onClick={() => onFilterChange('unanswered')}>Unanswered</Chip>
          <Chip data-filter="paddy_chat" active={filter === 'paddy_chat'} onClick={() => onFilterChange('paddy_chat')}>Paddy Chat</Chip>
          <Chip data-filter="facebook" active={filter === 'facebook'} onClick={() => onFilterChange('facebook')}>Facebook</Chip>
        </div>
      </div>
      <div className="conv-list" id="convList">
        {showWhatsAppSetup ? (
          <div className="inbox-connection">
            <Link href="/settings/whatsapp" className="chip">WhatsApp connection settings</Link>
            <p className="assignee" style={{ marginTop: '6px' }}>
              {demoMode ? 'A Live workspace is required to receive real messages.' : 'Check your connection status in Settings. Incoming WhatsApp conversations will appear here.'}
            </p>
          </div>
        ) : null}
        {filteredConversations.length === 0 ? (
          <div className="inbox-empty" role="status">
            <div className="inbox-empty-icon" aria-hidden="true">↗</div>
            <strong>{search ? 'No matching conversations' : 'A fresh start for your inbox'}</strong>
            <p>{search ? 'Try a different name or message.' : filter === 'all' ? 'Your incoming customer messages will appear here, ready for a personal reply.' : 'No conversations in this view yet. Choose All to see other channels.'}</p>
            {demoMode && conversations.length === 0 ? (
              <div style={{ marginTop: '12px' }}>
                <button className="chip" type="button" onClick={loadSamples} disabled={demoBusy}>{demoBusy ? 'Loading samples…' : 'Load sample demo conversations'}</button>
                <p>Fictional customers for your presentation. No accounts are connected.</p>
                {demoError ? <p role="alert">{demoError}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {filteredConversations.map(c => (
          <button
            key={c.id}
            className={`conv ${c.id === selectedId ? 'selected' : ''}`}
            type="button"
            onClick={() => onConversationClick(c.id)}
          >
            <span className="conv-avatar" aria-hidden="true">{c.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
            <div className="conv-content"><div className="conv-top">
              <strong>{c.name}</strong>
              <span className="time">{c.time}</span>
            </div>
            <div className="preview">{c.preview}</div>
            <div className="conv-meta">
              <Badge variant={c.channel}>{channelLabel[c.channel]}</Badge>
              <Badge variant="status" statusType={c.statusClass}>{c.status}</Badge>
            </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
