/** GarrettOS motion presets — calm, premium (Stitch-aligned) */

import type { Transition, Variants } from 'framer-motion';

export const springs = {
  default: { type: 'spring' as const, stiffness: 420, damping: 34 },
  soft: { type: 'spring' as const, stiffness: 260, damping: 28 },
  dock: { type: 'spring' as const, stiffness: 380, damping: 28, mass: 0.8 },
  palette: { type: 'spring' as const, stiffness: 400, damping: 32 },
} as const;

export const fades = {
  fast: { duration: 0.15, ease: [0.22, 1, 0.36, 1] as const },
  normal: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  slow: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
} as const;

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: springs.soft,
  },
};

export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springs.soft, duration: 0.35 },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: fades.normal },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: springs.palette },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: springs.soft },
};

export const dockItem: Variants = {
  idle: { scale: 1 },
  active: { scale: 1.05, transition: springs.dock },
  tap: { scale: 0.95 },
};

/** Returns transition or instant when reduced motion preferred */
export function motionSafe<T extends Transition>(
  transition: T,
  reduceMotion: boolean | null,
): T | { duration: 0 } {
  return reduceMotion ? { duration: 0 } : transition;
}
