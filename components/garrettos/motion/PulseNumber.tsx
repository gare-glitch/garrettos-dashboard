'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMotionPreferences } from './MotionProvider';

/**
 * PulseNumber — a number that ticks gently when "live", staying calm when idle.
 *
 * Unlike AnimatedCounter (which counts to a target on reveal), PulseNumber is
 * for values that fluctuate in place (e.g. CPU %, queue depth, active agents).
 * Pass a `value`; when `live` is true it shows a subtle breathing dot and a
 * faint sand pulse on the digits. When the value changes, it cross-fades the
 * new digit in (not a full count-up — that would be distracting at high freq).
 *
 * Reduced motion: no pulse, no cross-fade; just renders the value.
 */
export function PulseNumber({
  value,
  suffix,
  prefix,
  live = true,
  className,
  format = true,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  live?: boolean;
  className?: string;
  /** Format with toLocaleString */
  format?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const pulse = live && ambientEnabled && !reduceMotion;
  const [displayKey, setDisplayKey] = useState(0);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      setDisplayKey((k) => k + 1);
      prev.current = value;
    }
  }, [value]);

  const text = format ? value.toLocaleString() : String(value);

  return (
    <span className={cn('relative inline-flex items-center gap-1.5', className)}>
      {pulse ? (
        <motion.span
          aria-hidden
          className="size-1.5 rounded-full bg-secondary"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}
      <span className="relative tabular-nums">
        {pulse ? (
          <motion.span
            key={displayKey}
            initial={{ opacity: 0.4, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {prefix}
            {text}
            {suffix}
          </motion.span>
        ) : (
          <span>
            {prefix}
            {text}
            {suffix}
          </span>
        )}
      </span>
    </span>
  );
}
