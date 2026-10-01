'use client';

import { useState, useCallback, useEffect } from 'react';
import { Conversation, InboxFilter } from '@/types/conversation';
import { mockConversations, initialUnansweredIds } from '@/data/mockConversations';
import { InboxState, applyReply } from '@/lib/replyLogic';

type Filter = InboxFilter;

interface UseInboxReturn {
  conversations: Conversation[];
  unansweredIds: Set<string>;
  filter: Filter;
  selectedId: string;
  setFilter: (filter: Filter) => void;
  selectConversation: (id: string) => void;
  sendReply: (text: string) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  goBackToList: () => void;
  isMobileMenuOpen: boolean;
  isListMode: boolean;
}

function freshInitialState(): InboxState {
  return {
    conversations: mockConversations.map((c) => ({ ...c, messages: [...c.messages] })),
    unansweredIds: new Set(initialUnansweredIds),
  };
}

export function useInbox(): UseInboxReturn {
  const [inbox, setInbox] = useState<InboxState>(freshInitialState);
  const { conversations, unansweredIds } = inbox;
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string>('c2');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isListMode, setIsListMode] = useState(true);

  const selectConversation = useCallback((id: string) => {
    setSelectedId(id);
    setIsListMode(false);
    setIsMobileMenuOpen(false);
  }, []);

  const sendReply = useCallback((text: string) => {
    setInbox((prev) => applyReply(prev, selectedId, text));
  }, [selectedId]);

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