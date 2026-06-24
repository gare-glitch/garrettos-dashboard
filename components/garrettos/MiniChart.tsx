'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function MiniChart({
  values,
  label,
  className,
  height = 'h-24',
}: {
  values: number[];
  label: string;
  className?: string;
  height?: string;
}) {
  const max = Math.max(...values, 1);
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn('flex items-end gap-1 rounded-xl border border-border bg-input/40 p-2', height, className)}
      role="img"
      aria-label={label}
    >
      {values.map((value, index) => (
        <motion.span
          key={`${value}-${index}`}
          initial={reduceMotion ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          style={{ height: `${Math.max(8, (value / max) * 100)}%`, originY: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: index * 0.03, type: 'spring', stiffness: 300, damping: 26 }}
          className="min-w-[6px] flex-1 rounded-sm bg-cyan/80"
        />
      ))}
    </div>
  );
}
