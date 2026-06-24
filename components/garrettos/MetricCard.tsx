'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { slideUp } from '@/lib/motion';
import { GlassPanel } from './GlassPanel';
import { StatusChip } from './StatusChip';
import type { StatusTone } from './types';

const metricVariants = cva('', {
  variants: {
    variant: {
      hero: 'p-5 md:p-6',
      compact: 'p-3',
      sparkline: 'p-4 md:p-5',
      progress: 'p-4 md:p-5',
      dual: 'p-4 md:p-5',
      alert: 'p-4 md:p-5 border-l-4 border-l-error/60',
    },
  },
  defaultVariants: { variant: 'hero' },
});

export function MetricCard({
  label,
  value,
  delta,
  tone = 'idle',
  sparkline,
  footer,
  children,
  className,
  compact,
  variant,
  progress,
  secondaryLabel,
  secondaryValue,
  icon,
  empty = false,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  tone?: StatusTone;
  sparkline?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** @deprecated Use variant="compact" */
  compact?: boolean;
  variant?: 'hero' | 'compact' | 'sparkline' | 'progress' | 'dual' | 'alert';
  progress?: number;
  secondaryLabel?: string;
  secondaryValue?: React.ReactNode;
  icon?: React.ReactNode;
  empty?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const resolvedVariant = variant ?? (compact ? 'compact' : 'hero');

  if (empty) {
    return (
      <GlassPanel variant="card" className={cn(metricVariants({ variant: resolvedVariant }), className)} as="article">
        <p className={typography.labelCaps}>{label}</p>
        <p className={cn(typography.metricMd, 'mt-2 text-outline')}>—</p>
        <p className={cn(typography.body, 'mt-1')}>No data</p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      variant="card"
      interactive
      className={cn(metricVariants({ variant: resolvedVariant }), className)}
      as="article"
      aria-label={label}
    >
      <motion.div
        variants={slideUp}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        className="space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <p className={typography.labelCaps}>{label}</p>
          </div>
          {delta ? <StatusChip label={delta} tone={tone === 'idle' ? 'info' : tone} showPip /> : null}
        </div>

        {resolvedVariant === 'dual' && secondaryLabel ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={cn(typography.labelCaps, 'mb-1 normal-case tracking-normal text-[10px]')}>{label}</p>
              <div className={typography.metricMd}>{value}</div>
            </div>
            <div>
              <p className={cn(typography.labelCaps, 'mb-1 normal-case tracking-normal text-[10px]')}>
                {secondaryLabel}
              </p>
              <div className={typography.metricMd}>{secondaryValue}</div>
            </div>
          </div>
        ) : (
          <div className={resolvedVariant === 'compact' ? typography.metricMd : typography.metric}>{value}</div>
        )}

        {progress !== undefined ? (
          <div className="space-y-1">
            <div className="h-1 overflow-hidden rounded-full bg-surface-container-highest">
              <motion.div
                className={cn('h-full rounded-full bg-primary', tone === 'good' && 'glow-primary')}
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        ) : null}

        {sparkline}
        {children}
        {footer ? <p className={typography.body}>{footer}</p> : null}
      </motion.div>
    </GlassPanel>
  );
}

export type MetricCardProps = React.ComponentProps<typeof MetricCard> &
  VariantProps<typeof metricVariants>;
