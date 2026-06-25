'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMotionPreferences } from './MotionProvider';
import { glassTransitions } from '@/lib/living-motion';

type FluidVariant = 'default' | 'active' | 'warning' | 'danger';

const variantBorder: Record<FluidVariant, string> = {
  default: 'border-white/8',
  active: 'border-primary/30',
  warning: 'border-primary/45',
  danger: 'border-error/45',
};

const variantGlow: Record<FluidVariant, string> = {
  default: 'rgba(236,189,164,0.0)',
  active: 'rgba(236,189,164,0.10)',
  warning: 'rgba(236,189,164,0.16)',
  danger: 'rgba(255,180,171,0.16)',
};

/**
 * FluidGlassPanel — the premium reusable glass surface with:
 *  - mouse-aware highlight (radial sand glow following cursor)
 *  - border shimmer on hover (sand inner border fades in)
 *  - soft depth (existing glass blur + milled border)
 *  - default / active / warning / danger variants
 *
 * This is the upgraded version of GlassPanel for hero/interactive surfaces.
 * It does NOT replace GlassPanel everywhere — GlassPanel stays the default for
 * plain containers. Use FluidGlassPanel for: hero metric cards, the login panel,
 * command palette body, dock shell, agent cards, and any surface that should
 * feel alive when hovered.
 *
 * Reduced motion: highlight + shimmer disabled; variant border/glow remain
 * (they are static, not motion).
 */
export function FluidGlassPanel({
  children,
  className,
  variant = 'default',
  interactive = true,
  highlightOpacity = 0.08,
  rounded = 'rounded-xl',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  variant?: FluidVariant;
  interactive?: boolean;
  highlightOpacity?: number;
  rounded?: string;
  as?: 'div' | 'section' | 'article';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const trackingEnabled = ambientEnabled && !reduceMotion;

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackingEnabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      ref.current.style.setProperty('--fg-x', `${e.clientX - rect.left}px`);
      ref.current.style.setProperty('--fg-y', `${e.clientY - rect.top}px`);
    },
    [trackingEnabled],
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      initial={trackingEnabled ? { '--shimmer': '0' } : undefined}
      whileHover={trackingEnabled ? { '--shimmer': '1' } : undefined}
      transition={glassTransitions.shimmer}
      className={cn('relative', className)}
      style={
        {
          '--fg-x': '50%',
          '--fg-y': '50%',
          '--shimmer': '0',
          '--fluid-glow': variantGlow[variant],
        } as React.CSSProperties
      }
    >
      {/* Base glass */}
      <Tag
        className={cn(
          'glass-card milled-border relative overflow-hidden border',
          variantBorder[variant],
          rounded,
        )}
      >
        {/* Static variant glow (active/warning/danger) */}
        {variant !== 'default' ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 0%, var(--fluid-glow), transparent 60%)' }}
          />
        ) : null}

        {/* Mouse-aware highlight (disabled under reduced motion) */}
        {trackingEnabled ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity"
            style={{
              opacity: 'var(--shimmer)' as unknown as number,
              background: `radial-gradient(340px circle at var(--fg-x) var(--fg-y), rgba(236,189,164,${highlightOpacity}), transparent 52%)`,
            }}
          />
        ) : null}

        {/* Border shimmer (disabled under reduced motion) */}
        {trackingEnabled && interactive ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity"
            style={{
              opacity: 'var(--shimmer)' as unknown as number,
              boxShadow: 'inset 0 0 0 1px rgba(236,189,164,0.18)',
            }}
          />
        ) : null}

        <div className="relative">{children}</div>
      </Tag>
    </motion.div>
  );
}
