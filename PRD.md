# **Business Paddy Product Requirements Document**

First release product definition

| Document type | Non technical product requirements document |
| :---- | :---- |
| **Status** | Initial product definition |
| **Version** | 1.1 |

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
| Owner | Full access to channels, users, conversations, settings, reports and billing | May create custom roles and change visibility rules; delegate permissions to managers |
| Manager | View assigned areas, assign work, handle escalations, approve replies and review staff | Access can be limited by channel or team; may be granted permissions for branding, business settings, conversations, staff management, reports, saved replies, macros, reminders, automation, channel connections |
| Agent | View permitted conversations, reply, use macros, add notes, follow up and resolve | Owner chooses whether the agent sees all, unassigned or assigned conversations |
| Trainee | Handle permitted conversations with limited access | Owner may require approval before selected replies are sent |
| Custom role | Defined by the owner | Optional for businesses that need a different structure |

**Owner and Manager Permissions**
- Owners can delegate branding and day-to-day business administration to managers
- Permissions are configurable for: branding and business settings; conversations and assignments; staff management; reports; saved replies and macros; reminders and automation; channel connections; billing (separate permission)
- Broad business-administrator preset available while preserving owner-only controls
- Owners retain oversight and can revoke permissions at any time
- Owners and managers use separate logins
- Managers cannot remove the owner, promote themselves, or grant permissions beyond their own authority
- Important administrative changes recorded with the responsible user
- Business administration is limited to that business — no access to Business Paddy's global backend, other businesses, infrastructure controls or secret keys

# **Manager-Led Setup and Ownership Handover**

- A manager or representative may set up a workspace on behalf of a business
- The creator temporarily holds the workspace-owner role until the actual owner accepts ownership
- Only the current workspace owner can initiate a transfer
- Transfer requires:
  - Re-authentication by the current owner
  - A secure, expiring, single-use invitation
  - Recipient sign-in and explicit acceptance
  - Cancellation of pending invitations
  - An atomic transfer with one primary owner
  - Notifications and an audit record
- Until acceptance, ownership remains unchanged
- After transfer, the former owner loses owner privileges; the new owner decides whether that person remains a manager and which permissions they retain
- Workspace ownership transfer does not automatically transfer connected social accounts, email accounts, payment accounts or legal business ownership — separate reauthorisation identified where required

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
| WhatsApp | Included | Private customer messages and supported media via official WhatsApp Business Platform / Cloud API. Eligible existing WhatsApp Business app accounts and numbers evaluated through official coexistence onboarding. Account requirements, messaging windows, templates, permissions and costs verified. |
| Instagram | Included | Direct messages, actionable comments, mentions and tags. Supported professional account types and required permissions verified. DMs, comments, mentions/tags and private replies assessed separately. |
| TikTok | Included subject to platform access | Business direct messages, actionable comments, mentions and Shop messaging via official Business Messaging API. Nigeria-based developer eligibility, Nigerian business-account eligibility and customer-country restrictions confirmed. Approval requirements and whether direct access or an approved partner is needed verified. Unavailable capabilities clearly marked as awaiting access. No scraping or unofficial login workarounds. |
| Email | Included | Incoming and outgoing customer email conversations via official provider APIs or permitted IMAP/SMTP. Gmail/Google Workspace, Outlook/Microsoft 365 and other compatible providers including custom business-domain mailboxes. Shared-mailbox permissions and administrator consent accounted for. Receiving email from different senders distinguished from connecting mailboxes hosted by different providers. Tested compatibility list maintained. Email threads preserved, duplicate messages prevented, attachments protected. |
| Website | Included | Live chat and contact form enquiries. Visitor sessions and business conversations kept separate. |
| X | Later release | Direct and public interactions after the first release. |

# **Navigation**

The mobile app and web dashboard will use the same four primary areas.

* Inbox for all conversations, assignments and replies.  
* Customers for combined histories, contact details, notes and channel identities.  
* Team for workload, performance, approvals and escalations.  
* Settings for channels, roles, rules, replies, macros and optional customisation.

