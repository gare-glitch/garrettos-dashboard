'use client';

import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMotionPreferences } from '../motion';

/**
 * DockPhysics — Apple-style dock proximity expansion.
 *
 * Tracks the cursor's X position relative to the dock and, for each item,
 * computes a 0–1 proximity factor. Items near the cursor scale up; distant
 * items stay at rest. The falloff is a smooth Gaussian-style curve so the
 * expansion feels continuous, not stepped.
 *
 * - Returns a per-item scale and a translateY (lift) based on proximity.
 * - Disabled under reduced/minimal motion (everything stays at scale 1).
 * - Mobile/touch: falls back to a gentle uniform scale on the active item only.
 */

export type DockItemPhysics = {
  /** 0–1 proximity factor (1 = cursor directly over this item). */
  proximity: number;
  /** Suggested scale multiplier (1 + proximity * maxScale). */
  scale: number;
  /** Suggested lift in px (proximity * maxLift). */
  lift: number;
};

export type UseDockPhysicsOptions = {
  /** Max scale added at the cursor (e.g. 0.5 → up to 1.5x). */
  maxScale?: number;
  /** Max lift in px at the cursor. */
  maxLift?: number;
  /** Influence radius in px (how far the cursor reaches). */
  radius?: number;
};

export type UseDockPhysicsReturn = {
  /** Attach to the dock <nav> element. */
  dockRef: React.RefObject<HTMLDivElement | null>;
  /** Mouse X handler for the dock. */
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Reset on leave. */
  onMouseLeave: () => void;
  /** Whether physics is active (false under reduced/minimal motion). */
  active: boolean;
  /** Current per-item physics array, indexed by item index. */
  items: DockItemPhysics[];
};

export function useDockPhysics(
  count: number,
  options: UseDockPhysicsOptions = {},
): UseDockPhysicsReturn {
  const { maxScale = 0.42, maxLift = 10, radius = 120 } = options;
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const active = !reduceMotion && mode !== 'minimal';

  const dockRef = useRef<HTMLDivElement>(null);
  const itemCentersRef = useRef<number[]>([]);
  const [cursorX, setCursorX] = useState<number | null>(null);

  // Recompute item centers after layout / count change. Done lazily on mouse
  // enter / move to avoid a ResizeObserver for a small dock.
  const recomputeCenters = useCallback(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const dockRect = dock.getBoundingClientRect();
    const links = Array.from(dock.querySelectorAll<HTMLElement>('[data-dock-item]'));
    itemCentersRef.current = links.map((el) => {
      const r = el.getBoundingClientRect();
      return r.left - dockRect.left + r.width / 2;
    });
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!active) return;
      if (itemCentersRef.current.length !== count) recomputeCenters();
      const dock = dockRef.current;
      if (!dock) return;
      const dockRect = dock.getBoundingClientRect();
      setCursorX(e.clientX - dockRect.left);
    },
    [active, count, recomputeCenters],
  );

  const onMouseLeave = useCallback(() => setCursorX(null), []);

  const items: DockItemPhysics[] = Array.from({ length: count }, (_, i) => {
    if (!active || cursorX == null) return { proximity: 0, scale: 1, lift: 0 };
    const center = itemCentersRef.current[i] ?? 0;
    const dist = Math.abs(cursorX - center);
    // Smooth Gaussian-style falloff.
    const proximity = Math.max(0, 1 - (dist / radius) ** 2);
    return {
      proximity,
      scale: 1 + proximity * maxScale,
      lift: proximity * maxLift,
    };
  });

  return { dockRef, onMouseMove, onMouseLeave, active, items };
}
