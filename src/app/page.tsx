'use client';

import { useInbox } from '@/hooks/useInbox';
import { Navigation } from '@/components/Navigation';
import { InboxList } from '@/components/InboxList';
import { MetricCards } from '@/components/MetricCards';
import { ConversationThread } from '@/components/ConversationThread';

export default function InboxPage() {
  const {
    conversations,
    unansweredIds,
    filter,
    selectedId,
    setFilter,
    selectConversation,
    sendReply,
    toggleMobileMenu,
    closeMobileMenu,
    goBackToList,
    isMobileMenuOpen,
    isListMode,
  } = useInbox();

  const answered = conversations.length - unansweredIds.size;

  return (
    <div className={`app ${isListMode ? 'list-mode' : ''}`} id="app">
      <Navigation
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        totalCount={conversations.length}
      />
      <InboxList
        conversations={conversations}
        filter={filter}
        selectedId={selectedId}
        onFilterChange={setFilter}
        onConversationClick={selectConversation}
      />
      <section className="main">
        <header className="topbar">
          <button className="menu-btn" id="menuBtn" type="button" onClick={toggleMobileMenu}>Menu</button>
          <div>
            <strong>Owner performance</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Today · Lagos Market Hub</div>
          </div>
          <button className="chip" id="backBtn" type="button" onClick={goBackToList}>Inbox list</button>
        </header>
        <MetricCards
          total={conversations.length}
          answered={answered}
          unanswered={unansweredIds.size}
        />
        <ConversationThread
          conversation={conversations.find(c => c.id === selectedId)}
          onSendReply={sendReply}
        />
      </section>
    </div>
  );
}