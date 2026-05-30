import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TarımCRM',
  description: 'Çay tarımı yönetim sistemi',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/tarimcrm-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TarımCRM',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a6b1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="overscroll-none">{children}</body>
    </html>
  );
}
