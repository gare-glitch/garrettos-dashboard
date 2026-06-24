'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function MiniChart({ values, label, className }: { values: number[]; label: string; className?: string }) {
  const max = Math.max(...values);
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'flex h-32 items-end gap-2 rounded-2xl border border-border bg-input/60 p-3 md:h-36',
        className,
      )}
      aria-label={label}
    >
      {values.map((value, index) => (
        <motion.span
          key={`${value}-${index}`}
          initial={reduceMotion ? false : { height: 0, opacity: 0.4 }}
          animate={{ height: `${Math.max(12, (value / max) * 100)}%`, opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: index * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
          className="min-w-[10px] flex-1 rounded-full rounded-b-sm bg-gradient-to-t from-violet to-cyan"
        />
      ))}
    </div>
  );
}
