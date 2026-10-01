'use client';

import { useState, useCallback, useEffect } from 'react';
import { Conversation, Channel } from '@/types/conversation';
import { mockConversations, initialUnansweredIds } from '@/data/mockConversations';

type Filter = 'all' | Channel;

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

export function useInbox(): UseInboxReturn {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [unansweredIds, setUnansweredIds] = useState<Set<string>>(initialUnansweredIds);
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
    const trimmedText = text.trim();
    if (!trimmedText) return;

    setConversations(prev => prev.map(c => {
      if (c.id !== selectedId) return c;
      return {
        ...c,
        messages: [...c.messages, { who: 'Ayo Sanwo', role: 'staff' as const, text: trimmedText }],
        preview: trimmedText,
        status: 'In progress' as const,
        statusClass: 'in-progress',
      };
    }));
    setUnansweredIds(prev => {
      const next = new Set(prev);
      next.delete(selectedId);
      return next;
    });
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