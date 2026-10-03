'use client';

import { useState, useCallback, useEffect } from 'react';
import { Conversation, InboxFilter } from '@/types/conversation';
import { InboxState, applyReply } from '@/lib/replyLogic';

type Filter = InboxFilter;

interface InboxPayload {
  conversations: Conversation[];
  unansweredIds: string[];
}

interface UseInboxReturn {
  conversations: Conversation[];
  unansweredIds: Set<string>;
  filter: Filter;
  selectedId: string;
  loadState: 'loading' | 'ready' | 'error';
  loadError: string;
  setFilter: (filter: Filter) => void;
  selectConversation: (id: string) => void;
  sendReply: (text: string, attachments?: { storageKey: string; fileName: string; mimeType: string; sizeBytes: number }[]) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  goBackToList: () => void;
  isMobileMenuOpen: boolean;
  isListMode: boolean;
}

function toState(payload: InboxPayload): InboxState {
  return {
    conversations: payload.conversations,
    unansweredIds: new Set(payload.unansweredIds),
  };
}

function redirectToSignIn() {
  if (typeof window !== 'undefined') window.location.href = '/sign-in';
}

async function fetchInbox(): Promise<InboxState> {
  const res = await fetch('/api/inbox');
  if (res.status === 401) {
    redirectToSignIn();
    throw new Error('Sign in required.');
  }
  if (!res.ok) throw new Error('Inbox request failed.');
  return toState((await res.json()) as InboxPayload);
}

export function useInbox(): UseInboxReturn {
  const [inbox, setInbox] = useState<InboxState>({ conversations: [], unansweredIds: new Set() });
  const { conversations, unansweredIds } = inbox;
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string>('c2');
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isListMode, setIsListMode] = useState(true);

  useEffect(() => {
    fetchInbox()
      .then((state) => {
        setInbox(state);
        setLoadState('ready');
      })
      .catch(() => {
        setLoadError('Could not load conversations. Is the database running?');
        setLoadState('error');
      });
  }, []);

  const selectConversation = useCallback((id: string) => {
    setSelectedId(id);
    setIsListMode(false);
    setIsMobileMenuOpen(false);
  }, []);

  const sendReply = useCallback(
    (
      text: string,
      attachments: { storageKey: string; fileName: string; mimeType: string; sizeBytes: number }[] = [],
    ) => {
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) return;
      // Optimistic update for instant feedback, then reconcile with the server.
      setInbox((prev) => applyReply(prev, selectedId, trimmed || '(attachment)'));
      fetch('/api/inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedId, text: trimmed, attachments }),
      })
        .then(async (res) => {
          if (res.status === 401) {
            redirectToSignIn();
            throw new Error('Sign in required.');
          }
          if (!res.ok) throw new Error('Reply request failed.');
          setInbox(toState((await res.json()) as InboxPayload));
        })
        .catch(() => {
          // Roll back to the persisted state on failure.
          fetchInbox()
            .then(setInbox)
            .catch(() => {});
        });
    },
    [selectedId],
  );

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const goBackToList = useCallback(() => {
    setIsListMode(true);
  }, []);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsListMode(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
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
  };
}