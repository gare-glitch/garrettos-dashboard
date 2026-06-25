'use client';

import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMotionPreferences } from './MotionProvider';
import { springs } from '@/lib/motion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'fade';

const directionOffset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 12 },
  down: { y: -12 },
  left: { x: 12 },
  right: { x: -12 },
  fade: {},
};

/**
 * StaggeredMotionList — a list whose items stagger in from a chosen direction
 * when scrolled into view. A richer sibling of StaggerReveal for event
 * streams, timelines, task queues, and memory rows.
 *
 * - Direction defaults to "up" (items rise into place).
 * - Per-item delay is `stagger * index`, capped at `maxDelay`.
 * - Reduced motion: renders a plain list.
 * - Does NOT animate everything at once on long pages — respects viewport.
 */
export function StaggeredMotionList<T extends { id: string }>({
  items,
  renderItem,
  className,
  direction = 'up',
  stagger = 0.05,
  maxDelay = 0.4,
  once = true,
}: {
  items: ReadonlyArray<T>;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  direction?: Direction;
  stagger?: number;
  /** Cap so long lists don't take forever to reveal the tail */
  maxDelay?: number;
  once?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const animate = mode !== 'reduced' && !reduceMotion;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-40px' });

  if (!animate) {
    return (
      <div className={className}>
        {items.map((item, i) => (
          <div key={item.id}>{renderItem(item, i)}</div>
        ))}
      </div>
    );
  }

  const offset = directionOffset[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: stagger, delayChildren: 0.02 } },
      }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          variants={{
            hidden: { opacity: 0, ...offset },
            show: {
              opacity: 1,
              x: 0,
              y: 0,
              transition: { ...springs.soft, delay: Math.min(maxDelay, i * 0.01) },
            },
          }}
        >
          {renderItem(item, i)}
        </motion.div>
      ))}
    </motion.div>
  );
}

/** A single staggered item for manual composition (when not using the list wrapper) */
export function MotionListItem({
  children,
  direction = 'up',
  delay = 0,
  className,
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const offset = directionOffset[direction];
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ ...springs.soft, delay }}
    >
      {children}
    </motion.div>
  );
}
