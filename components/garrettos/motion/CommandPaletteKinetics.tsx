'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMotionPreferences } from './MotionProvider';
import { paletteItem, paletteStagger, tactileSprings } from '@/lib/living-motion';
import { scaleIn } from '@/lib/motion';

/**
 * CommandPaletteKinetics — the motion layer for the command palette overlay.
 *
 * Wraps the palette body and provides:
 *  - open/close with blur + scale + opacity (backdrop and panel)
 *  - recent commands stagger in
 *  - selected item slides/morphs smoothly (active highlight uses layoutId)
 *
 * This is a presentational wrapper; the palette's search/keyboard logic stays
 * in CommandPalette.tsx. Drop <CommandPaletteKinetics open>…</> around content.
 */
export function CommandPaletteKinetics({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { routeTransitionsEnabled } = useMotionPreferences();
  const animate = routeTransitionsEnabled && !reduceMotion;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={animate ? { opacity: 0 } : undefined}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[10vh] backdrop-blur-md"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            variants={scaleIn}
            initial={animate ? 'hidden' : false}
            animate="visible"
            exit={animate ? 'hidden' : undefined}
            transition={animate ? tactileSprings.morph : { duration: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn('w-full max-w-xl', className)}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Stagger wrapper for the recent commands / grouped list */
export function PaletteStaggerList({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={paletteStagger}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Single staggered palette item */
export function PaletteStaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={paletteItem}
      className={className}
      transition={reduceMotion ? { duration: 0 } : undefined}
    >
      {children}
    </motion.div>
  );
}

/**
 * PaletteActiveHighlight — the sand highlight that morphs between items as the
 * user arrows up/down. Uses a shared layoutId so it slides smoothly.
 */
export function PaletteActiveHighlight({
  active,
  layoutId = 'palette-active',
  className,
}: {
  active: boolean;
  layoutId?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (!active) return null;
  return (
    <motion.span
      layoutId={layoutId}
      className={cn('absolute inset-0 rounded-lg bg-primary/10', className)}
      transition={reduceMotion ? { duration: 0 } : tactileSprings.morph}
      aria-hidden
    />
  );
}
