# **Business Paddy Product Requirements Document**

First release product definition

| Document type | Non technical product requirements document |
| :---- | :---- |
| **Status** | Initial product definition |
| **Version** | 1.1 |
| **Date** | 27 September 2026 |

**Purpose**

This document defines the customer experience, users, product rules, workflows and first release scope for a simple customer service app that brings business conversations into one shared inbox. It deliberately excludes technical architecture and implementation design.

# **Product Summary**

Business Paddy gives traders and growing businesses one place to receive and answer customer conversations from WhatsApp, Instagram, TikTok, email and their website. Staff can claim or receive conversations, use approved reply tools and escalate difficult cases. Owners and managers can control access, review how customers are answered and monitor service performance.

The first release must feel familiar to people who already use messaging apps. A new business should connect one channel and begin replying within five minutes. Ready made settings will handle the normal workflow, while optional controls will support teams that need approvals, custom roles or specialised rules.

# **Product Vision**

Make professional customer service accessible to every trader who needs it, from a person selling alone to a business managing a customer service team. The product will reduce missed messages, unclear ownership and inconsistent replies without requiring users to learn enterprise support software.

# **Problem Definition**

Businesses increasingly receive enquiries across several channels. Staff switch between separate apps, customers repeat themselves and owners struggle to see whether messages were answered well or on time. Tools designed for large support operations can be expensive, difficult to configure and unfamiliar to small teams.

* Customer messages can be missed because they are spread across different applications.  
* Two staff members may answer the same customer, while another customer receives no reply.  
* Managers lack a clear view of response time, workload, escalations and reply quality.  
* Useful reply templates and customer history are difficult to share across a team.  
* Complex setup discourages solo traders and small teams from adopting formal customer service tools.

# **Product Goals**

1\.  Combine supported customer conversations in one shared inbox.

2\.  Allow a business to start using the product within five minutes.

3\.  Make team ownership clear through claiming, assignment and escalation.

4\.  Give owners practical control over access, reply quality and staff performance.

5\.  Help staff reply quickly through saved replies, macros, optional AI drafts and controlled automatic replies.

6\.  Support solo traders and teams without requiring customers to create an account.

# **Product Boundaries**

The first release will focus on customer communication and team supervision. It will not attempt to replace every business system.

* It will not provide full order fulfilment, inventory, accounting or payment processing.  
* It will not automatically send sensitive AI generated replies without business controls.  
* It will not require customers to download the app or create a separate profile.  
* It will not include X in the first release.  
* It will not expose technical configuration to ordinary users during onboarding.

# **Users**

The product is available across industries. It is intended for people and organisations that sell goods or services and manage customer conversations through one or more supported channels.

| User | Main need | First release experience |
| :---- | :---- | :---- |
| Solo trader | Handle every enquiry without switching between apps | Uses one account, connects selected channels and answers directly from the inbox |
| Business owner | Control access, service quality and performance | Manages channels, staff, permissions, approved replies and reports |
| Manager or supervisor | Coordinate staff and resolve difficult cases | Assigns work, handles escalations, approves selected replies and reviews performance |
| Customer service agent | Reply quickly with the right context | Claims or receives conversations, uses reply tools, adds notes and resolves enquiries |
| Trainee | Learn safely with appropriate supervision | Handles permitted conversations and submits selected replies for approval |
| Customer | Receive a timely answer through the channel already in use | Continues using WhatsApp, Instagram, TikTok, email or the business website without a new account |

## **Business Size**

* One user for a solo trader.  
* Two to five internal users for a small team.  
* Six to twenty internal users for a growing team in the first release.  
* Support for larger teams will follow without changing the core inbox experience.

Customers are external contacts, not paid team users. A business may communicate with any number of customers within the limits of its chosen plan and the connected channels.

## **Roles and Permissions**

| Role | Default permissions | Optional controls |
| :---- | :---- | :---- |
| Owner | Full access to channels, users, conversations, settings, reports and billing | May create custom roles and change visibility rules |
| Manager | View assigned areas, assign work, handle escalations, approve replies and review staff | Access can be limited by channel or team |
| Agent | View permitted conversations, reply, use macros, add notes, follow up and resolve | Owner chooses whether the agent sees all, unassigned or assigned conversations |
| Trainee | Handle permitted conversations with limited access | Owner may require approval before selected replies are sent |
| Custom role | Defined by the owner | Optional for businesses that need a different structure |

