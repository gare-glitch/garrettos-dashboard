'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ticker, type TickerTone } from '@/data/mock';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CommandDock } from './CommandDock';
import { CommandPalette, CommandPaletteOverlay } from './CommandPalette';
import { GlassPanel } from './GlassPanel';
import { StatusChip } from './StatusChip';

const toneMap: Record<TickerTone, 'good' | 'warn' | 'info'> = {
  good: 'good',
  warn: 'warn',
  info: 'info',
};

export function Shell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[1400px] px-3 pb-24 pt-3 md:px-5 md:pb-28 md:pt-4">
      <header className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="GarrettOS home">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-cyan/20 bg-cyan/10 text-sm font-bold text-cyan">
            G
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-semibold tracking-tight">GarrettOS</strong>
            <small className="block truncate text-[10px] text-muted-foreground">Personal AI operating system</small>
          </span>
        </Link>
        <StatusChip label={authBypassEnabled ? 'Auth bypass' : 'Secured'} tone={authBypassEnabled ? 'warn' : 'good'} />
      </header>

      {authBypassEnabled ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-3 rounded-xl border border-amber/30 bg-amber/5 px-3 py-2 text-xs text-amber"
          role="status"
        >
          Auth bypass enabled — private mode not fully secured.
        </motion.div>
      ) : null}

      <div className="mb-3 md:mb-4">
        <CommandPalette />
      </div>

      <ScrollArea className="mb-4 w-full whitespace-nowrap">
        <div className="flex w-max gap-1.5 pb-1" aria-label="System status">
          {ticker.map((item) => (
            <GlassPanel key={item.label} className="flex items-center gap-2 rounded-full px-2.5 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</span>
              <StatusChip label={item.value} tone={toneMap[item.tone]} />
            </GlassPanel>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <main>{children}</main>

      <CommandDock onCommandOpen={() => setPaletteOpen(true)} />
      <CommandPaletteOverlay open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
