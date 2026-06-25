'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMotionPreferences } from '../motion';
import { cn } from '@/lib/utils';

/**
 * PointerGlow — a reusable wrapper that renders a soft radial highlight
 * following the cursor inside its bounds. Premium, calm, non-tilt. Disabled
 * under reduced/minimal motion (the highlight just stays centered).
 *
 * Use on hero cards, metric cards, and login surfaces — not everywhere.
 */
export function PointerGlow({
  children,
  className,
  glowColor = 'rgba(236, 189, 164, 0.14)',
  radius = 240,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  /** CSS color for the radial highlight. */
  glowColor?: string;
  /** Highlight radius in px. */
  radius?: number;
  /** Force-disable (e.g. for non-interactive cards). */
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const enabled = !disabled && !reduceMotion && mode !== 'minimal';

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--pg-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--pg-y', `${e.clientY - rect.top}px`);
      el.style.setProperty('--pg-o', '1');
    },
    [enabled],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--pg-o', '0');
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('relative', className)}
      style={{
        ['--pg-r' as string]: `${radius}px`,
        ['--pg-c' as string]: glowColor,
        ['--pg-o' as string]: '0',
      }}
    >
      {enabled ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: 'var(--pg-o)' as unknown as number,
            background:
              'radial-gradient(var(--pg-r) var(--pg-r) at var(--pg-x) var(--pg-y), var(--pg-c), transparent 70%)',
          }}
          aria-hidden
        />
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
