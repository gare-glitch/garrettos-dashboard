'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems, ticker } from '@/data/mock';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className="app-shell">
    <header className="topbar">
      <Link href="/" className="brand" aria-label="GarrettOS home"><span className="logo">G</span><span><strong>GarrettOS</strong><small>Private OpenClaw dashboard</small></span></Link>
      <span className="auth-pill">Supabase gated</span>
    </header>
    <div className="ticker" aria-label="status ticker">{ticker.map((item) => <span className="tick" key={item.label}><b>{item.label}</b><em className={item.tone}>{item.value}</em></span>)}</div>
    <main className="content">{children}</main>
    <nav className="bottom-nav" aria-label="Primary dashboard navigation">{navItems.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}><span>{item.short}</span></Link>)}</nav>
  </div>;
}
