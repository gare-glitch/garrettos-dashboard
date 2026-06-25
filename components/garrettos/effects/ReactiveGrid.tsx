'use client';

import { useReducedMotion } from 'framer-motion';
import { useMotionPreferences } from '../motion';
import { cn } from '@/lib/utils';

/**
 * ReactiveGrid — a subtle dot/line grid that brightens near the cursor.
 * Used sparingly behind hero sections to add quiet depth. Static (no
 * cursor reaction) under reduced/minimal motion.
 */
export function ReactiveGrid({
  className,
  dotColor = 'rgba(236, 189, 164, 0.10)',
  dotSize = 1,
  spacing = 28,
  disabled = false,
}: {
  className?: string;
  dotColor?: string;
  dotSize?: number;
  spacing?: number;
  disabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const enabled = !disabled && !reduceMotion && mode !== 'minimal';

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      aria-hidden
      style={{
        backgroundImage: `radial-gradient(${dotColor} ${dotSize}px, transparent ${dotSize + 1}px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
        maskImage: enabled
          ? 'radial-gradient(60% 60% at 50% 40%, black, transparent 80%)'
          : 'radial-gradient(70% 70% at 50% 50%, black, transparent 90%)',
        WebkitMaskImage: enabled
          ? 'radial-gradient(60% 60% at 50% 40%, black, transparent 80%)'
          : 'radial-gradient(70% 70% at 50% 50%, black, transparent 90%)',
      }}
    />
  );
}
