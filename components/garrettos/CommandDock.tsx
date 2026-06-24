'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Bot,
  Brain,
  Command,
  Dumbbell,
  Droplets,
  HeartPulse,
  Home,
  Settings,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { navItems, type NavItem } from '@/data/mock';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GlassPanel } from './GlassPanel';

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

export function CommandDock({
  onCommandOpen,
  className,
}: {
  onCommandOpen?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6',
        className,
      )}
      aria-label="Primary command dock"
    >
      <GlassPanel className="glow-ring mx-auto w-full max-w-4xl p-1.5 shadow-2xl md:p-2">
        <div className="flex items-center gap-1">
          {onCommandOpen ? (
            <button
              type="button"
              onClick={onCommandOpen}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-input/50 text-muted-foreground transition-colors hover:text-foreground md:size-11"
              aria-label="Open command palette"
            >
              <Command className="size-4" />
            </button>
          ) : null}
          <ScrollArea className="flex-1">
            <div className="flex w-max min-w-full gap-0.5 md:gap-1">
              {navItems.map((item) => {
                const Icon = navIcons[item.icon];
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex min-w-[3.75rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[9px] font-semibold md:min-w-[4.5rem] md:px-2.5 md:py-2 md:text-[10px]',
                      active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="command-dock-active"
                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-xl border border-cyan/30 bg-cyan/15"
                      />
                    )}
                    <span className="relative z-10 flex flex-col items-center gap-0.5">
                      <Icon className="size-3.5 md:size-4" strokeWidth={active ? 2.25 : 2} />
                      <span className="truncate">{item.short}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="md:hidden" />
          </ScrollArea>
        </div>
      </GlassPanel>
    </nav>
  );
}
