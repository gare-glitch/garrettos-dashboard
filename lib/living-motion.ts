/**
 * Living motion presets — expressive but calm extensions to lib/motion.ts.
 * Use these for tactile, reactive, and ambient motion (M6 living motion system).
 * All presets must be passed through motionSafe() when reduced motion is on.
 */

import type { Transition, Variants } from 'framer-motion';

/** Slower, softer spring for ambient drift and orb motion */
export const ambientSprings = {
  drift: { type: 'spring' as const, stiffness: 120, damping: 22, mass: 1.1 },
  orb: { type: 'spring' as const, stiffness: 90, damping: 18, mass: 1.4 },
} as const;

/** Magnetic / tactile springs — snappy but never bouncy */
export const tactileSprings = {
  magnetic: { type: 'spring' as const, stiffness: 300, damping: 22 },
  click: { type: 'spring' as const, stiffness: 600, damping: 18 },
  morph: { type: 'spring' as const, stiffness: 380, damping: 30 },
} as const;

/** Fluid glass hover/active transitions */
export const glassTransitions = {
  shimmer: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  settle: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
} as const;

/** Route transition variants — subtle fade + slide, never layout-breaking */
export const routeVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

/** Stagger tuned for command palette / recent lists — slightly tighter than default */
export const paletteStagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.035, delayChildren: 0.04 },
  },
};

export const paletteItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
};

/** Counter reveal — used by LiveMetric / PulseNumber for the count-up entrance */
export const counterReveal: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

/** Dock morph — indicator that morphs between items */
export const dockMorph: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.04, transition: tactileSprings.magnetic },
  tap: { scale: 0.94, transition: tactileSprings.click },
};

/** Orb thinking — slow concentric breathing for AgentThinkingOrb */
export const orbBreath: Variants = {
  breathe: {
    scale: [1, 1.06, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
  },
};

/** Constellation — slow drifting particles for LoadingConstellation */
export const constellationDrift = (i: number): Variants => ({
  drift: {
    x: [0, (i % 3 === 0 ? 6 : -6), 0],
    y: [0, (i % 2 === 0 ? -4 : 4), 0],
    opacity: [0.3, 0.7, 0.3],
    transition: { duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 },
  },
});

/** Code generation stream — line reveal */
export const codeLineReveal: Variants = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

/** Helper: collapse any transition to instant under reduced motion */
export function livingMotionSafe<T extends Transition>(
  transition: T,
  reduceMotion: boolean | null,
): T | { duration: 0 } {
  return reduceMotion ? { duration: 0 } : transition;
}
