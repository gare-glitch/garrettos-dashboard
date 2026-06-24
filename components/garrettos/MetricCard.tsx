'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from './GlassPanel';
import { StatusChip } from './StatusChip';
import type { StatusTone } from './types';

export function MetricCard({
  label,
  value,
  delta,
  tone = 'idle',
  sparkline,
  footer,
  className,
  compact,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  tone?: StatusTone;
  sparkline?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <GlassPanel
      className={cn(compact ? 'p-3' : 'p-4 md:p-5', className)}
      as="article"
      aria-label={label}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <p className={typography.eyebrow}>{label}</p>
          {delta ? <StatusChip label={delta} tone={tone === 'idle' ? 'info' : tone} /> : null}
        </div>
        <div className={compact ? 'text-2xl font-bold tabular-nums' : typography.metric}>{value}</div>
        {sparkline}
        {footer ? <p className={typography.body}>{footer}</p> : null}
      </motion.div>
    </GlassPanel>
  );
}
