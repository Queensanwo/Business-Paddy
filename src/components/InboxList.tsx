'use client';
import { useState } from 'react';

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
  onOpenMenu?: () => void;
}

export function InboxList({ conversations, unansweredIds, filter, selectedId, onFilterChange, onConversationClick, demoMode, onOpenMenu }: InboxListProps) {
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState('');
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
    if (filter === 'all') return true;
    if (filter === 'unanswered') return unansweredIds.has(c.id);
    return c.channel === filter;
  });

  return (
    <section className="inbox" id="inbox">
      <div className="inbox-head">
        <button className="menu-btn" type="button" onClick={onOpenMenu} aria-label="Open navigation for Team, Settings and Workspace" aria-controls="nav">Menu</button>
        <h2>All conversations{demoMode ? <span className="status">Demo — no real messages are sent</span> : null}</h2>
        <p>WhatsApp, Instagram, TikTok, email, Paddy Chat and Facebook in one place</p>
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
        {filteredConversations.length === 0 ? (
          <div style={{ padding: '24px 16px', color: 'var(--muted)' }} role="status">
            <strong>No conversations here yet</strong>
            <p>{filter === 'all' ? 'Open Menu to find your Team, Settings and channel connections.' : 'Try another channel or select All to see your conversations.'}</p>
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
            <div className="conv-top">
              <strong>{c.name}</strong>
              <span className="time">{c.time}</span>
            </div>
            <div className="preview">{c.preview}</div>
            <div className="conv-meta">
              <Badge variant={c.channel}>{channelLabel[c.channel]}</Badge>
              <Badge variant="status" statusType={c.statusClass}>{c.status}</Badge>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
