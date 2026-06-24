'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { ScrollReveal } from './ScrollReveal';

export function RevenueChart({
  values,
  label,
  className,
  height = 'h-20',
  highlightLast = true,
}: {
  values: number[];
  label: string;
  className?: string;
  height?: string;
  highlightLast?: boolean;
}) {
  const max = Math.max(...values, 1);
  const reduceMotion = useReducedMotion();

  return (
    <ScrollReveal className={className}>
      <div className={cn('relative flex items-end gap-1', height)} role="img" aria-label={label}>
        {values.map((value, index) => {
          const isLast = index === values.length - 1;
          const pct = Math.max(12, (value / max) * 100);

          return (
            <motion.div
              key={`${value}-${index}`}
              className={cn(
                'flex-1 rounded-t-sm transition-colors',
                isLast && highlightLast
                  ? 'bg-primary glow-primary'
                  : 'bg-primary/25 hover:bg-primary/50',
              )}
              initial={reduceMotion ? false : { height: 0 }}
              whileInView={{ height: `${pct}%` }}
              viewport={{ once: true }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
              style={{ alignSelf: 'flex-end' }}
            />
          );
        })}
      </div>
    </ScrollReveal>
  );
}

export function RevenueSummary({
  total,
  delta,
  className,
}: {
  total: string;
  delta?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between', className)}>
      <div>
        <p className={typography.labelCaps}>Daily Revenue</p>
        <p className={typography.headlineMd}>{total}</p>
      </div>
      {delta ? (
        <span className="label-caps text-primary">{delta}</span>
      ) : null}
    </div>
  );
}
