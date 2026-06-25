'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMotionPreferences } from './MotionProvider';
import { dockMorph, tactileSprings } from '@/lib/living-motion';

/**
 * MorphingDockIndicator — the active-item pill for the command dock that
 * morphs between items via layoutId, with a magnetic hover and tactile click.
 *
 * Drop this inside a dock item. It renders:
 *  - the active background pill (layoutId shared across items so it slides)
 *  - the icon+label wrapper with magnetic hover + tap scale
 *
 * Pass `active` so it only renders the pill when active, and the dock maps
 * each item's MorphingDockIndicator with the same layoutId.
 */
export function MorphingDockIndicator({
  active,
  layoutId = 'command-dock-indicator',
  children,
  className,
}: {
  active: boolean;
  layoutId?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const tactile = ambientEnabled && !reduceMotion;

  return (
    <>
      {active ? (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-full bg-primary/15 ring-1 ring-primary/25"
          transition={reduceMotion ? { duration: 0 } : tactileSprings.morph}
        />
      ) : null}
      <motion.span
        className={cn('relative z-10 flex flex-col items-center gap-0.5', className)}
        variants={dockMorph}
        initial="idle"
        whileHover={tactile ? 'hover' : undefined}
        whileTap={tactile ? 'tap' : undefined}
      >
        {children}
      </motion.span>
    </>
  );
}

/**
 * DockFab — the premium plus/FAB that opens the command palette.
 * Soft magnetic hover + tactile click + a gentle idle breathing ring.
 */
export function DockFab({
  onClick,
  className,
  icon = 'add',
  iconSize = 22,
}: {
  onClick?: () => void;
  className?: string;
  icon?: string;
  iconSize?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const tactile = ambientEnabled && !reduceMotion;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={tactile ? { scale: 1.06 } : undefined}
      whileTap={tactile ? { scale: 0.94 } : undefined}
      transition={tactileSprings.click}
      className={cn(
        'relative flex size-10 items-center justify-center rounded-full bg-primary text-on-primary',
        'outline-none transition-transform focus-visible:ring-2 focus-visible:ring-primary/50',
        'md:size-11',
        className,
      )}
      aria-label="Open command palette"
    >
      {tactile ? (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: '0 0 0 1px rgba(236,189,164,0.4)' }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}
      <span className="relative flex items-center justify-center" style={{ fontSize: iconSize }}>
        <DockFabIcon name={icon} size={iconSize} />
      </span>
    </motion.button>
  );
}

// Inline icon to avoid a circular import with GarrettIcon for the default case.
function DockFabIcon({ name, size }: { name: string; size: number }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        fontVariationSettings: "'wght' 400, 'FILL' 1, 'GRAD' 0, 'opsz' 24",
        lineHeight: 1,
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}