# **Professional Interface**

Default colour scheme: **Slate Blue and White**.
- Accent: #526BB1
- Background: #EEF1F6
- Panels: #FAFBFE
- Dark, readable text

Contrast checked and shades adjusted where necessary. Interface is subtle, professional, simple and responsive on mobile and desktop.

Clear navigation, consistent controls, understandable empty, loading, error and disconnected states.

AI suggestions hidden until requested.

Distinct interfaces for:
- Business Paddy public landing page
- Sign-up / sign-in
- Business setup
- Working inbox
- Business settings
- Future website builder for individual businesses (separate from landing page)

# **Business Branding**

Each business can customise its identity:
- Business name editing
- Logo upload, replacement and removal
- Preview, save, cancel and restore defaults
- Preset themes: Slate Blue and White, Plum and Pearl, Terracotta and Stone
- Custom accent colours with readability checks
- Optional colour suggestions extracted from the logo (require user approval before application)
- Uploading a logo does not automatically change the theme
- Uploads validated securely; image proportions preserved
- Branding persists across sessions and devices; applies only to that business
- Navigation and layout remain consistent across themes

# **First Use Experience**

The first use journey must minimise decisions and allow optional steps to be skipped.

1\.  Create the business workspace with a business name and owner account.

2\.  Connect at least one supported channel. Other channels can be added later.

3\.  Invite staff or skip this step when the owner works alone.

4\.  Open the shared inbox and answer the first customer.

Default roles, statuses, comment rules and notifications are already active. A short optional walkthrough may identify the inbox, reply box and resolve action, but the user should not need formal training.

# **Demo Mode and Live Mode**

Business Paddy operates in two distinct modes. The mode is selected during workspace creation and determines what features are available.

## Demo Mode

- Uses fictional businesses and sample customer conversations.
- Displays a persistent banner: **“Demo — no real messages are sent.”**
- Replies remain simulated and must not send through real channel integrations.
- Does not collect identity documents, CAC certificates or real customer data.
- Shows business verification as a clearly labelled example only.
- Keeps demo data strictly separate from live business data and reporting.
- Allows exploration of the inbox, reply tools, reporting, branding, reminders and settings without external dependencies.
- Suitable for evaluation, training and internal testing.

## Live Mode

- Requires verified email and phone for the workspace owner.
- Verifies ownership of connected channels through official authorisation (OAuth/API) only.
- Includes risk-based business verification for higher-risk accounts or features.
- Enforces abuse reporting, sending limits and immutable audit logs.
- Requires additional review for higher-risk businesses or features (e.g., high-volume sending, financial services).
- Explains clearly that verification confirms identity or account control; it does not guarantee that the business is honest.
- All reminders remain strictly internal for staff, managers and owners — never sent to customers.

The mode can be changed from Demo to Live by completing verification. Live to Demo is not supported; a new workspace is created instead.

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

## **Saved Conversation History**

**FR41  Conversation history storage**  Business Paddy saves authorised conversation history for each business, including:
- Incoming customer messages
- Replies sent by staff through Business Paddy
- Customer and channel details
- Dates and times (UTC with timezone awareness)
- Assigned staff members
- Reassignments with timestamps and responsible users
- Internal notes and mentions
- Status changes with timestamps
- Escalations and approvals with reasons and outcomes
- Attachments where supported by the channel
- Internal reminder activity linked to the conversation

Each business's conversation history is kept strictly separate. Demo data is kept separate from real data. Real customer information is never used in the public repository.

**FR42  Provider message ID tracking**  When Business Paddy sends a reply through an official channel integration, the reply is saved in Business Paddy's history and the provider message ID is stored when available.

**FR43  Channel inbox mirroring verification**  For WhatsApp, Instagram, TikTok and email, the product records whether messages sent through Business Paddy also appear in the original platform's own inbox. This is treated as a channel-specific capability to verify — not assumed.

**FR44  History search and access**  Staff can search and view previous conversations according to their permissions. Owners and authorised managers can review the permitted history.

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

