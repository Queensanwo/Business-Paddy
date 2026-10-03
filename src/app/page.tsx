'use client';

import { useInbox } from '@/hooks/useInbox';
import { authClient } from '@/lib/auth-client';
import { Navigation } from '@/components/Navigation';
import { InboxList } from '@/components/InboxList';
import { MetricCards } from '@/components/MetricCards';
import { ConversationThread } from '@/components/ConversationThread';

async function signOut() {
  await authClient.signOut();
  window.location.href = '/sign-in';
}

export default function InboxPage() {
  const {
    conversations,
    unansweredIds,
    filter,
    selectedId,
    loadState,
    loadError,
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

  if (loadState === 'loading') {
    return (
      <div className="app" id="app">
        <section className="main">
          <div className="thread-wrap">
            <div className="thread-head">
              <div>
                <h3>Loading inbox…</h3>
                <div className="assignee">Fetching conversations from the database.</div>
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
                <h3>Inbox unavailable</h3>
                <div className="assignee">{loadError}</div>
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
        onClose={closeMobileMenu}
        totalCount={conversations.length}
      />
      <InboxList
        conversations={conversations}
        unansweredIds={unansweredIds}
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
          <button className="chip" type="button" onClick={signOut}>Sign out</button>
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