# **Core Product Principles**

**P1  Useful within five minutes**  A business can create its workspace, connect one channel and begin answering customers within five minutes.

**P2  Ready made defaults**  Roles, statuses, comment filters and basic reply behaviour work without manual configuration.

**P3  Optional complexity**  Custom roles, approval rules and specialised controls remain available under settings but do not interrupt ordinary use.

**P4  Messaging app familiarity**  The inbox, conversation view and reply composer use plain language and familiar messaging patterns.

**P5  Owner control without delay**  Owners can supervise staff and set rules without forcing approval for every normal conversation.

**P6  Customer continuity**  Conversation history remains available so the customer does not have to repeat information when a case changes channel or staff member.

# **Supported Channels**

| Channel | First release coverage | Included interactions |
| :---- | :---- | :---- |
| WhatsApp | Included | Private customer messages and supported media |
| Instagram | Included | Direct messages, actionable comments, mentions and tags |
| TikTok | Included subject to platform access | Business direct messages, actionable comments and supported interactions |
| Email | Included | Incoming and outgoing customer email conversations |
| Website | Included | Live chat and contact form enquiries |
| X | Later release | Direct and public interactions after the first release |

# **Navigation**

The mobile app and web dashboard will use the same four primary areas.

* Inbox for all conversations, assignments and replies.  
* Customers for combined histories, contact details, notes and channel identities.  
* Team for workload, performance, approvals and escalations.  
* Settings for channels, roles, rules, replies, macros and optional customisation.

# **First Use Experience**

The first use journey must minimise decisions and allow optional steps to be skipped.

1\.  Create the business workspace with a business name and owner account.

2\.  Connect at least one supported channel. Other channels can be added later.

3\.  Invite staff or skip this step when the owner works alone.

4\.  Open the shared inbox and answer the first customer.

Default roles, statuses, comment rules and notifications are already active. A short optional walkthrough may identify the inbox, reply box and resolve action, but the user should not need formal training.

# **Core Workflows**

## **Receiving and Assigning a Conversation**

1\.  A supported customer interaction enters the shared inbox.

2\.  The conversation displays its channel, customer, status and current owner.

3\.  An authorised staff member claims the conversation, or a manager assigns it.

4\.  The product prevents unclear ownership by showing who is responsible before another reply is sent.

5\.  A manager may reassign the conversation when the responsible staff member is unavailable.

## **Replying to a Customer**

1\.  The staff member opens the conversation and sees the available customer history.

2\.  The staff member writes a reply or uses a saved reply, AI draft or macro.

3\.  The staff member reviews the message before sending unless an owner approved automatic rule applies.

4\.  The conversation remains open, moves to follow up or is marked resolved.

## **Managing Public Comments**

Comments enter the inbox when they show buying intent or raise a customer complaint. Examples include questions about price, availability, ordering and delivery. Casual praise, emojis, spam and unrelated comments remain outside the main inbox by default.

* Staff can reply publicly, privately or both.  
* The business can add or remove comment categories.  
* A public reply and related private conversation remain connected for context.

## **Escalating an Issue**

1\.  The staff member selects Escalate from the conversation.

2\.  The staff member selects a reason and may add an internal note.

3\.  The full conversation is assigned to the selected manager or supervisor.

4\.  The status changes to Needs approval or Escalated, and the supervisor receives a notification.

5\.  The customer remains in the same conversation and does not repeat the issue.

## **Matching a Customer Across Channels**

1\.  The product identifies a possible match using available customer information.

2\.  A staff member reviews and confirms the suggested match.

3\.  Confirmed conversations appear in one customer history while preserving their original channels.

4\.  The product does not automatically combine uncertain identities.

## **Resolving and Reopening**

1\.  Staff mark a completed conversation as resolved.

2\.  The customer may receive an optional Helpful or Not Helpful request with an optional comment field.

3\.  If the customer replies again, the conversation reopens for the last responsible staff member.

4\.  If that staff member is unavailable, the conversation returns to the shared inbox.

# **Functional Requirements**

## **Workspace and Channel Setup**

**FR1  Workspace creation**  The owner can create a business workspace and begin with one internal user.

**FR2  Channel connection**  The owner can connect supported channels individually and add more later.

**FR3  Staff invitation**  The owner can invite, deactivate and remove internal users.

**FR4  Default configuration**  A new workspace receives ready made roles, statuses, comment rules and notification settings.

