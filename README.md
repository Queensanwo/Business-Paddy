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

## Database (Phase 1B — live)

PostgreSQL 16 runs through Docker. First start Docker Desktop, then:

```bash
docker compose up -d
npx prisma migrate dev
npm run db:seed
```

The inbox is database-backed: it loads conversations from PostgreSQL through
`GET /api/inbox` and saves replies through `POST /api/inbox/reply`. Replies,
status changes and unanswered counts persist across refresh and restart.
Database credentials stay server-side (API routes only, never `NEXT_PUBLIC_`).
Seed data is demo-only (demo workspace + `Demo data` badge in the inbox).

Verify: `npx prisma validate`, seed prints row counts, app at
http://localhost:3000 (9 conversations, 4 unanswered after a fresh seed).

Key files: `docker-compose.yml`, `.env` (gitignored, see `.env.example`),
`prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts` (Prisma singleton),
`src/server/inboxStore.ts` (load/save + mappers), `src/app/api/inbox/`.

## Roadmap (Planned)

| Phase | Focus |
|-------|-------|
| 1A | ✅ Foundation & Core Inbox (mock) |
| 1B | 🟡 PostgreSQL storage (files ready; needs Docker daemon + WSL2) |
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