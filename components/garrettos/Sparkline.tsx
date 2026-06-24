'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { stitchPalette } from '@/lib/design-system';

const strokeMap = {
  primary: 'stroke-primary',
  secondary: 'stroke-secondary',
  tertiary: 'stroke-tertiary',
  error: 'stroke-error',
  outline: 'stroke-outline',
  /** legacy aliases */
  cyan: 'stroke-tertiary',
  green: 'stroke-secondary',
  'stroke-cyan': 'stroke-tertiary',
  'stroke-green': 'stroke-secondary',
  'stroke-violet': 'stroke-tertiary',
} as const;

export type SparklineColor = keyof typeof strokeMap;

export function Sparkline({
  values,
  label,
  className,
  color = 'primary',
  width = 100,
  height = 30,
}: {
  values: number[];
  label: string;
  className?: string;
  color?: SparklineColor | (string & {});
  width?: number;
  height?: number;
}) {
  const reduceMotion = useReducedMotion();
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const pathLength = width * 1.4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full max-w-[140px]', className)}
      role="img"
      aria-label={label}
    >
      <motion.polyline
        fill="none"
        className={strokeMap[color as SparklineColor] ?? 'stroke-primary'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={reduceMotion ? false : { strokeDashoffset: pathLength, strokeDasharray: pathLength }}
        animate={{ strokeDashoffset: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** Preset sparkline path for inline table cells (Stitch fleet manager style) */
export function SparklinePath({
  d,
  className,
  tone = 'secondary',
}: {
  d: string;
  className?: string;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'outline';
}) {
  const colors = {
    primary: stitchPalette.primary,
    secondary: stitchPalette.secondary,
    tertiary: stitchPalette.tertiary,
    error: stitchPalette.error,
    outline: stitchPalette.outline,
  };

  return (
    <svg viewBox="0 0 100 30" className={cn('h-6 w-20', className)} aria-hidden>
      <path d={d} fill="none" stroke={colors[tone]} strokeWidth="2" />
    </svg>
  );
}
