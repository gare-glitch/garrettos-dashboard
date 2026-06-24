'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-system';
import { slideUp } from '@/lib/motion';
import { CommandDock } from './CommandDock';
import { CommandPalette, useCommandPalette } from './CommandPalette';
import { SideNavBar, SideNavDrawer } from './SideNavBar';
import { StatusChip } from './StatusChip';
import { TopAppBar } from './TopAppBar';

export function Shell({ children }: { children: React.ReactNode }) {
  const { open, openPalette, closePalette, togglePalette } = useCommandPalette();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        togglePalette();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePalette]);

  return (
    <div className="relative min-h-dvh w-full">
      <TopAppBar
        onCommandOpen={openPalette}
        onMenuOpen={() => setMobileNavOpen(true)}
      />

      <SideNavBar />
      <SideNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <motion.main
        className={cn(
          spacing.topbarOffset,
          spacing.dockSafe,
          spacing.sidebarOffset,
          'min-h-dvh px-margin-mobile md:px-margin-desktop',
        )}
        variants={slideUp}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
      >
        <div className={cn('mx-auto w-full max-w-max-width', spacing.page)}>
          {authBypassEnabled ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-body-sm text-primary"
              role="status"
            >
              Auth bypass enabled — private mode not fully secured.
            </motion.div>
          ) : null}

          {children}
        </div>
      </motion.main>

      <CommandDock onCommandOpen={openPalette} />
      <CommandPalette open={open} onClose={closePalette} />
    </div>
  );
}