**FR5  Optional customisation**  The owner can change defaults without completing configuration before first use.

## **Shared Inbox**

**FR6  Combined inbox**  The inbox shows supported customer conversations together and identifies the source channel.

**FR7  Simple filtering**  Users can filter by channel, status, staff member, team and assignment state.

**FR8  Search**  Authorised users can find a conversation by customer name, contact detail or conversation content.

**FR9  Claiming**  Permitted staff can claim unassigned conversations from the shared queue.

**FR10  Assignment**  Owners and managers can assign and reassign conversations.

**FR11  Ownership visibility**  The conversation clearly displays the current responsible staff member.

**FR12  Internal notes**  Staff can add notes and mention colleagues without sending the note to the customer.

## **Customer Records**

**FR13  Customer history**  A customer view shows permitted conversations, channels and internal notes.

**FR14  Suggested matching**  The product suggests possible cross channel matches and requires staff confirmation.

**FR15  Manual correction**  Authorised users can separate conversations that were matched incorrectly.

**FR16  Context preservation**  Reassignment and escalation keep the full permitted conversation history.

## **Reply Tools**

**FR17  Saved replies**  Businesses can create approved reusable replies that staff may insert and edit.

**FR18  AI drafts**  Staff can request a draft based on the conversation and must review it before sending.

**FR19  Controlled automatic replies**  Owners can enable automatic replies for approved situations such as greetings, business hours and acknowledgements.

**FR20  Macros**  A macro can insert approved text and perform selected actions such as tagging, assigning, changing status or escalating.

**FR21  Communication rules**  Owners can define tone guidance and reply rules for staff.

**FR22  Approval**  Owners can require approval for selected staff, situations or reply categories.

## **Conversation Management**

**FR23  Default statuses**  The product provides New, In progress, Waiting for customer, Follow up, Needs approval or Escalated and Resolved.

**FR24  Custom statuses**  Businesses can rename, add or remove statuses without changing the default first use experience.

**FR25  Follow up**  Staff can set a follow up date and receive a reminder.

**FR26  Escalation**  Staff can escalate a conversation with a reason, note and full context.

**FR27  Reopening**  A new customer reply reopens a resolved conversation according to the agreed assignment rule.

## **Team Control**

**FR28  Default roles**  The product provides Owner, Manager, Agent and Trainee roles.

**FR29  Custom roles**  An owner may create additional roles when default roles are insufficient.

**FR30  Permission control**  The owner controls conversation, channel, team, report and approval access by role.

**FR31  Conversation review**  Owners and authorised managers can review and rate staff replies after they are sent.

**FR32  Workload view**  Managers can see assigned, waiting, overdue and resolved conversation counts for permitted staff.

## **Performance and Feedback**

**FR33  Owner summary**  The dashboard shows waiting, overdue, average reply time, resolved conversations and customer rating.

**FR33a  Business Performance View**  This feature is available to every business, including solo owners and businesses with staff. Every business owner can compare:
* Customer conversations received
* Conversations answered
* Conversations unanswered
* Response rate
* Average reply time
* Resolved conversations
* Customer satisfaction rating

Businesses with staff can also filter performance by staff member or team.

**FR34  Staff performance**  Authorised users can review response time, handled and resolved conversations, overdue work, escalations, owner review scores and customer satisfaction.

**FR35  Escalation reporting**  The dashboard shows escalation volume and reasons.

**FR36  Customer feedback**  Businesses can request a Helpful or Not Helpful rating with an optional comment after resolution.

**FR37  Feedback control**  The business can switch customer feedback requests on or off.

## **Mobile and Web Experience**

**FR38  Mobile first reply experience**  The mobile app supports the complete daily reply, assignment, escalation and resolution workflow.

**FR39  Web dashboard**  The web experience supports conversation handling, team supervision, reporting and settings.

**FR40  Consistent state**  Assignments, replies, statuses and notes remain consistent when users move between mobile and web.

# **Default Product Rules**

| Area | Default rule | Optional owner control |
| :---- | :---- | :---- |
| Inbox | All supported channels appear together | Filter or restrict visibility by role, team or channel |
| Assignment | Staff claim from a shared queue or a manager assigns | Restrict claiming or assign by team |
| Comments | Buying questions and complaints enter the inbox | Add or remove categories |
| Replies | Staff review replies before sending | Enable approved automatic replies |
| AI | AI produces optional drafts | Disable AI help or limit it by role |
| Approval | Normal replies do not require approval | Require approval by staff member or situation |
| Matching | Possible customer matches require confirmation | Authorised users can separate an incorrect match |
| Resolved cases | A new reply reopens for the last staff member | Return directly to the shared inbox |
| Feedback | Helpful or Not Helpful with optional comment | Switch feedback requests off |

