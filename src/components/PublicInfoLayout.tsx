import Link from 'next/link';
import type { ReactNode } from 'react';

export function PublicInfoLayout({ title, children }: { title: string; children: ReactNode }) {
  return <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px', lineHeight: 1.75, overflowWrap: 'anywhere', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Link href="/">← Business Paddy</Link>
    <h1>{title}</h1>
    <p>Business Paddy is a product of Ohevlishon Enterprise.</p>
    {children}
    <hr />
    <p>Contact: <a href="mailto:businesspaddysupport@gmail.com">businesspaddysupport@gmail.com</a></p>
    <nav aria-label="Business information" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      <Link href="/contact">About and contact</Link><Link href="/privacy">Privacy notice</Link>
      <Link href="/terms">Terms of use</Link><Link href="/data-deletion">Data deletion requests</Link>
    </nav>
  </main>;
}
