# Business Paddy — Shared Inbox

A Next.js 14 web application for managing customer conversations across WhatsApp, Instagram, TikTok, Email, and Website in one shared inbox.

## Current Status: Phase 1 Complete (Mock Data Only)

- ✅ Working inbox interface with navy-blue + off-white design
- ✅ Conversation list with channel/status badges
- ✅ Channel filtering (All/WhatsApp/Instagram/Email)
- ✅ Conversation thread view with message bubbles
- ✅ Reply composer with mock send (updates metrics)
- ✅ Performance cards: Received / Answered / Unanswered
- ✅ Mobile responsive (hamburger menu, slide-in nav, back button)
- ✅ 8 mock conversations (WhatsApp, Instagram, Email)
- ❌ No database, authentication, or real channel integrations yet

## Quick Start

```bash
# Prerequisites: Node.js 18+ (LTS recommended)
# Verify: node --version && npm --version

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout + metadata
│   ├── page.tsx         # Main inbox page
│   └── globals.css      # Complete design system (CSS variables)
├── components/
│   ├── Navigation.tsx   # Left sidebar
│   ├── InboxList.tsx    # Conversation list + filters
│   ├── ConversationThread.tsx  # Thread + composer
│   ├── MetricCards.tsx  # Performance cards
│   └── UI/              # Chip, Badge, Button primitives
├── data/
│   └── mockConversations.ts    # Mock data (8 conversations)
├── hooks/
│   └── useInbox.ts      # All client-side state & logic
└── types/
    └── conversation.ts  # TypeScript interfaces
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |

## Tech Stack (Phase 1)

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Native CSS (CSS variables, no Tailwind)
- **State:** React hooks (`useInbox.ts`)
- **Mock Data:** TypeScript constants (`mockConversations.ts`)

## Roadmap (Planned)

| Phase | Focus |
|-------|-------|
| 1 | ✅ Foundation & Core Inbox (mock) |
| 2 | Conversation Management, Team & Permissions |
| 3 | Reply Tools, Automation & AI |
| 4 | Customer Intelligence, Cross-Channel & Branding |
| 5 | Reporting, Performance & Payments (Paystack) |
| 6 | Channel Connections, Ownership Handover, Ethics & Polish |

## Deployment (Future)

- **Web:** Vercel, Netlify, or any Node.js hosting
- **Mobile:** Later — can wrap with Capacitor/React Native or build PWA
- **Database:** PostgreSQL (Docker) — Phase 2+
- **Auth:** Better Auth — Phase 2+
- **File Storage:** Cloudflare R2 — Phase 4+

## License

Private — Business Paddy proprietary product.