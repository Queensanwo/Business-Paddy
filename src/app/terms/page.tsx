import type { Metadata } from 'next';
import { PublicInfoLayout } from '@/components/PublicInfoLayout';
export const metadata: Metadata = { title: 'Terms of use | Business Paddy' };
export default function TermsPage() {
  return <PublicInfoLayout title="Terms of use">
    <p>Last updated: 15 October 2026.</p>
    <h2>Using Business Paddy</h2>
    <p>Business Paddy is operated by Ohevlishon Enterprise and is currently under development. Features and availability may change. Demonstration conversations are fictional, and external channels work only after the required connection and provider authorization are completed.</p>
    <h2>Your responsibilities</h2>
    <p>Provide accurate account details, protect your login and connect only accounts you are authorized to manage. Workspace owners are responsible for staff access and for having permission to process customer information and send messages.</p>
    <p>Do not use Business Paddy for spam, fraud, harassment, unauthorized access or unlawful content. Connected services, including Meta and email providers, have their own rules and charges that also apply.</p>
    <h2>Availability and support</h2>
    <p>Development and third-party services can affect availability. Do not rely on the current development version as your only copy of important business records. Contact support to report problems, request account closure or ask about enabled features.</p>
    <h2>Privacy and updates</h2>
    <p>Our <a href="/privacy">privacy notice</a> explains how information is handled. Updates to these terms will be published on this page. Contact Ohevlishon Enterprise with questions before using the service.</p>
  </PublicInfoLayout>;
}
