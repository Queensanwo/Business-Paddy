export type Channel = 'whatsapp' | 'instagram' | 'email' | 'tiktok';

export type Status = 'New' | 'In progress' | 'Waiting for customer' | 'Follow up' | 'Escalated' | 'Resolved';

export type Role = 'customer' | 'staff';

export type StatusClass = 'new' | 'in-progress' | 'waiting' | 'follow-up' | 'escalated' | 'resolved';

export type InboxFilter = 'all' | 'unanswered' | Channel;

export interface Message {
  who: string;
  role: Role;
  text: string;
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
  messages: Message[];
}

export const channelLabel: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  email: 'Email',
  tiktok: 'TikTok',
};

export const statusClassMap: Record<Status, string> = {
  'New': 'new',
  'In progress': 'in-progress',
  'Waiting for customer': 'waiting',
  'Follow up': 'follow-up',
  'Escalated': 'escalated',
  'Resolved': 'resolved',
};