'use client';

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
}

export function InboxList({ conversations, unansweredIds, filter, selectedId, onFilterChange, onConversationClick }: InboxListProps) {
  const filteredConversations = conversations.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'unanswered') return unansweredIds.has(c.id);
    return c.channel === filter;
  });

  return (
    <section className="inbox" id="inbox">
      <div className="inbox-head">
        <h2>All conversations <span className="status">Demo data</span></h2>
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