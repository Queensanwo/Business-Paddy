'use client';

import { Conversation, channelLabel, Channel } from '@/types/conversation';
import { Badge } from '@/components/UI/Badge';

interface ConversationThreadProps {
  conversation: Conversation | undefined;
  onSendReply: (text: string) => void;
}

export function ConversationThread({ conversation, onSendReply }: ConversationThreadProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('reply') as string;
    onSendReply(text);
    e.currentTarget.reset();
  };

  if (!conversation) {
    return (
      <div className="thread-wrap">
        <div className="thread-head">
          <div>
            <h3 id="custName">Select a conversation</h3>
            <div className="assignee" id="custMeta"></div>
          </div>
          <div id="custBadges"></div>
        </div>
        <div className="messages" id="messages"></div>
        <form className="composer" id="replyForm" onSubmit={handleSubmit}>
          <textarea id="replyBox" name="reply" placeholder="Write a reply the customer will see on their channel…" required></textarea>
          <button className="send" type="submit">Send Reply</button>
        </form>
      </div>
    );
  }

  return (
    <div className="thread-wrap">
      <div className="thread-head">
        <div>
          <h3 id="custName">{conversation.name}</h3>
          <div className="assignee" id="custMeta">
            {channelLabel[conversation.channel as Channel]} · {conversation.status} · Assigned to {conversation.assignee}
          </div>
        </div>
        <div id="custBadges">
          <Badge variant={conversation.channel}>{channelLabel[conversation.channel as Channel]}</Badge>
          <Badge variant="status" statusType={conversation.statusClass}>{conversation.status}</Badge>
        </div>
      </div>
      <div className="messages" id="messages">
        {conversation.messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role === 'staff' ? 'staff' : 'customer'}`}>
            <div className="who">{m.who}</div>
            {m.text}
          </div>
        ))}
      </div>
      <form className="composer" id="replyForm" onSubmit={handleSubmit}>
        <textarea id="replyBox" name="reply" placeholder="Write a reply the customer will see on their channel…" required></textarea>
        <button className="send" type="submit">Send Reply</button>
      </form>
    </div>
  );
}