## Phase 1: Foundation, Storage, Identity, History and Paddy Chat (WhatsApp, Instagram, TikTok, Email, Website, Paddy Chat)
**Status:** Phase 1A completed (Next.js inbox prototype + `index.html` mock, TikTok inbox update with tested reply-counting logic). Remaining parts 1B–1H are planned below. Phase 2 begins only after 1A–1H are working and tested.

### 1A. Next.js Inbox Prototype (completed)
**Output:** Local Next.js app with a working shared inbox page using mock data.
- Project setup: Next.js (App Router, TypeScript), local file mocks
- Shared inbox UI: combined conversations across WhatsApp, Instagram, TikTok, Email with channel badges, status, assignee (FR6, FR11)
- Basic filtering by channel, including Unanswered filter (FR7)
- Claim/unclaim conversation (FR9)
- Conversation view with customer history sidebar (FR13)
- Reply composer with send (mock), tested reply-counting logic (FR17 placeholder)
- **Slate Blue and White default theme applied** (professional, subtle, responsive)
- **Empty, loading, error, disconnected states** implemented
- **Ethics & privacy foundations (implemented in mock)**: business-separated data model, RBAC stub (owner/manager/agent/trainee), demo data flag, AI/real message distinction in UI, internal-only reminders UI, no customer-reminder UI

### 1B. PostgreSQL Storage
**Output:** Local PostgreSQL (Docker) with the full Business Paddy schema, seeded defaults, migrations working.
- Database setup: PostgreSQL through Docker, migrations, seed scripts
- Workspace, user, conversation, message, customer tables (FR1)
- Default roles, statuses, comment rules seeded (FR4)
- **Conversation history storage schema** (FR41): messages, replies, customer/channel details, timestamps, assignees, reassignments, internal notes, status changes, escalations, approvals, attachments, reminder activity
- **Provider message ID tracking** (FR42) in database schema
- **Channel inbox mirroring flags** (FR43) per channel integration
- **History search API** (FR44) with permission-based access control
- Demo data kept separate from live data; no real customer data in the repository

### 1C. Better Auth and Business Workspaces
**Output:** Working sign-in, separate logins, workspace creation with Demo/Live mode selection.
- Better Auth integration: email/password and magic links, sessions carrying workspaceId + role
- Workspace creation + owner account (FR1)
- **Demo/Live mode selection at workspace creation**: demo mode uses fictional data, shows "Demo — no real messages are sent" banner, simulated replies only, no real channel sends, no document collection, verification shown as example only, demo data isolated from live
- Staff invitation/deactivation with separate logins (FR3)
- **Missing after 1C**: real email/phone verification, business verification flow, abuse detection, audit logging, retention policies, encryption at rest, Acceptable Use Policy pages (covered in later parts/phases)

### 1D. Customer Records and Saved Conversation History
**Output:** Customer views, cross-channel matching, searchable permission-scoped history.
- Customer detail view: conversations, channels, notes (FR13)
- Suggested cross-channel matching with staff confirmation (FR14)
- Manual split/merge of matched conversations (FR15)
- Context preserved on reassignment/escalation (FR16)
- **Business-separated conversation history** (FR41): strict data isolation per business, demo data separated from real data
- **History access control** (FR44): permission-based search and view for staff, owner/manager review access
- Conversation search by customer name, contact detail and content (FR8)

### 1E. Paddy Chat Guest Conversations and Secure Return Links
**Output:** Paddy Chat as a core channel — guests chat without an account and return securely later.
- Paddy Chat guest conversation flow: shareable chat link per business, no customer account or app download required
- Guest messages enter the shared inbox alongside WhatsApp, Instagram, TikTok, Email and Website
- Secure return links: expiring, single-use-capable links letting the same guest resume their conversation
- Guest identity handled per privacy rules; no scraping or unofficial workarounds

### 1F. Optional Customer-Contact Saving After Resolved Chat or Completed Deal
**Output:** Consent-based contact saving offered only after a resolved chat or completed deal.
- Optional prompt to save customer contact details after resolution or deal completion
- Explicit customer consent required; staff can skip; never automatic
- Saved contacts linked to conversation history per business

