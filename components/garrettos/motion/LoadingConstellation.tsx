'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { useMotionPreferences } from './MotionProvider';
import { constellationDrift } from '@/lib/living-motion';

/**
 * LoadingConstellation — a quiet, scattered-dot loader for "syncing" / "indexing"
 * states (e.g. syncing memory, indexing chunks, seeding vector store).
 *
 * A small constellation of sand/sage dots drifts in place at slow, offset
 * tempos. Replaces a full-page spinner with something ambient.
 *
 * Reduced motion: dots render static.
 */
export function LoadingConstellation({
  label = 'Syncing',
  dots = 7,
  className,
}: {
  label?: string;
  dots?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const drift = ambientEnabled && !reduceMotion;

  // Deterministic pseudo-random positions so SSR matches client
  const positions = Array.from({ length: dots }, (_, i) => ({
    x: ((i * 37) % 80) - 40,
    y: ((i * 53) % 60) - 30,
    size: 2 + (i % 3),
    tone: i % 3 === 0 ? 'bg-secondary' : i % 3 === 1 ? 'bg-primary' : 'bg-tertiary',
  }));

  return (
    <div className={cn('flex items-center gap-4', className)} role="status" aria-live="polite">
      <div className="relative h-12 w-20">
        {positions.map((p, i) => (
          <motion.span
            key={i}
            className={cn('absolute rounded-full', p.tone)}
            style={{
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y}px)`,
              width: p.size,
              height: p.size,
            }}
            variants={constellationDrift(i)}
            animate={drift ? 'drift' : undefined}
          />
        ))}
      </div>
      {label ? <span className={typography.labelCaps}>{label}</span> : null}
    </div>
  );
}
