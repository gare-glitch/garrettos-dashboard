'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems, ticker } from '@/data/mock';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
  return <div className="app-shell">
    <header className="topbar">
      <Link href="/" className="brand" aria-label="GarrettOS home"><span className="logo">G</span><span><strong>GarrettOS</strong><small>Private OpenClaw dashboard</small></span></Link>
      <span className="auth-pill">{authBypassEnabled ? 'Auth bypass' : 'Supabase gated'}</span>
    </header>
    {authBypassEnabled && <div className="auth-bypass-banner" role="status">Auth bypass enabled — private mode not fully secured.</div>}
    <div className="ticker" aria-label="status ticker">{ticker.map((item) => <span className="tick" key={item.label}><b>{item.label}</b><em className={item.tone}>{item.value}</em></span>)}</div>
    <main className="content">{children}</main>
    <nav className="bottom-nav" aria-label="Primary dashboard navigation">{navItems.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}><span>{item.short}</span></Link>)}</nav>
  </div>;
}