### 1G. Paddy Chat Security, Accessibility, Voice Notes and Service Reply Notifications
**Output:** Hardened, accessible Paddy Chat with voice notes and reply notifications.
- Security: rate limiting, spam/abuse controls, validated guest sessions, no credential exposure
- Accessibility: readable contrast, keyboard navigation, screen-reader labels, mobile-friendly layout
- Voice notes: guests and staff can send and play voice notes where supported
- Service reply notifications: guests are notified of staff replies through the return-link channel

### 1H. WhatsApp Cost and Safety Centre
**Output:** Transparent WhatsApp cost and safety information inside Business Paddy.
- Template, messaging-window and cost explainer for WhatsApp Business Platform usage
- Sending limits and trust levels surfaced per business
- Safety guidance: opt-out handling, ban-risk reduction, account-health signals
- Links to official WhatsApp documentation; no invented pricing

## Phase 2: Conversation Management, Team & Permissions
**Entry gate:** begins only after Phase 1 parts 1A–1H are working and tested.
**Output:** Full conversation lifecycle + role-based access + owner/manager delegation working locally.
- Assignment/reassignment by managers (FR10)
- Internal notes & mentions (FR12)
- Status transitions: New → In progress → Waiting → Follow up → Needs approval/Escalated → Resolved (FR23)
- Escalation workflow with reason & note (FR26)
- Reopen on new customer reply (FR27)
- Role-based permissions: Owner, Manager, Agent, Trainee (FR28, FR30)
- Staff invitation/deactivation (FR3)
- **Owner delegates permissions to managers** (branding, business settings, conversations, staff, reports, saved replies, macros, reminders, automation, channels, billing as separate permission)
- **Business-administrator preset** with owner-only controls preserved
- **Audit log for administrative changes** (permission grants/revocations, ownership transfers)
- Separate logins for owners and managers; managers cannot remove owner, self-promote, or exceed authority
- **Business-separated conversation history** (FR41): strict data isolation per business, demo data separated from real data
- **History access control** (FR44): permission-based search and view for staff, owner/manager review access
- **Business verification (mocked)**: verified email/phone flags, business name/industry/contact fields, OAuth-only channel connection UI, no password storage, document upload placeholder with restricted access
- **Abuse prevention (mocked)**: sending limits per trust level, suspicious activity flags, channel disconnect/suspend/appeal UI, report/block buttons, audit log entries for admin/connection/messaging actions
- **Privacy controls (mocked)**: consent/opt-out fields, export/correction/deletion request placeholders, retention period config, encryption-at-rest flag in schema
- **Demo/Live mode enforcement (mocked)**: mode flag on workspace, demo banner display, simulated-only sends in demo, live mode gated behind verification completion, demo data isolation enforced in queries
- **Missing in Phase 2**: real email/phone verification, real OAuth flows, document verification integration, real abuse detection engine, real audit log persistence, real encryption, legal review of policies

## Phase 3: Reply Tools, Automation & AI
**Output:** Saved replies, macros, AI drafts, auto-replies functional with mock data for all channels.
- Saved replies CRUD + insert into composer (FR17)
- Macros: insert text + actions (tag, assign, status, escalate) (FR20)
- AI draft generation (mock) with review-before-send (FR18)
- **AI does not invent prices, availability, delivery promises, refunds, policies** — owners control approved business information
- Controlled auto-replies: greetings, hours, acknowledgements (FR19)
- Approval workflow for trainees/selected categories (FR22)
- Communication rules/tone guidance (FR21)
- **Human review required by default for AI replies**; sensitive replies require configured human approval
- Manual replying remains available if AI fails
- **AI ethics (implemented in mock)**: AI-generated label in composer, review-before-send default, sensitive-reply approval gate, manual fallback, business-info guardrails (no invented prices/policies)
- **Missing in Phase 3**: real AI integration, configurable sensitive-reply rules, AI usage audit trail, prompt-injection protections

