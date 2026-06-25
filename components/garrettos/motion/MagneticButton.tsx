'use client';

import { useCallback, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMotionPreferences } from './MotionProvider';
import { tactileSprings } from '@/lib/living-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary',
  secondary: 'border border-white/12 bg-surface-container/50 text-on-surface hover:border-primary/30',
  ghost: 'text-on-surface-variant hover:text-primary hover:bg-white/5',
  danger: 'border border-error/30 text-error hover:bg-error/10',
};

/**
 * MagneticButton — a button that is gently pulled toward the cursor on hover
 * (within a small radius) and snaps back with a soft spring on leave.
 *
 * - Max displacement is small (~6px) so it feels tactile, not gimmicky.
 * - Disabled under reduced motion (renders a normal button with press scale).
 * - The press scale stays (that is not motion-sickness-inducing).
 */
export function MagneticButton({
  children,
  variant = 'primary',
  className,
  strength = 0.25,
  maxDisplacement = 6,
  ...props
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** 0–1, how strongly the button follows the cursor */
  strength?: number;
  /** Max px displacement in each axis */
  maxDisplacement?: number;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const magnetic = ambientEnabled && !reduceMotion;

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      const clampedX = Math.max(-maxDisplacement, Math.min(maxDisplacement, dx));
      const clampedY = Math.max(-maxDisplacement, Math.min(maxDisplacement, dy));
      ref.current.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
    },
    [magnetic, strength, maxDisplacement],
  );

  const handleLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = '';
  }, []);

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileTap={{ scale: 0.96 }}
      transition={tactileSprings.click}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5',
        'text-body-sm font-semibold outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-primary/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}
