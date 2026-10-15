import type { Metadata } from 'next';
import { PublicInfoLayout } from '@/components/PublicInfoLayout';
export const metadata: Metadata = { title: 'Privacy notice | Business Paddy' };
export default function PrivacyPage() {
  return <PublicInfoLayout title="Privacy notice">
    <p>Last updated: 15 October 2026.</p>
    <h2>Information processed</h2>
    <p>When you create an account or use a workspace, Business Paddy processes account and business details, team membership, customer contact information, conversations, attachments, reminders and activity records that you or your customers provide. Authentication uses session cookies. Hosting and service providers may also process technical request information to operate the service.</p>
    <h2>Why we use information</h2>
    <p>We use this information to provide the shared inbox, authenticate users, organise conversations, support team workflows, investigate problems and respond to support or privacy requests. Workspace owners and authorized staff can access information available to their roles.</p>
    <h2>Connected services</h2>
    <p>If you authorize a supported messaging or email connection, Business Paddy processes account identifiers, authorization credentials and messages needed for that connection. Information is exchanged with the selected provider to receive messages and send replies. Connections require configuration and approval; demonstration data does not send real messages.</p>
    <p>Infrastructure and communication providers process information needed to host the application, store workspace data or deliver enabled messages and emails. Their processing is also governed by their own terms and privacy notices. We do not sell customer conversations or use them for advertising.</p>
    <h2>Storage and retention</h2>
    <p>Workspace information is stored in the application database and configured file storage. Retention and deletion are currently handled through support rather than an automated deletion schedule. Disconnecting a channel does not automatically erase conversation history or copies held by the external provider. Contact us about the scope and timing of a deletion request.</p>
    <h2>Your choices and requests</h2>
    <p>You can contact us to request access, correction or deletion of information associated with your account. If you are a customer of a business using Business Paddy, contact that business first where possible, or identify it in your request so we can help locate the relevant workspace. We may need to verify your identity and authority before making changes.</p>
    <p>See our <a href="/data-deletion">data deletion instructions</a>. Changes to this notice will be published here with an updated date.</p>
  </PublicInfoLayout>;
}