## Phase 4: Customer Intelligence, Cross-Channel & Branding
**Output:** Customer records with matching, history, context preservation + business branding across all channels.
- Customer detail view: conversations, channels, notes (FR13)
- Suggested cross-channel matching with confirmation (FR14)
- Manual split/merge of matched conversations (FR15)
- Context preserved on reassignment/escalation (FR16)
- **Internal reminders (implemented)**: create, assign, schedule, snooze, reschedule, complete, cancel, timezone, frequency, preview; in-app notifications linked to conversation/task; visible to assignee/creator/managers; never sent to customers (FR25)
- **Business branding**: name editing, logo upload/replace/remove, preview/save/cancel/restore defaults
- **Preset themes**: Slate Blue & White, Plum & Pearl, Terracotta & Stone
- **Custom accent colours** with readability checks; optional logo colour suggestions (user approval required)
- Logo upload does not auto-change theme; secure validation, proportions preserved
- Branding persists across sessions/devices; per-business; consistent navigation/layout across themes
- **Privacy controls (mocked)**: consent/opt-out per customer, export/correction/deletion request UI, retention period per data type
- **Missing in Phase 4**: real reminder persistence, real export/deletion execution, automated retention enforcement

## Phase 5: Reporting, Performance & Payments
**Output:** Owner dashboard + Business Performance View + staff performance + Paystack integration.
- Owner summary: waiting, overdue, avg reply time, resolved, CSAT (FR33)
- Business Performance View: received/answered/unanswered, response rate, avg reply time, resolved, CSAT; filter by staff/team (FR33a)
- Staff performance: response time, handled/resolved, overdue, escalations, review scores, CSAT (FR34)
- Escalation reporting (FR35)
- Customer feedback: Helpful/Not Helpful + comment (FR36, FR37)
- **Consistent metric definitions; exclude demo data; authorised users open conversations behind metrics**
- **Separate automatic acknowledgements from human replies**
- **Paystack integration**: secure checkout, server-side verification, authenticated webhooks, duplicate protection, transaction history, separate test/live config, platform subscriptions vs merchant payments separated
- **Payment purpose clarified** (businesses pay platform / customers pay businesses / both)
- **Accountability (mocked)**: Acceptable Use Policy page, privacy notice page, abuse report form, suspension/appeal process UI, audit log viewer for admins
- **Abuse prevention (mocked)**: trust-level progression, volume-limit alerts, audit log export
- **Missing in Phase 5**: real policy documents (legal review), real abuse reporting workflow, real suspension/appeal automation, compliance evidence collection

## Phase 6: Channel Connections, Ownership Handover, Notifications, Ethics & Polish
**Output:** Production-ready channel connections, manager-led setup/ownership transfer, notifications, ethics controls, mobile-responsive polish.
- **Channel connection flows** for WhatsApp (Cloud API, coexistence onboarding), Instagram (professional account permissions), TikTok (Business Messaging API, Nigeria eligibility, partner requirements), Email (Gmail/Workspace, Outlook/365, IMAP/SMTP, shared mailboxes, admin consent, compatibility list), Website (live chat, contact forms)
- **Channel inbox mirroring verification** (FR43): for WhatsApp, Instagram, TikTok and email, record whether outbound messages appear in the platform's own inbox — verified per channel, not assumed
- **Provider message ID capture** (FR42): store provider message IDs when sending replies through official integrations
- **Manager-led workspace setup & ownership handover**: temporary creator ownership, secure expiring single-use invitation, recipient sign-in + explicit acceptance, cancellation, atomic transfer, audit record, former owner becomes manager at new owner's discretion, separate reauthorisation for connected accounts identified
- **Internal reminders**: schedule, assign, snooze, reschedule, complete, cancel, timezone, frequency, preview; visible to assignee/creator/managers; never sent to customers
- Notification system: assignments, replies, mentions, follow-ups, approvals, escalations, reminders
- Mobile-first responsive inbox/conversation view (FR38)
- Web dashboard for supervision/reporting/settings (FR39)
- State consistency across mobile/web (FR40)
- Settings: roles, rules, replies, macros, customisation, branding, permissions, channels (FR5, FR24, FR29)
- **Ethics, privacy, security controls (production-ready)**:
  - Business verification: real email/phone verification, OAuth-only channel connections, document verification integration for high-risk accounts, restricted document access with retention/deletion
  - Abuse prevention: real sending limits by trust level, automated suspicious-activity detection, channel disconnect/suspend/appeal workflow, report/block functions, immutable audit logs for admin/connection/messaging actions
  - Privacy: RBAC enforced, business data isolation, consent/opt-out handling, data export/correction/deletion execution, retention enforcement, encryption at rest and in transit, demo/AI/real message distinction
  - AI ethics: business-info guardrails enforced, review-before-send default, sensitive-reply approval, manual fallback, AI-generated labelling
  - Reminders: internal-only enforcement, in-app/staff notifications linked to conversation/task
  - Accountability: Acceptable Use Policy, privacy notice, abuse-reporting process, suspension process, appeal process published; legal/platform requirements flagged for review; no overclaims on scam/ban/hack prevention
