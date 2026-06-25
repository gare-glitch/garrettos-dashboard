'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMotionPreferences } from '../motion';
import { cn } from '@/lib/utils';

/**
 * FocusRingPulse — wraps an interactive element and renders a calm, expanding
 * focus ring when it receives keyboard focus. Improves keyboard visibility
 * without the harsh default outline. The ring is a single quiet pulse on focus
 * (not a loop). Disabled under reduced/minimal motion (falls back to a static
 * ring).
 */
export function FocusRingPulse({
  children,
  className,
  ringColor = 'rgba(236, 189, 164, 0.55)',
  radius = 6,
}: {
  children: ReactNode;
  className?: string;
  ringColor?: string;
  radius?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const animate = !reduceMotion && mode !== 'minimal';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = el.parentElement;
    if (!host) return;

    const onFocusIn = () => {
      el.style.setProperty('--fr-o', '1');
      if (animate) {
        el.style.setProperty('--fr-s', '1.08');
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            el.style.setProperty('--fr-s', '1');
          });
        });
      }
    };
    const onFocusOut = () => {
      el.style.setProperty('--fr-o', '0');
    };

    host.addEventListener('focusin', onFocusIn);
    host.addEventListener('focusout', onFocusOut);
    return () => {
      host.removeEventListener('focusin', onFocusIn);
      host.removeEventListener('focusout', onFocusOut);
    };
  }, [animate]);

  return (
    <span className="relative inline-flex">
      <span
        ref={ref}
        className={cn('pointer-events-none absolute -inset-1 z-0 rounded-[var(--fr-r)] transition-opacity duration-200', className)}
        style={{
          ['--fr-c' as string]: ringColor,
          ['--fr-r' as string]: `${radius}px`,
          ['--fr-o' as string]: '0',
          ['--fr-s' as string]: '1',
          opacity: 'var(--fr-o)' as unknown as number,
          transform: 'scale(var(--fr-s))',
          boxShadow: '0 0 0 1.5px var(--fr-c), 0 0 22px 0 var(--fr-c)',
        }}
        aria-hidden
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}
