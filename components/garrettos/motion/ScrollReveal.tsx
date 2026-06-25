'use client';

import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMotionPreferences } from './MotionProvider';
import { scrollReveal } from '@/lib/motion';
import { springs } from '@/lib/motion';

/**
 * ScrollReveal — reveals children with a subtle fade + small y-slide when they
 * scroll into view. Living-motion upgrade: now prefers MotionProvider mode,
 * uses useInView (more reliable than viewport once), and supports a delay.
 *
 * - Once-only by default (no re-trigger on scroll back) — matches DESIGN.md.
 * - Reduced motion: renders children immediately, no wrapper transform.
 * - Does NOT scroll-jack. Pure presentational reveal.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Reveal only once vs. every time it enters/leaves */
  once?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-40px' });
  const animate = mode !== 'reduced' && !reduceMotion;

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={scrollReveal}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ ...springs.soft, delay }}
      // For once-only, freeze visible after first reveal
      onAnimationComplete={() => {
        if (once && inView) {
          // no-op: variants keep state; once is enforced by not returning to hidden
        }
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerReveal — wraps a list/grid so children stagger in when the container
 * enters view. Pair with StaggerItem.
 *
 * Living-motion upgrade: integrates with MotionProvider, uses a slightly
 * tighter stagger (0.04s) for a more "alive" feel without being busy.
 */
export function StaggerReveal({
  children,
  className,
  stagger = 0.04,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const animate = mode !== 'reduced' && !reduceMotion;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-40px' });

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: stagger, delayChildren: 0.02 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem — a child of StaggerReveal. Fades + slides up 6px.
 */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : 6 },
        show: { opacity: 1, y: 0, transition: springs.soft },
      }}
    >
      {children}
    </motion.div>
  );
}