- Distinct interfaces: landing page, sign-up/in, business setup, working inbox, business settings, future website builder (separate)
- **Missing in Phase 6**: legal review of all policies, penetration testing, incident response drills, ongoing compliance monitoring, third-party audit

# **Reminders**

Reminders are strictly **internal**. They are for **owners, managers and staff only**. They must never send messages to customers.

Staff can:
- Create reminders
- Assign reminders to self or other authorised staff
- Schedule reminders with date/time and timezone selection
- Snooze, reschedule, complete or cancel reminders
- Set frequency controls for recurring reminders

Reminders create **in-app or staff notifications** linked to the relevant conversation or task. They are visible only to the assigned staff member, the creator, and managers with appropriate permissions. They appear in the relevant conversation context and in a central reminders view.

Normal manual replies to customers continue to follow the channel rules.

# **Ethics, Privacy and Business Verification**

Business Paddy is designed to help businesses manage customer conversations — not to enable spam, scams, impersonation, harassment, scraping or platform-rule circumvention.

## 1. Business Verification

- Require verified business email and phone during onboarding.
- Collect business name, industry and contact details.
- Verify connected WhatsApp, Instagram, TikTok and email accounts through official OAuth/API authorisation only.
- Never request or store social-media passwords.
- Support identity and business-document verification for higher-risk accounts or features (e.g., high-volume sending, financial services).
- Make clear that verification confirms identity or account control; it does not guarantee that the business is honest.
- Protect verification documents with restricted access and retention/deletion rules.

## 2. Abuse Prevention

- Prohibit spam, phishing, impersonation, harassment, illegal activity, scraping and attempts to bypass platform restrictions in the Acceptable Use Policy.
- Use sending limits and gradual trust levels for new businesses.
- Detect suspicious activity (e.g., sudden volume spikes, template misuse, failed deliveries) and allow channel disconnection, suspension and appeal.
- Provide report and block functions for staff and customers.
- Keep immutable audit logs for important account, permission, connection and messaging actions.

## 3. Privacy and Security

- Use role-based access for owners, managers and staff (least privilege; owners control delegation).
- Keep each business's data strictly separate — no cross-business access.
- Support consent, opt-out handling, data export, correction and deletion requests where applicable.
- Minimise collected data and define retention periods per data type.
- Protect credentials, tokens, attachments and customer conversations (encryption at rest and in transit).
- Clearly distinguish demo data, AI drafts and real messages in the UI.

## 4. AI Ethics

- AI suggestions must not invent prices, availability, refunds, delivery promises or business policies.
- Staff review AI drafts before sending by default.
- Sensitive replies require configured human approval.
- Manual replying must remain available if AI is unavailable or fails.
- Tell staff when content is AI-generated or AI-assisted (clear labelling in the composer).

## 5. Reminders

- Reminders are internal only for staff, managers and owners.
- Business Paddy must never send customer reminders as part of this feature.
- Reminders create in-app or staff notifications linked to the relevant conversation or task.

