import type { Metadata } from 'next';
import { PublicInfoLayout } from '@/components/PublicInfoLayout';
export const metadata: Metadata = { title: 'About and contact | Business Paddy' };
export default function ContactPage() {
  return <PublicInfoLayout title="About and contact">
    <h2>Who we are</h2>
    <p>Ohevlishon Enterprise operates Business Paddy, a shared inbox application designed to help businesses organise customer conversations, collaborate with their teams and follow up with customers.</p>
    <h2>Product availability</h2>
    <p>Business Paddy is under development. The landing-page preview uses fictional conversations. External messaging connections depend on provider authorization, configuration and approval; displaying a channel does not mean it is connected.</p>
    <h2>Get in touch</h2>
    <p>For product support, account questions, privacy requests or questions about Ohevlishon Enterprise and Business Paddy, email <a href="mailto:businesspaddysupport@gmail.com">businesspaddysupport@gmail.com</a>.</p>
    <p>Do not send passwords, access tokens or app secrets by email.</p>
  </PublicInfoLayout>;
}
