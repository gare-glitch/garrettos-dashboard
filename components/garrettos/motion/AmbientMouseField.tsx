'use client';

import { useEffect, useRef } from 'react';
import { useMotionPreferences } from './MotionProvider';
import { cn } from '@/lib/utils';

/**
 * AmbientMouseField — a fixed, pointer-events-none layer that renders a very
 * subtle radial light following the cursor across the whole viewport.
 *
 * - Disabled under reduced motion / minimal mode.
 * - No tilt, no parallax on content, no GPU-heavy effects — one radial gradient
 *   updated via requestAnimationFrame with light throttling.
 * - Sits at z-0 behind all content.
 */
export function AmbientMouseField({ className }: { className?: string }) {
  const { ambientEnabled } = useMotionPreferences();
  const layerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 600, y: 400 });
  const currentRef = useRef({ x: 600, y: 400 });

  useEffect(() => {
    if (!ambientEnabled) return;
    const layer = layerRef.current;
    if (!layer) return;
    // Initialize from current viewport once on mount
    targetRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    currentRef.current = { x: targetRef.current.x, y: targetRef.current.y };

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const tick = () => {
      // Ease toward target for a soft trailing feel
      const tx = targetRef.current.x;
      const ty = targetRef.current.y;
      currentRef.current.x += (tx - currentRef.current.x) * 0.12;
      currentRef.current.y += (ty - currentRef.current.y) * 0.12;
      layer.style.setProperty('--ambient-x', `${currentRef.current.x}px`);
      layer.style.setProperty('--ambient-y', `${currentRef.current.y}px`);
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ambientEnabled]);

  if (!ambientEnabled) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-0 z-0',
        className,
      )}
      style={
        {
          '--ambient-x': '50vw',
          '--ambient-y': '50vh',
          background:
            'radial-gradient(600px circle at var(--ambient-x) var(--ambient-y), rgba(236,189,164,0.05), transparent 45%)',
        } as React.CSSProperties
      }
    />
  );
}
