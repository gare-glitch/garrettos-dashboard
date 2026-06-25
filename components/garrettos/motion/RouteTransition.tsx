'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useMotionPreferences } from './MotionProvider';
import { routeVariants } from '@/lib/living-motion';
import { cn } from '@/lib/utils';

/**
 * RouteTransition — wraps page children in a subtle fade + small y-slide on
 * pathname change. Does NOT animate layout/scroll; only opacity + transform.
 *
 * - Disabled (renders children plain) under reduced motion.
 * - Use inside the dashboard layout, wrapping {children}.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { routeTransitionsEnabled } = useMotionPreferences();

  if (!routeTransitionsEnabled) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      variants={routeVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={cn('contents')}
    >
      {children}
    </motion.div>
  );
}
