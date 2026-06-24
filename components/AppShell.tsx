'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Bot,
  Brain,
  Dumbbell,
  Droplets,
  HeartPulse,
  Home,
  Settings,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { navItems, ticker, type NavItem, type TickerTone } from '@/data/mock';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const navIcons: Record<NavItem['icon'], LucideIcon> = {
  home: Home,
  health: HeartPulse,
  gym: Dumbbell,
  water: Droplets,
  mentor: Sparkles,
  openclaw: Bot,
  memory: Brain,
  system: Activity,
  projects: TrendingUp,
  settings: Settings,
};

const toneVariant: Record<TickerTone, 'success' | 'warning' | 'default'> = {
  good: 'success',
  warn: 'warning',
  info: 'default',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-7xl px-4 pb-28 pt-4 md:px-6 md:pb-32 md:pt-6">
      <header className="glass-panel glow-ring sticky top-3 z-30 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 md:top-4 md:rounded-3xl md:px-5">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="GarrettOS home">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-violet text-base font-black text-primary-foreground shadow-lg shadow-cyan/25 transition-transform group-hover:scale-105">
            G
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-semibold tracking-tight md:text-base">GarrettOS</strong>
            <small className="block truncate text-xs text-muted-foreground">Private AI operating system</small>
          </span>
        </Link>
        <Badge variant={authBypassEnabled ? 'warning' : 'secondary'} className="shrink-0">
          {authBypassEnabled ? 'Auth bypass' : 'Supabase gated'}
        </Badge>
      </header>

      {authBypassEnabled && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm font-medium text-amber"
          role="status"
        >
          Auth bypass enabled — private mode not fully secured.
        </motion.div>
      )}

      <ScrollArea className="mt-4 w-full whitespace-nowrap md:mt-5">
        <div className="flex w-max gap-2 pb-2" aria-label="status ticker">
          {ticker.map((item) => (
            <div
              key={item.label}
              className="glass-panel flex items-center gap-2 rounded-full px-3 py-2 text-xs md:text-sm"
            >
              <span className="font-semibold text-foreground">{item.label}</span>
              <Badge variant={toneVariant[item.tone]}>{item.value}</Badge>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <main className="mt-5 md:mt-6">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6"
        aria-label="Primary dashboard navigation"
      >
        <div className="glass-panel glow-ring mx-auto w-full max-w-4xl rounded-2xl p-2 shadow-2xl md:rounded-3xl md:p-2.5">
          <ScrollArea className="w-full">
            <div className="flex w-max min-w-full gap-1 md:gap-1.5">
              {navItems.map((item) => {
                const Icon = navIcons[item.icon];
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex min-w-[4.5rem] flex-col items-center gap-1 rounded-xl px-2.5 py-2 text-[10px] font-semibold transition-colors md:min-w-[5.5rem] md:px-3 md:py-2.5 md:text-xs',
                      active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan to-violet shadow-lg shadow-cyan/20"
                      />
                    )}
                    <span className="relative z-10 flex flex-col items-center gap-1">
                      <Icon className="size-4 md:size-[18px]" strokeWidth={active ? 2.25 : 2} />
                      <span>{item.short}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="md:hidden" />
          </ScrollArea>
        </div>
      </nav>
    </div>
  );
}
