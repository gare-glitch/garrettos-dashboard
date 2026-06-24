import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

export const metadata: Metadata = {
  title: 'GarrettOS',
  description: 'Private Rowan-style OpenClaw personal dashboard',
  appleWebApp: { capable: true, title: 'GarrettOS', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#06151e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..400,0..1,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
