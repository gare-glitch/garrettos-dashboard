'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';

/** Calm agent thinking / code generation loader — subtle dot pulse */
export function ThinkingLoader({
  label = 'Processing',
  className,
}: {
  label?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <span className={cn(typography.mono, className)} role="status" aria-live="polite">
        {label}…
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-primary/70"
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
            ease: 'easeInOut',
          }}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** Terminal-style line reveal for code generation output */
export function CodeLineLoader({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('space-y-2', className)} aria-busy aria-label="Generating output">
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-3 rounded-sm bg-white/5"
          initial={reduceMotion ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { delay: i * 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }
          }
          style={{ originX: 0 }}
        />
      ))}
    </div>
  );
}
