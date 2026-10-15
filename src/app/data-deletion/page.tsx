import type { Metadata } from 'next';
import { PublicInfoLayout } from '@/components/PublicInfoLayout';
export const metadata: Metadata = { title: 'Data deletion requests | Business Paddy' };
export default function DataDeletionPage() {
  return <PublicInfoLayout title="Data deletion requests">
    <p>To request deletion of your Business Paddy account or associated information, email <a href="mailto:businesspaddysupport@gmail.com?subject=Business%20Paddy%20data%20deletion%20request">businesspaddysupport@gmail.com</a> with the subject “Business Paddy data deletion request”.</p>
    <ol style={{ paddingLeft: '24px' }}>
      <li>Identify your account email and the business or workspace involved.</li>
      <li>Explain whether you are requesting deletion of an account, a connection or particular customer information. If a connected Facebook, Instagram or WhatsApp account is involved, include its public account name or business number.</li>
      <li>We will review the request, verify identity or workspace authority as needed, and explain the deletion scope and any information that must be retained.</li>
    </ol>
    <p>Do not include passwords, tokens, full conversation histories or identity documents in your initial email. We will explain any further verification needed.</p>
    <p>Requests are handled manually. Disconnecting a provider is separate from deleting stored conversations. Deletion from Business Paddy does not automatically delete information held by Meta, email providers or other businesses.</p>
  </PublicInfoLayout>;
}
