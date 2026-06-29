'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-system';
import { slideUp } from '@/lib/motion';
import {
  CommandPalette,
  CommandPaletteProvider,
  useCommandPaletteContext,
} from './CommandPalette';
import { SideNavBar, SideNavDrawer } from './SideNavBar';
import { TopAppBar } from './TopAppBar';
import { AmbientMouseField, MotionProvider, RouteTransition } from './motion';
import { AppleStyleDock } from './navigation/AppleStyleDock';
import { VoiceProvider } from './speech';
import { VoiceCommandOverlay, VoiceHotkeyListener } from './voice';
import { TaskComposer, TaskComposerProvider, useTaskComposer } from './agent-ops';
import { OrchestratorProvider } from './orchestrator';

function ShellInner({ children }: { children: React.ReactNode }) {
  const { open, openPalette, closePalette, togglePalette } = useCommandPaletteContext();
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
      <AmbientMouseField />
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
              className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-body-sm text-primary"
              role="status"
            >
              Auth bypass enabled — private mode not fully secured.
            </motion.div>
          ) : null}

          <RouteTransition>{children}</RouteTransition>
        </div>
      </motion.main>

      <AppleStyleDock onCommandOpen={openPalette} />
      <CommandPalette open={open} onClose={closePalette} />
      <VoiceHotkeyListener />
      <VoiceCommandOverlay />
      <TaskComposerBridge />
    </div>
  );
}

/** Renders the TaskComposer drawer from inside the provider tree. */
function TaskComposerBridge() {
  const { open, closeComposer } = useTaskComposer();
  return <TaskComposer open={open} onClose={closeComposer} />;
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <CommandPaletteProvider>
        <TaskComposerProvider>
          <OrchestratorProvider>
            <VoiceProvider>
              <ShellInner>{children}</ShellInner>
            </VoiceProvider>
          </OrchestratorProvider>
        </TaskComposerProvider>
      </CommandPaletteProvider>
    </MotionProvider>
  );
}