# **Notifications**

Notifications should prompt action without overwhelming the team.

* Staff receive notifications for assignments, customer replies, mentions, follow up reminders and approval decisions.  
* Managers receive notifications for escalations, approval requests and conversations that pass the business response target.  
* Owners can choose notification categories and quiet periods.  
* A notification opens the relevant conversation or action directly.

# **Owner Dashboard**

The first dashboard view uses a small set of summary measures. Detailed reports remain one level deeper.

| Measure | Question answered |
| :---- | :---- |
| Average response time | How quickly are customers receiving a first useful reply |
| Handled and resolved | How much customer work did each permitted staff member complete |
| Unanswered and overdue | Which customers still need action |
| Escalation volume and reasons | Which issues repeatedly require management help |
| Owner review score | How well are staff following the business communication standard |
| Customer satisfaction | Did customers find the support helpful |

# **Business Performance View**

The Business Performance View gives every owner a clear picture of how well the business handles customer conversations. By comparing received, answered and unanswered conversations, owners can see their response rate at a glance. Average reply time shows how quickly customers get a first useful reply. Resolved conversations and customer satisfaction ratings reveal whether replies actually solve the problem. For businesses with staff, filtering by team member or team highlights who is keeping up and where additional coaching or staffing may be needed.

# **User Stories**

* As a solo trader, I want to see my customer messages together so I can reply without opening several apps.  
* As an owner, I want to know who answered each customer so I can monitor responsibility and service quality.  
* As a manager, I want to assign and reassign conversations so customers are not left waiting.  
* As an agent, I want the customer history and approved replies beside the conversation so I can respond accurately.  
* As a trainee, I want selected replies reviewed so I can learn without risking an inappropriate response.  
* As a staff member, I want to escalate a difficult issue with one action so management receives the full context.  
* As a customer, I want to continue using my preferred channel and avoid repeating my problem.

# **First Release Scope**

The first release includes the complete daily customer service workflow for solo traders and teams of up to twenty internal users.

| Included in first release | Planned later |
| :---- | :---- |
| WhatsApp, Instagram, TikTok, email and website conversations | X integration |
| Shared inbox, filters, search, claiming and assignment | Support for larger team plans |
| Customer history and confirmed cross channel matching | Additional languages and regional customisation |
| Saved replies, macros, AI drafts and controlled automatic replies | Advanced automation and deeper reporting |
| Default and custom roles, permissions and approvals | Multiple business workspaces under one owner account |
| Escalation, follow up, statuses and reopening | Connections to order, payment and inventory systems |
| Owner dashboard and customer feedback | Extended customer portal features |
| Mobile app and web dashboard | Additional communication channels |

# **Success Measures**

The first release will be successful when businesses can adopt it quickly and handle customer conversations more reliably.

* A new business can connect one channel and reach the inbox within five minutes.  
* A first time agent can open, claim, reply to and resolve a conversation without training.  
* The business can identify the responsible staff member for every active conversation.  
* Owners can find unanswered and overdue conversations from the first dashboard view.  
* Escalated conversations reach a manager with their context and reason intact.  
* Customers can give feedback with one tap after resolution.  
* Pilot businesses report fewer missed messages and less switching between channel applications.

# **Launch Readiness Criteria**

* The complete first use journey is understandable without a manual.  
* At least one supported channel can be connected and used during onboarding.  
* Messages can be received, assigned, answered, escalated, followed up and resolved.  
* Role permissions prevent unauthorised conversation and report access.  
* Saved replies, AI drafts, macros and approved automatic replies behave according to owner controls.  
* The owner dashboard reflects conversation and staff activity accurately.  
* Mobile and web users see the same current conversation state.  
* Pilot users can complete the main workflow with minimal guidance.

# **Risks and Product Responses**

