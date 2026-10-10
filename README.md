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

## Authentication (Phase 1C — owner login)

Better Auth with email + password, sessions stored in PostgreSQL. Secrets live
in `.env` (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) — never exposed to the
browser. Every inbox API call requires a signed-in staff member; the workspace
and reply sender come from the session, so each business only sees its own
data. New businesses sign up at `/sign-up` (creates workspace + owner login);
existing owners sign in at `/sign-in` and sign out from the inbox top bar.

Demo logins (local demo data only): `owner@example.com` / `demo-owner-123`,
`agent@example.com` / `demo-agent-123`.

## Password reset

The sign-in page has a Forgot password link (`/forgot-password`). Submitting
an account email sends a single-use expiring reset link through Resend; the
link opens `/reset-password` where a new password is set. Reused or expired
links are rejected. Tested end to end (request → token → reset → new password
signs in, old rejected, reuse rejected, demo password restored).

## Staff invitation emails (Resend — key required to send)

Inviting staff from the Team page emails a secure single-use link (48-hour
expiry) for the invitee to accept at `/invite/[token]` and set their own
password. No passwords are ever emailed. Invitation lookup uses hashed tokens;
accept is single-use guarded; owner/manager permission is enforced server-side.

Add to `.env` (gitignored; placeholders only in `.env.example`):

```bash
RESEND_API_KEY="re_paste_your_key_here"
RESEND_FROM_EMAIL="Business Paddy <onboarding@resend.dev>"
```

Get the key from https://resend.com/api-keys. For the sender, either verify
your own domain (Resend dashboard → Domains, add the DNS records, then use
`Your Business <team@yourdomain.com>`) or keep `onboarding@resend.dev` for
testing — the test address only delivers to your own Resend account email.
After editing `.env`, restart the app (Ctrl+C, then `npm run dev`). Without a
key, invites show setup guidance and nothing is emailed; the live email test
is pending a configured key.

## Billing (Paystack test mode — key required for live checkout)

The Settings page has a Billing section with a Test Premium Upgrade button
(₦100.00 test charge). Checkout is initialized on the server and verified with
Paystack on the server before anything is saved; reference, amount, currency
and workspace are all re-checked, duplicates are impossible (unique reference +
idempotent verify), and test payments never activate a subscription. Without a
test key, checkout shows setup guidance instead of failing silently.

Add to `.env` (gitignored; placeholders only in `.env.example`):

```bash
PAYSTACK_SECRET_KEY="sk_test_paste_your_key_here"
```

Get the key from https://dashboard.paystack.com/#/settings/developers (use the
**test** secret key, never a live one here). After editing `.env`, restart the
app (stop the terminal with Ctrl+C, then `npm run dev`). Then open Settings,
press Test Premium Upgrade, pay with a Paystack test card, and confirm the
success message plus the recorded payment row.

## Roadmap (Planned)

| Phase | Focus |
|-------|-------|
| 1A | ✅ Foundation & Core Inbox (mock) |
| 1B | ✅ PostgreSQL storage (live, migrated, seeded) |
| DB cutover | ✅ Inbox reads/writes PostgreSQL |
| 1C | ✅ Owner login + workspaces (this build; staff invites + live verification next) |
| 1D | 🟡 Customers page (built + tested, uncommitted): `/customers` lists workspace customers from PostgreSQL with channels, open counts and last activity; click for full history threads; auth-scoped APIs `GET /api/customers`, `GET /api/customers/[id]` |
| App shell | 🟡 Connected app (built + tested, uncommitted): shared sidebar across inbox, customers, team, settings, workspace, sign-in, sign-up; session/workspace API `GET /api/me` |
| 1E | 🟡 Paddy Chat (built + tested, uncommitted): guest chat without login at `/chat/[workspaceId]`, secure return links at `/chat/return/[token]` (unguessable tokens, internal notes hidden from guests), guest threads land in the staff inbox with a Paddy Chat badge and filter; APIs `POST /api/paddy-chat/start`, `GET /api/paddy-chat/thread/[token]`, `POST .../reply`, `GET /api/paddy-chat/business/[workspaceId]`; guest link shown on the Workspace page |
| Uploads | 🟡 File + voice-note uploads (built + tested, uncommitted): staff attach images, PDFs, text and audio (10 MB cap, allowlist enforced) or record voice notes in the reply composer; files stored under gitignored `data/uploads/`; attachment rows linked to reply messages; images preview inline, audio plays in-thread, other files download; downloads auth-checked per workspace; APIs `POST /api/uploads`, `GET /api/files/[id]` |
| 1G voice | 🟡 Guest voice notes (built + tested, uncommitted): record button on guest return page, token-scoped playback, staff playback in inbox |
| 1H | 🟡 WhatsApp Cost & Safety Centre (built, uncommitted): Settings section with window/template/trust explainers, estimates marked as estimates, unconnected status, official Meta links |
| 1F | 🟡 Contact saving (built + tested, uncommitted): after a resolved Paddy Chat, guests may optionally share email/phone with explicit consent ticked; validated server-side, consent timestamped, visible in staff customer records; unresolved chats, missing consent and invalid contacts rejected; API `POST /api/paddy-chat/thread/[token]/contact` |
| Team | 🟡 Team page (built + tested, uncommitted): owner card, invite form (name/email/role + Send Invitation, one-time temp password), staff list from PostgreSQL; APIs `GET/POST /api/team` (owner/manager only, 403 otherwise) |
| Settings | 🟡 Settings page (built + tested, uncommitted): editable business name/industry saved to PostgreSQL (`GET/PUT /api/settings`), owner email shown; channel section honestly marked Not connected yet |
| 1D matching | ✅ Customer matching (FR14/FR15): cross-channel suggestions by name/phone/email overlap, nothing auto-merges; owner/manager confirm with audit, agents view-only; wrong merges split out; workspace-scoped (cross-business reads 404); UI in customer detail |
| Abuse guard | ✅ Rate limiting on public guest + invite endpoints (per IP, 429 beyond limit) |
| 2 | 🟡 Conversation assignment (built + tested, uncommitted): Claim button for unassigned threads (all roles), owner/manager assign dropdown + unassign, audit-logged, workspace-scoped; API `POST /api/inbox/assign` |
| 2 | 🟡 Internal notes + resolve (built + tested, uncommitted): Reply/Note composer toggle, notes styled distinctly and hidden from guest views, Resolve button, audit-logged; APIs `POST /api/inbox/note`, `POST /api/inbox/resolve` |
| 2 | ✅ Phase 2 complete (claim/assign, notes, resolve, escalation, all 7 statuses, reopening, staff removal — all tested) ||
| 3 | Reply Tools, Automation & AI |
| 3 | 🟡 Saved replies + macros (built + tested, uncommitted): approved replies with composer insert; one-click macros insert text and run assign/status/escalate; owner/manager manage, all roles use |
| 3 | 🟡 AI drafts + tone + auto-replies + approvals (built + tested 18/18, uncommitted): mock AI draft with review-before-send, tone guidance, owner opt-in Paddy Chat greeting, approval queue with trainee/NEEDS_APPROVAL enforcement; APIs `/api/ai-draft`, `/api/reply-settings`, `/api/approvals` |
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