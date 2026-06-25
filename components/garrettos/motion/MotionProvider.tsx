'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

export type MotionMode = 'full' | 'reduced' | 'minimal';

type MotionContextValue = {
  /** True when the OS reports prefers-reduced-motion */
  prefersReduced: boolean;
  /** Resolved mode: reduced > minimal > full */
  mode: MotionMode;
  /** Ambient mouse field enabled (disabled under reduced/minimal) */
  ambientEnabled: boolean;
  /** Route transitions enabled (disabled under reduced) */
  routeTransitionsEnabled: boolean;
};

const MotionContext = createContext<MotionContextValue | null>(null);

/**
 * MotionProvider centralizes motion preferences for the app.
 * Wrap the app shell with this so every living-motion component reads one source
 * of truth instead of each calling useReducedMotion independently.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion();
  const [userMinimal, setUserMinimal] = useState(false);

  // Optional future hook: let the user force minimal motion via localStorage.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('garrettos-motion');
      if (stored === 'minimal') setUserMinimal(true);
      else if (stored === 'full') setUserMinimal(false);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<MotionContextValue>(() => {
    const mode: MotionMode = prefersReduced ? 'reduced' : userMinimal ? 'minimal' : 'full';
    return {
      prefersReduced: Boolean(prefersReduced),
      mode,
      ambientEnabled: mode === 'full',
      routeTransitionsEnabled: mode !== 'reduced',
    };
  }, [prefersReduced, userMinimal]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotionPreferences(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    // Safe default when used outside provider
    return {
      prefersReduced: false,
      mode: 'full',
      ambientEnabled: true,
      routeTransitionsEnabled: true,
    };
  }
  return ctx;
}