| Risk | Product response |
| :---- | :---- |
| A channel limits or changes access | Treat channel availability as a release dependency and communicate supported interactions clearly |
| Too many controls make the product difficult | Keep ready made defaults and place advanced settings outside the first use flow |
| Automatic replies send an unsuitable response | Limit automation to owner approved situations and keep sensitive categories under review |
| AI drafts contain errors or use the wrong tone | Require staff review by default and allow the owner to define guidance or disable AI help |
| Two customer identities are joined incorrectly | Use suggested matching with staff confirmation and provide a correction action |
| Staff misuse customer information | Apply role based visibility and record responsibility for conversations |
| Owners focus on speed at the expense of quality | Show customer satisfaction, owner review and escalation context alongside response time |

# **Open Business Decisions**

The following decisions should be validated before commercial launch. They do not prevent design and prototype work.

* Public positioning and brand language for Business Paddy.  
* Pricing structure for solo traders, small teams and growing teams.  
* Free trial or free plan limits.  
* The first geographic launch market and supported currencies.  
* Exact response targets and whether businesses receive suggested targets.  
* Additional language support.  
* Availability and approval requirements for each external channel before launch.  
* Whether Facebook Messenger should enter the first or a later release.

# **Recommended Next Work**

1\.  Validate the problem and feature priorities with traders and customer service teams.

2\.  Create low fidelity flows for onboarding, inbox, conversation, escalation and owner dashboard.

3\.  Test whether new users can connect a channel and answer a message within five minutes.

4\.  Confirm channel access and define the exact supported interaction for each first release channel.

5\.  Use research findings to set pricing, plan limits and the final first release backlog.

# **Implementation Plan**

## Phase 1: Foundation & Core Inbox
**Status (27 September 2026):** Phase 1 initial local prototype completed (`index.html`, mock data only). The next phase is connecting real accounts, authentication and PostgreSQL later.

**Output:** Local Next.js app with a working shared inbox page using mock data.
- Project setup: Next.js (App Router, TypeScript), PostgreSQL (Docker), Better Auth, local file mocks
- Workspace creation + owner account (FR1)
- Default roles, statuses, comment rules seeded (FR4)
- Shared inbox UI: combined conversations, channel badges, status, assignee (FR6, FR11)
- Basic filtering by channel/status/assignee (FR7)
- Claim/unclaim conversation (FR9)
- Conversation view with customer history sidebar (FR13)
- Reply composer with send (mock) (FR17 placeholder)

## Phase 2: Conversation Management & Team Basics
**Output:** Full conversation lifecycle + role-based access working locally.
- Assignment/reassignment by managers (FR10)
- Internal notes & mentions (FR12)
- Status transitions: New → In progress → Waiting → Follow up → Needs approval/Escalated → Resolved (FR23)
- Escalation workflow with reason + note (FR26)
- Reopen on new customer reply (FR27)
- Role-based permissions: Owner, Manager, Agent, Trainee (FR28, FR30)
- Staff invitation/deactivation (FR3)

## Phase 3: Reply Tools & Automation
**Output:** Saved replies, macros, AI drafts, auto-replies functional with mock data.
- Saved replies CRUD + insert into composer (FR17)
- Macros: insert text + actions (tag, assign, status, escalate) (FR20)
- AI draft generation (mock) with review-before-send (FR18)
- Controlled auto-replies: greetings, hours, acknowledgements (FR19)
- Approval workflow for trainees/selected categories (FR22)
- Communication rules/tone guidance (FR21)

## Phase 4: Customer Intelligence & Cross-Channel
**Output:** Customer records with matching, history, context preservation.
- Customer detail view: conversations, channels, notes (FR13)
- Suggested cross-channel matching with confirmation (FR14)
- Manual split/merge of matched conversations (FR15)
- Context preserved on reassignment/escalation (FR16)
- Follow-up reminders (FR25)

## Phase 5: Reporting & Performance
**Output:** Owner dashboard + Business Performance View + staff performance.
- Owner summary: waiting, overdue, avg reply time, resolved, CSAT (FR33)
- Business Performance View: received/answered/unanswered, response rate, avg reply time, resolved, CSAT; filter by staff/team (FR33a)
- Staff performance: response time, handled/resolved, overdue, escalations, review scores, CSAT (FR34)
- Escalation reporting (FR35)
- Customer feedback: Helpful/Not Helpful + comment (FR36, FR37)

