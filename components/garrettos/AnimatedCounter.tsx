'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
/** Animated counter with calm ease-out — NumberTicker-style without flashy effects */
export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  className,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value);
  const reduceMotion = useReducedMotion();
  const prev = useRef(value);

  useEffect(() => {
    if (reduceMotion || prev.current === value) {
      setDisplay(value);
      prev.current = value;
      return;
    }

    const start = prev.current;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + diff * eased;
      setDisplay(decimals > 0 ? parseFloat(next.toFixed(decimals)) : Math.round(next));
      if (t < 1) frame = requestAnimationFrame(tick);
      else prev.current = value;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion, decimals]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : display.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <span
      className={cn(typography.metric, 'tabular-nums', className)}
      aria-live="polite"
      aria-atomic="true"
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/** Compact metric counter for cards and telemetry */
export function MetricCounter({
  value,
  suffix = '',
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <AnimatedCounter
      value={value}
      suffix={suffix}
      className={cn(typography.metricMd, className)}
    />
  );
}

