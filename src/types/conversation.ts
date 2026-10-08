export type Channel = 'whatsapp' | 'instagram' | 'email' | 'tiktok' | 'paddy_chat';

export type Status = 'New' | 'In progress' | 'Waiting for customer' | 'Follow up' | 'Escalated' | 'Resolved';

export type Role = 'customer' | 'staff';

export type StatusClass = 'new' | 'in-progress' | 'waiting' | 'follow-up' | 'escalated' | 'resolved';

export type InboxFilter = 'all' | 'unanswered' | Channel;

export interface MessageAttachment {
  id: string;
  fileName: string;
  mimeType: string;
}

export interface Message {
  who: string;
  role: Role;
  text: string;
  kind?: string;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  name: string;
  channel: Channel;
  status: Status;
  statusClass: StatusClass;
  time: string;
  preview: string;
  assignee: string;
  assigneeId?: string | null;
  messages: Message[];
}

export const channelLabel: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  email: 'Email',
  tiktok: 'TikTok',
  paddy_chat: 'Paddy Chat',
};

export const statusClassMap: Record<Status, string> = {
  'New': 'new',
  'In progress': 'in-progress',
  'Waiting for customer': 'waiting',
  'Follow up': 'follow-up',
  'Escalated': 'escalated',
  'Resolved': 'resolved',
};