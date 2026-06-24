'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';

export function AnimatedCounter({
  value,
  suffix = '',
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
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
    const duration = 500;
    const startTime = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else prev.current = value;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);

  return (
    <span className={cn(typography.metric, 'tabular-nums', className)} aria-live="polite">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
