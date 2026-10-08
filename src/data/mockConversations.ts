import { Conversation, Channel, Status } from '@/types/conversation';

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    name: 'Ngozi Adeyemi',
    channel: 'whatsapp' as Channel,
    status: 'New' as Status,
    statusClass: 'new',
    time: '2 min',
    preview: 'Please, do you still have the Ankara set in size 14?',
    assignee: 'Unassigned',
    messages: [
      { who: 'Ngozi Adeyemi', role: 'customer', text: 'Good evening. Please, do you still have the Ankara set in size 14?' }
    ]
  },
  {
    id: 'c2',
    name: 'Ibrahim Musa',
    channel: 'instagram' as Channel,
    status: 'In progress' as Status,
    statusClass: 'in-progress',
    time: '18 min',
    preview: 'The brown sandals in your story — how much for two pairs?',
    assignee: 'Funke Bello',
    messages: [
      { who: 'Ibrahim Musa', role: 'customer', text: 'The brown sandals in your story — how much for two pairs?' },
      { who: 'Funke Bello', role: 'staff', text: 'Hi Ibrahim, two pairs are ₦28,000 including delivery in Abuja. Shall I hold them?' }
    ]
  },
  {
    id: 'c3',
    name: 'Chioma Okeke',
    channel: 'email' as Channel,
    status: 'Waiting for customer' as Status,
    statusClass: 'waiting',
    time: '1 hr',
    preview: 'Invoice 1042 — can you confirm the delivery address?',
    assignee: 'Ayo Sanwo',
    messages: [
      { who: 'Chioma Okeke', role: 'customer', text: 'Hello, I paid for order 1042 this morning. Can you confirm it will go to Enugu, Independence Layout?' },
      { who: 'Ayo Sanwo', role: 'staff', text: 'Chioma, thank you. Please reply with the street number and a landmark so we can book the rider.' }
    ]
  },
  {
    id: 'c4',
    name: 'Tunde Bakare',
    channel: 'whatsapp' as Channel,
    status: 'Follow up' as Status,
    statusClass: 'follow-up',
    time: 'Yesterday',
    preview: 'Has the wholesale crate of tomatoes arrived?',
    assignee: 'Funke Bello',
    messages: [
      { who: 'Tunde Bakare', role: 'customer', text: 'Paddy, has the wholesale crate of tomatoes arrived from Mile 12?' },
      { who: 'Funke Bello', role: 'staff', text: 'Tunde, the truck is due this afternoon. I will message you as soon as we offload.' }
    ]
  },
  {
    id: 'c5',
    name: 'Amaka Eze',
    channel: 'instagram' as Channel,
    status: 'Escalated' as Status,
    statusClass: 'escalated',
    time: '3 hr',
    preview: 'Wrong colour sent. I need a replacement today.',
    assignee: 'Ayo Sanwo',
    messages: [
      { who: 'Amaka Eze', role: 'customer', text: 'You sent royal blue instead of mustard. I need a replacement today before the event.' },
      { who: 'Funke Bello', role: 'staff', text: 'Amaka, I am sorry. I have escalated this so the owner can approve a same-day swap.' }
    ]
  },
  {
    id: 'c6',
    name: 'David Mensah',
    channel: 'email' as Channel,
    status: 'New' as Status,
    statusClass: 'new',
    time: '4 hr',
    preview: 'Website form: bulk shea butter for Accra shop',
    assignee: 'Unassigned',
    messages: [
      { who: 'David Mensah', role: 'customer', text: 'I run a shop in Accra and need 40kg of unrefined shea butter. What is your wholesale rate and shipping time?' }
    ]
  },
  {
    id: 'c7',
    name: 'Halima Bello',
    channel: 'whatsapp' as Channel,
    status: 'Resolved' as Status,
    statusClass: 'resolved',
    time: 'Tue',
    preview: 'Thank you, the wrapper arrived in good condition.',
    assignee: 'Ayo Sanwo',
    messages: [
      { who: 'Halima Bello', role: 'customer', text: 'Has my wrapper left the shop?' },
      { who: 'Ayo Sanwo', role: 'staff', text: 'Yes Halima, GIG is collecting it at 3pm. Tracking will follow.' },
      { who: 'Halima Bello', role: 'customer', text: 'Thank you, the wrapper arrived in good condition.' }
    ]
  },
  {
    id: 'c8',
    name: 'Ruth Boateng',
    channel: 'email' as Channel,
    status: 'In progress' as Status,
    statusClass: 'in-progress',
    time: '5 hr',
    preview: 'Can I change Saturday pickup to Monday?',
    assignee: 'Funke Bello',
    messages: [
      { who: 'Ruth Boateng', role: 'customer', text: 'Please change my Saturday pickup to Monday morning. I will be travelling.' }
    ]
  },
  {
    id: 'c9',
    name: 'Adaeze Nwosu',
    channel: 'tiktok' as Channel,
    status: 'New' as Status,
    statusClass: 'new',
    time: '32 min',
    preview: 'Your TikTok video — is the skincare bundle still on promo?',
    assignee: 'Unassigned',
    messages: [
      { who: 'Adaeze Nwosu', role: 'customer', text: 'Hello! I saw your TikTok video. Is the skincare bundle still on promo?' }
    ]
  }
];

export const initialUnansweredIds = new Set(['c1', 'c6', 'c8', 'c9']);