import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GarrettOS',
  description: 'Private Rowan-style OpenClaw personal dashboard',
  appleWebApp: { capable: true, title: 'GarrettOS', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = { themeColor: '#38bdf8', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
