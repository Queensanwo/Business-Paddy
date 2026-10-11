import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SwRegister } from '@/components/SwRegister';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#123a8a',
};

export const metadata: Metadata = {
  title: 'Business Paddy — Shared Inbox',
  description: 'One place to receive and answer customer conversations from WhatsApp, Instagram, TikTok, email and website.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Business Paddy' },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
