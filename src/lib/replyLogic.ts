import { Conversation, StatusClass } from '../types/conversation';

export interface InboxState {
  conversations: Conversation[];
  unansweredIds: Set<string>;
}

/**
 * Applies a staff reply to the selected conversation.
 *
 * Rules (reply-counting contract):
 * 1. Empty text or unknown id -> state unchanged (same refs, no recount).
 * 2. First reply to an unanswered conversation -> removed from the
 *    unanswered set exactly once; status becomes 'In progress'.
 * 3. Repeat replies to an already-answered conversation -> message is
 *    appended, but the unanswered set and existing status are untouched,
 *    so the Answered count never increases twice.
 * 4. The conversation object is always kept (never deleted), so it stays
 *    visible under 'All' and under its channel filter.
 */
export function applyReply(
  state: InboxState,
  selectedId: string,
  text: string,
  sender = 'Ayo Sanwo',
): InboxState {
  const trimmed = text.trim();
  if (!trimmed) return state;

  const target = state.conversations.find((c) => c.id === selectedId);
  if (!target) return state;

  const wasUnanswered = state.unansweredIds.has(selectedId);

  const conversations = state.conversations.map((c) => {
    if (c.id !== selectedId) return c;
    const updated: Conversation = {
      ...c,
      messages: [...c.messages, { who: sender, role: 'staff' as const, text: trimmed }],
      preview: trimmed,
    };
    if (!wasUnanswered) return updated;
    return {
      ...updated,
      status: 'In progress' as const,
      statusClass: 'in-progress' as StatusClass,
    };
  });

  let unansweredIds = state.unansweredIds;
  if (wasUnanswered) {
    const next = new Set<string>(state.unansweredIds);
    next.delete(selectedId);
    unansweredIds = next;
  }

  return { conversations, unansweredIds };
}
