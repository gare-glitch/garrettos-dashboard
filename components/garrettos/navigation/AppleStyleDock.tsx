'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { navItems } from '@/data/mock';
import { navIconMap } from '@/lib/nav-config';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from '../GarrettIcon';
import { DockFab, FluidGlassPanel } from '../motion';
import { useDockPhysics } from './DockPhysics';
import { useMotionPreferences } from '../motion';

/**
 * AppleStyleDock — the upgraded command dock with cursor-proximity expansion,
 * a morphing active pill (layoutId), hover/focus labels, and a plus/FAB that
 * opens the command palette. Reuses existing GarrettIcon + navItems (no sample
 * icons). Route logic unchanged. Keyboard accessible. Mobile stays compact.
 *
 * Under reduced/minimal motion, proximity expansion is disabled and the dock
 * behaves like a calm static bar with the active pill still morphing.
 */
export function AppleStyleDock({
  onCommandOpen,
  className,
}: {
  onCommandOpen?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const tactile = mode === 'full' && !reduceMotion;

  const { dockRef, onMouseMove, onMouseLeave, active, items } = useDockPhysics(navItems.length, {
    maxScale: 0.4,
    maxLift: 9,
    radius: 110,
  });

  return (
    <nav
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center',
        'px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6',
        className,
      )}
      aria-label="Primary command dock"
    >
      <FluidGlassPanel
        variant="default"
        interactive={false}
        rounded="rounded-full"
        className="pointer-events-auto"
      >
        <div
          ref={dockRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="flex items-end gap-1 px-2 py-2 md:gap-2 md:px-4 md:py-2.5"
        >
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            const phys = items[i] ?? { proximity: 0, scale: 1, lift: 0 };
            const showLabel = phys.proximity > 0.25 || isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-dock-item
                className={cn(
                  'group relative flex flex-col items-center gap-0.5 rounded-full px-2 py-1.5',
                  'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/50',
                  'md:px-3',
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary',
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                {isActive ? (
                  <motion.span
                    layoutId="apple-dock-indicator"
                    className="absolute inset-0 rounded-full bg-primary/15 ring-1 ring-primary/25"
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
                  />
                ) : null}

                {/* Hover/focus label — appears above the icon, non-intrusive */}
                <motion.span
                  className={cn(
                    typography.labelCaps,
                    'pointer-events-none absolute -top-7 whitespace-nowrap rounded-md border border-white/8 bg-surface/90 px-2 py-0.5 text-[9px] normal-case tracking-normal backdrop-blur-md',
                    'transition-opacity duration-200',
                    showLabel ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden
                >
                  {item.short}
                </motion.span>

                <motion.span
                  className="relative z-10 flex flex-col items-center"
                  style={{
                    transform: active ? `translateY(-${phys.lift}px) scale(${phys.scale})` : undefined,
                    transformOrigin: 'bottom center',
                  }}
                  whileTap={tactile ? { scale: 0.9 } : undefined}
                >
                  <GarrettIcon
                    name={navIconMap[item.icon]}
                    size={20 + Math.round(phys.proximity * 6)}
                    fill={isActive}
                  />
                  <span className={cn(typography.labelCaps, 'hidden normal-case tracking-normal sm:block')}>
                    {item.short}
                  </span>
                </motion.span>
              </Link>
            );
          })}

          <span className="mx-1 hidden h-6 w-px bg-white/10 md:block" aria-hidden />

          <DockFab onClick={onCommandOpen} />
        </div>
      </FluidGlassPanel>
    </nav>
  );
}