## 6. Accountability

- Publish an Acceptable Use Policy, privacy notice, abuse-reporting process, suspension process and appeal process.
- Flag legal and platform requirements for professional review; do not claim compliance without evidence.
- Do not claim that the product prevents every scam, ban, hack or legal violation.
- Maintain audit logs for administrative changes, ownership transfers, permission grants/revocations and messaging actions.

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

**Payments:** Paystack
- Preferred payment provider
- **Payment purpose marked for clarification** — unresolved whether: businesses pay Business Paddy for access; customers pay connected businesses; or both. Do not assume who receives funds or invent prices.
- Secure checkout, server-side verification, authenticated webhooks, duplicate protection, transaction history
- Separate test and live configuration
- Platform subscriptions and merchant payments kept separate

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

Instructed the AI to rename the product requirements file from Business_Paddy_PRD.md.md to PRD.md so the assessment grader can identify it.

Instructed the AI to correct the filename from Business-Paddy.md to PRD.md so the assessment grader can identify the product requirements document.

Instructed the AI to add FR33a Business Performance View, a Business Performance View section, and the ability for every business owner to compare received, answered, unanswered, response rate, average reply time, resolved conversations, and customer satisfaction, with staff/team filtering for businesses with staff.

Instructed the AI to update the document Version from 1.0 to 1.1.

Instructed the AI to add the implementation plan (6 phases), final architecture (Next.js/TypeScript, PostgreSQL/Docker, Better Auth, local mock files → Cloudflare R2, Caddy later, Paystack later, Resend/ZeptoMail/SES later, local hosting, no Supabase), assessment scope (mock data only, one page, no auth/db/payments/email/cloud/deployment), and record the steering decision: the AI recommended SQLite but the user selected PostgreSQL because Business Paddy will support multiple businesses, staff accounts and many conversations, and the user wants to avoid migrating databases later.

Switched from OpenCode to Cursor because OpenCode timed out. Instructed the AI in Cursor to create design.html in the project root as a responsive Business Paddy shared-inbox design preview using mock data only (HTML, CSS and simple JavaScript; no installs or external services), including left navigation, WhatsApp/Instagram/email sample conversations, customer names, previews, channel badges, statuses, selected conversation, reply input with a styled Send Reply button, owner performance cards for received/answered/unanswered conversations, and a mobile-friendly layout. Recorded this design preview request in the steering log.

Instructed the AI to refine design.html by replacing the green colour scheme with a vibrant navy-blue and warm beige colour scheme, using navy blue as the main brand colour, beige for backgrounds and cards, and strong contrast so all text and buttons remain easy to read.

Instructed the AI to create a separate working prototype named exactly index.html using mock data only, keep the navy-blue and beige design, and make conversation selection, channel filtering, mock replies, and answered/unanswered performance updates work on desktop and mobile. Recorded that Phase 1 initial local prototype is completed, and that the next phase is connecting real accounts, authentication and PostgreSQL later.

Instructed the AI to update PRD with eight product additions: (1) detailed WhatsApp/Instagram/TikTok/Email channel integrations with official APIs and verified requirements, (2) Slate Blue and White default interface, (3) business branding with logo, name, presets, custom accents, logo colour suggestions, (4) owner/manager permission delegation with configurable permissions and audit log, (5) manager-led workspace setup and secure ownership handover, (6) reminders restricted to internal staff only (schedule, assign, snooze, reschedule, complete, cancel) with customer reminders removed, (7) ethics/privacy/security controls including opt-out, business separation, RBAC, secure credentials, safe uploads, validated webhooks, audit history, retention/export/deletion, backups, transparent monitoring, AI/delivery state distinction, no overpromises, (8) Paystack integration with payment purpose marked for clarification. Updated implementation plan across six phases to incorporate these additions. Preserved existing requirements and working features.

