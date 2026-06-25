'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMotionPreferences } from './MotionProvider';
import { glassTransitions } from '@/lib/living-motion';
import { GlassPanel } from '../GlassPanel';

/**
 * ReactiveGlassSurface — a GlassPanel that responds gently to mouse position
 * with a soft radial highlight + subtle border shimmer on hover.
 *
 * - No tilt. No 3D. No parallax on content.
 * - Disabled under reduced motion (renders a plain GlassPanel).
 * - Use for cards that benefit from feeling tactile (metric cards, context cards,
 *   list rows). Do NOT wrap every panel — reserve for interactive or hero surfaces.
 */
export function ReactiveGlassSurface({
  children,
  className,
  variant = 'card',
  interactive = true,
  highlightOpacity = 0.06,
  as,
}: {
  children: ReactNode;
  className?: string;
  variant?: 'panel' | 'card' | 'nested';
  interactive?: boolean;
  /** 0–0.12 recommended; higher gets flashy */
  highlightOpacity?: number;
  as?: 'div' | 'section' | 'article';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const enabled = ambientEnabled && !reduceMotion;

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      ref.current.style.setProperty('--rg-x', `${e.clientX - rect.left}px`);
      ref.current.style.setProperty('--rg-y', `${e.clientY - rect.top}px`);
    },
    [enabled],
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      initial={enabled ? { '--shimmer': '0' } : undefined}
      whileHover={enabled ? { '--shimmer': '1' } : undefined}
      transition={glassTransitions.shimmer}
      className={cn('relative', className)}
      style={
        {
          '--rg-x': '50%',
          '--rg-y': '50%',
          '--shimmer': '0',
        } as React.CSSProperties
      }
    >
      {enabled ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity"
            style={{
              opacity: 'var(--shimmer)' as unknown as number,
              background: `radial-gradient(320px circle at var(--rg-x) var(--rg-y), rgba(236,189,164,${highlightOpacity}), transparent 50%)`,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity"
            style={{
              opacity: 'var(--shimmer)' as unknown as number,
              boxShadow: 'inset 0 0 0 1px rgba(236,189,164,0.14)',
            }}
          />
        </>
      ) : null}
      <GlassPanel variant={variant} interactive={interactive} as={as} className="relative">
        {children}
      </GlassPanel>
    </motion.div>
  );
}
