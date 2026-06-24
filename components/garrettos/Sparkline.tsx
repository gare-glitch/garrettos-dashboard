'use client';

import { cn } from '@/lib/utils';

export function Sparkline({
  values,
  label,
  className,
  color = 'stroke-cyan',
}: {
  values: number[];
  label: string;
  className?: string;
  color?: string;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('w-full max-w-[140px]', className)}
      role="img"
      aria-label={label}
    >
      <polyline
        fill="none"
        className={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