## Phase 6: Channels, Notifications & Polish
**Output:** Channel connection UI, notifications, mobile-responsive layout, consistent state.
- Channel connection flow (WhatsApp, Instagram, TikTok, Email, Website) (FR2)
- Notification system: assignments, replies, mentions, follow-ups, approvals, escalations
- Mobile-first responsive inbox/conversation view (FR38)
- Web dashboard for supervision/reporting/settings (FR39)
- State consistency across mobile/web (FR40)
- Settings: roles, rules, replies, macros, customisation (FR5, FR24, FR29)

# **Technical Architecture**

**Application Framework:** Next.js with TypeScript (App Router)
- Full-stack React framework with API routes for webhooks
- Server Components for fast initial loads
- TypeScript for type-safe role/permission logic

**Database:** PostgreSQL, planned to run locally through Docker
- Relational model fits workspaces, users, conversations, messages, customers
- Supports multi-business, multi-staff, high-volume conversations
- Avoids later migration from SQLite

**Authentication:** Better Auth
- Modern auth library for Next.js with email/password and magic links
- Session stores workspaceId + role for RBAC
- Extensible to OAuth providers later

**File Storage:** Local mock files for this assessment; Cloudflare R2 later
- Local `public/uploads/` or `data/uploads/` for development
- Sharp for image processing/thumbnails
- Swappable to R2 via adapter pattern

**Reverse Proxy:** Caddy (later)
- Automatic HTTPS, simple config, handles WebSocket upgrades

**Payments:** Paystack (later)
- Primary payment gateway for African markets

**Email Service:** Resend, ZeptoMail, or Amazon SES (later)
- Transactional email for invites, notifications, verification

**Hosting Now:** Local device
- App and database run locally for development and assessment
- No cloud deployment required at this stage

**Do Not Use:** Supabase
- Explicitly excluded per steering decision

# **Assessment Scope**

This assessment uses **mock/test data only** and requires only **one local working page** (the shared inbox). The following are **not required** at this stage:
- Working authentication or sign-in flow
- Database testing or migrations
- Payment integration (Paystack)
- Email service integration
- Cloud file storage (Cloudflare R2)
- Public deployment or HTTPS
- Reverse proxy (Caddy)

The app and database are planned to run locally for now.

# **AI Steering Log**

26 September 2026: Instructed the AI to rename the product requirements file from Business_Paddy_PRD.md.md to PRD.md so the assessment grader can identify it.

27 September 2026: Instructed the AI to correct the filename from Business-Paddy.md to PRD.md so the assessment grader can identify the product requirements document.

27 September 2026: Instructed the AI to add FR33a Business Performance View, a Business Performance View section, and the ability for every business owner to compare received, answered, unanswered, response rate, average reply time, resolved conversations, and customer satisfaction, with staff/team filtering for businesses with staff.

27 September 2026: Instructed the AI to update the document Version from 1.0 to 1.1 and the Date from 24 September 2026 to 27 September 2026.

27 September 2026: Instructed the AI to add the implementation plan (6 phases), final architecture (Next.js/TypeScript, PostgreSQL/Docker, Better Auth, local mock files → Cloudflare R2, Caddy later, Paystack later, Resend/ZeptoMail/SES later, local hosting, no Supabase), assessment scope (mock data only, one page, no auth/db/payments/email/cloud/deployment), and record the steering decision: the AI recommended SQLite but the user selected PostgreSQL because Business Paddy will support multiple businesses, staff accounts and many conversations, and the user wants to avoid migrating databases later.

27 September 2026: Switched from OpenCode to Cursor because OpenCode timed out. Instructed the AI in Cursor to create design.html in the project root as a responsive Business Paddy shared-inbox design preview using mock data only (HTML, CSS and simple JavaScript; no installs or external services), including left navigation, WhatsApp/Instagram/email sample conversations, customer names, previews, channel badges, statuses, selected conversation, reply input with a styled Send Reply button, owner performance cards for received/answered/unanswered conversations, and a mobile-friendly layout. Recorded this design preview request in the steering log.

27 September 2026: Instructed the AI to refine design.html by replacing the green colour scheme with a vibrant navy-blue and warm beige colour scheme, using navy blue as the main brand colour, beige for backgrounds and cards, and strong contrast so all text and buttons remain easy to read.

27 September 2026: Instructed the AI to create a separate working prototype named exactly index.html using mock data only, keep the navy-blue and beige design, and make conversation selection, channel filtering, mock replies, and answered/unanswered performance updates work on desktop and mobile. Recorded that Phase 1 initial local prototype is completed, and that the next phase is connecting real accounts, authentication and PostgreSQL later.