Instructed the AI to remove all deadlines, date targets and delivery dates from the PRD, implementation plan and AI Steering Log. Corrected reminder requirements: strictly internal, for owners/managers/staff only, create/assign/schedule/snooze/reschedule/complete/cancel, in-app or staff notifications linked to conversation/task, never send messages to customers, removed all customer-reminder/external-reminder/customer-consent/customer-opt-out/customer-channel-check requirements for reminders. Normal manual replies to customers still follow channel rules.

Instructed the AI to add saved conversation history requirements (FR41-FR44): Business Paddy saves authorised conversation history per business including incoming messages, staff replies, customer/channel details, timestamps, assignees, reassignments, internal notes, status changes, escalations, approvals, attachments, and internal reminder activity. Each business's history kept separate; demo data separated from real data; no real customer data in public repository. Provider message IDs stored when available. Channel inbox mirroring verified per channel (WhatsApp, Instagram, TikTok, email) — not assumed. Staff search/view by permissions; owners/managers review permitted history. Updated implementation plan: Phase 1 adds history schema, provider ID tracking, mirroring flags, search API; Phase 2 adds business-separated history and access control; Phase 6 adds mirroring verification and provider ID capture in channel integrations.

Instructed the AI to add an Ethics, Privacy and Business Verification section with six areas: (1) Business verification — verified email/phone, business details, OAuth-only channel connections, no password storage, document verification for high-risk accounts, restricted document access; (2) Abuse prevention — prohibits spam/phishing/impersonation/harassment/scraping/circumvention, sending limits by trust level, suspicious activity detection, channel disconnect/suspend/appeal, report/block, audit logs; (3) Privacy and security — RBAC, business data isolation, consent/opt-out/export/correction/deletion, data minimisation, retention periods, encryption, demo/AI/real message distinction; (4) AI ethics — no invented prices/policies, review-before-send default, sensitive-reply approval, manual fallback, AI-generated labelling; (5) Reminders — internal only for staff/managers/owners, never sent to customers, in-app notifications linked to conversation/task; (6) Accountability — Acceptable Use Policy, privacy notice, abuse reporting, suspension/appeal processes, legal/platform review flags, no overclaims. Updated implementation plan across all six phases identifying implemented (mock), missing, and production-ready controls.

Instructed the AI to implement Phase 1 as a working Next.js 14 web application: converted the index.html prototype into a clean Next.js App Router project with TypeScript, component-based architecture (Navigation, InboxList, ConversationThread, MetricCards, UI primitives), custom hook (useInbox) for all state logic, mock data module, and complete navy-blue + off-white design system in globals.css. All features working: channel filters, conversation selection, mock replies with real-time metric updates, mobile responsive nav/back. No database, auth, Docker, or real integrations. Created README.md with run instructions. Preserved index.html, design.html, and PRD.md unchanged. Ready for Phase 2 (PostgreSQL, Better Auth, real channel integrations).

Instructed the AI to add TikTok to the existing Next.js inbox only, without redesign or removing any feature: TikTok filter placed last (All | WhatsApp | Instagram | Email | TikTok) in one horizontal scrollable line; one mock TikTok conversation (Adaeze Nwosu, New, unassigned) added to existing mock data; TikTok badge style added; TikTok thread opens on click with message history; mock replies work and update metrics (9 received, 5 answered, 4 unanswered); existing WhatsApp, Instagram and Email conversations unchanged; navy-blue and off-white design preserved; fixed two pre-existing TypeScript status-class type errors; verified all filters, all conversations and clean compile.

Instructed the AI to reorganise the PRD implementation plan so Paddy Chat is a core Phase 1 channel before Phase 2: Phase 1 split into 1A Next.js inbox prototype (completed), 1B PostgreSQL storage, 1C Better Auth and business workspaces, 1D customer records and saved conversation history, 1E Paddy Chat guest conversations and secure return links, 1F optional customer-contact saving after resolved chat or completed deal, 1G Paddy Chat security, accessibility, voice notes and service reply notifications, 1H WhatsApp Cost and Safety Centre; Phase 2 begins only after 1A–1H are working and tested. Preserved all existing requirements and completed work. Documentation only, no build or interface changes.