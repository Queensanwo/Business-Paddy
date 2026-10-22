# Business Paddy: owner overview

## Purpose
Help a business owner travel or step away while retaining visibility into customer conversations, team assignments and submitted customer feedback.

## Where to find it
After this change is deployed, sign in as the business owner and choose **Owner overview** in the navigation, or visit `/owner`. The overview is read-only. Choose **Open full conversation** to use the existing inbox actions such as reply, assignment and escalation.

## Included in this version
- Private owner-only page and API, with server-side role checks against the current user record.
- Workspace-wide counts of open conversations, conversations needing attention and unassigned open conversations.
- Actual Helpful / Not helpful customer feedback, with the number of submitted ratings. No rating is shown when none exists.
- Open conversation assignments for each team member, including the owner.
- Conversation briefings: customer, channel, current status, current assignee, customer feedback and three recent message excerpts. Automatic greetings are explicitly labelled.
- All / Need attention / Customer ratings filters and 20-item pagination, most recently updated first.
- Refresh every 30 seconds while the page is visible, manual refresh, last-update timestamp and retry/error states.
- A visible demo-workspace notice. Data stays scoped to the signed-in user's workspace.
- Direct links to the selected conversation, with a safe fallback when the ID does not exist in the user's inbox.

## What the figures mean
Figures are all-time for this workspace, not a daily report. Open means the status is not Resolved. Needs attention means New, Follow-up, Needs approval or Escalated; it is not a calculation of how long a customer has been waiting. Team workload describes current assignments, not historical reply authorship. Helpful percentage is Helpful / (Helpful + Not helpful).

The current customer-feedback collection is Paddy Chat's existing post-resolution feedback flow. This change does not collect ratings from WhatsApp, Instagram or email. Briefings are excerpts of stored messages, not AI-generated summaries, sentiment analysis, or verified statements of customer intent. They do not send messages to an external AI service or add an AI usage cost.

## Deployment and data
No schema migration, new package, new service or environment variable is needed. Use the existing database and authentication configuration. This change does not merge or deploy itself. After review, merge through the project's normal GitHub/Netlify process.

## Validation
Run:

```sh
npm ci
npx prisma generate
npx tsc --noEmit
node --test tests/owner-overview.test.cjs
npm run build
```

The seven API tests cover signed-out and non-owner rejection, workspace scoping even when a foreign workspace ID is supplied, bounded result projections, submitted-rating math, automatic greeting labels, empty data, invalid filters/pagination and safe errors. Tests mock the database and session; they are not a production database integration test.

Before release, use a test workspace to verify an owner, manager and agent login; ratings and unrated conversations; mobile navigation; conversation links; and a network failure during refresh. A second workspace should show only its own records. Production customer data was not used during implementation.

## Next stage
Consider a date-range selector, an explicit latest-customer-message waiting calculation, broader channel feedback collection, and optional AI summaries after separately agreeing their privacy, accuracy and cost requirements.

## Implementation check — 22 October 2026
TypeScript validation, all seven API tests, and the production build completed successfully. The build emitted existing-app authentication configuration and dynamic-route warnings in this environment, which does not have the production secrets or database. Signed-in browser testing against real data remains a release check.
