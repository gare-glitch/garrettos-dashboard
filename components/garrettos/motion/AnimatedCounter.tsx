'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { counterReveal } from '@/lib/living-motion';

/**
 * AnimatedCounter — calm ease-out count-up that triggers when scrolled into view.
 * Living-motion upgrade: now viewport-aware (counts on reveal, not on mount),
 * and re-animates when the value changes (subtle tick, not a full recount).
 */
export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  className,
  decimals = 0,
  duration = 700,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
  /** Count-up duration in ms */
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const prev = useRef(0);
  const hasRevealed = useRef(false);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(value);
      prev.current = value;
      hasRevealed.current = true;
      return;
    }

    const start = hasRevealed.current ? prev.current : 0;
    const diff = value - start;
    if (diff === 0) {
      setDisplay(value);
      return;
    }
    const startTime = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + diff * eased;
      setDisplay(decimals > 0 ? parseFloat(next.toFixed(decimals)) : Math.round(next));
      if (t < 1) frame = requestAnimationFrame(tick);
      else {
        prev.current = value;
        hasRevealed.current = true;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion, decimals, duration, inView]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : display.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <motion.span
      ref={ref}
      variants={counterReveal}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      className={cn(typography.metric, 'tabular-nums', className)}
      aria-live="polite"
      aria-atomic="true"
    >
      {prefix}
      {formatted}
      {suffix}
    </motion.span>
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
