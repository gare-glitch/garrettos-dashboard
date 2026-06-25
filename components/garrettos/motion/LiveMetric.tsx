'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { useMotionPreferences } from './MotionProvider';
import { AnimatedCounter } from './AnimatedCounter';

type Liveness = 'live' | 'active' | 'idle' | 'stale';

const livenessPulse: Record<Liveness, boolean> = {
  live: true,
  active: true,
  idle: false,
  stale: false,
};

const livenessTone: Record<Liveness, 'good' | 'info' | 'idle' | 'warn'> = {
  live: 'good',
  active: 'good',
  idle: 'idle',
  stale: 'warn',
};

/**
 * LiveMetric — a metric value that feels alive.
 *  - counts up on reveal (delegates to AnimatedCounter)
 *  - active/live statuses breathe a subtle sand glow behind the number
 *  - idle/stale statuses stay calm (no pulse)
 *
 * Use for revenue, agent counts, memory chunks, API calls, Garmin scores —
 * anything that represents a live system reading.
 */
export function LiveMetric({
  label,
  value,
  suffix,
  prefix,
  liveness = 'active',
  delta,
  className,
  size = 'md',
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  liveness?: Liveness;
  delta?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const pulse = livenessPulse[liveness] && ambientEnabled && !reduceMotion;

  const sizeClass = size === 'lg' ? typography.metric : size === 'sm' ? typography.metricMd : typography.metricMd;

  return (
    <div className={cn('flex flex-col', className)}>
      <span className={typography.labelCaps}>{label}</span>
      <div className="relative mt-1 flex items-baseline gap-2">
        {pulse ? (
          <motion.span
            aria-hidden
            className="absolute -inset-x-1 -inset-y-0.5 rounded-md blur-[6px]"
            style={{ background: 'rgba(236,189,164,0.18)' }}
            animate={{ opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}
        <AnimatedCounter
          value={value}
          suffix={suffix}
          prefix={prefix}
          className={cn(sizeClass, 'relative', pulse && 'text-primary')}
        />
        {delta ? (
          <span
            className={cn(
              'relative text-[11px] font-medium',
              livenessTone[liveness] === 'good' ? 'text-secondary' : livenessTone[liveness] === 'warn' ? 'text-primary' : 'text-outline',
            )}
          >
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
