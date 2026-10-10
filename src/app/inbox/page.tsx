'use client';

import { useEffect, useState } from 'react';
import { useInbox } from '@/hooks/useInbox';
import { useSessionUser, roleLabel } from '@/hooks/useSessionUser';
import { authClient } from '@/lib/auth-client';
import { Navigation } from '@/components/Navigation';
import { InboxList } from '@/components/InboxList';
import { MetricCards } from '@/components/MetricCards';
import { ConversationThread, AssignableStaff } from '@/components/ConversationThread';

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
    assignConversation,
    runMacro,
    requestAiDraft,
    submitApproval,
    decideApproval,
    addNote,
    resolveConversation,
    escalateConversation,
    changeStatus,
    toggleMobileMenu,
    closeMobileMenu,
    goBackToList,
    isMobileMenuOpen,
    isListMode,
  } = useInbox();
  const { user } = useSessionUser();
  const [staff, setStaff] = useState<AssignableStaff[]>([]);
  const [approvals, setApprovals] = useState<{ id: string; conversationId: string; text: string }[]>([]);
  const [dueReminders, setDueReminders] = useState(0);

  useEffect(() => {
    fetch('/api/team')
      .then((res) => {
        if (!res.ok) throw new Error('No team access.');
        return res.json();
      })
      .then((data) => setStaff((data as { users: AssignableStaff[] }).users ?? []))
      .catch(() => setStaff([]));
  }, []);

  const canReview = user?.role === 'OWNER' || user?.role === 'MANAGER';
  useEffect(() => {
    fetch('/api/reminders')
      .then((res) => (res.ok ? res.json() : { reminders: [] }))
      .then((json) => {
        const rows = (json as { reminders: { scheduledAt: string; status: string }[] }).reminders ?? [];
        const now = Date.now();
        setDueReminders(rows.filter((r) => (r.status === 'SCHEDULED' || r.status === 'SNOOZED') && new Date(r.scheduledAt).getTime() <= now).length);
      })
      .catch(() => {});
  }, [conversations.length]);
  useEffect(() => {
    if (!canReview) return;
    fetch('/api/approvals')
      .then((res) => (res.ok ? res.json() : { approvals: [] }))
      .then((json) => setApprovals((json as { approvals: { id: string; conversationId: string; text: string }[] }).approvals ?? []))
      .catch(() => {});
  }, [canReview, conversations.length]);

  const answered = conversations.length - unansweredIds.size;
  const canAssignOthers = user?.role === 'OWNER' || user?.role === 'MANAGER';

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
        reminderCount={dueReminders}
        active="inbox"
        userName={user?.name ?? 'Business Paddy'}
        userSub={user ? `${roleLabel(user.role)} · ${user.workspaceName}` : 'Shared inbox'}
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
        {canReview && approvals.length > 0 ? (
          <div className="card received" style={{ marginBottom: '10px' }}>
            <div className="label">Pending approvals ({approvals.length})</div>
            {approvals.slice(0, 5).map((a) => (
              <div key={a.id} className="conv" style={{ cursor: 'default' }}>
                <div className="preview" style={{ whiteSpace: 'normal' }}>{a.text.slice(0, 160)}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button className="chip" type="button" onClick={() => decideApproval(a.id, 'approve')}>
                    Approve &amp; send
                  </button>
                  <button className="chip" type="button" onClick={() => decideApproval(a.id, 'reject')}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <ConversationThread
          conversation={conversations.find(c => c.id === selectedId)}
          onSendReply={sendReply}
          onRunMacro={(macroId) => runMacro(selectedId, macroId)}
          onRequestAiDraft={() => requestAiDraft(selectedId)}
          onSubmitApproval={(text) => submitApproval(selectedId, text)}
          onAddNote={(text) => addNote(selectedId, text)}
          onResolve={resolveConversation}
          onEscalate={escalateConversation}
          onStatusChange={changeStatus}
          currentUserId={user?.id ?? null}
          canAssignOthers={canAssignOthers}
          staff={staff}
          onAssign={assignConversation}
        />
      </section>
    </div>
  );
}