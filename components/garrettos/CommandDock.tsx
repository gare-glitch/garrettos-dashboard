'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { navItems } from '@/data/mock';
import { navIconMap } from '@/lib/nav-config';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from './GarrettIcon';
import { DockFab, FluidGlassPanel, MorphingDockIndicator } from './motion';

export function CommandDock({
  onCommandOpen,
  className,
}: {
  onCommandOpen?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

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
        <div className="flex items-center gap-1 px-2 py-2 md:gap-2 md:px-4 md:py-2.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex min-w-[2.75rem] flex-col items-center gap-0.5 rounded-full px-2 py-1.5',
                  'text-[9px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/50',
                  'md:min-w-[3.25rem] md:px-3 md:text-[10px]',
                  active ? 'text-primary' : 'text-on-surface-variant hover:text-primary',
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
              >
                <MorphingDockIndicator active={active}>
                  <GarrettIcon name={navIconMap[item.icon]} size={20} fill={active} />
                  <span className={cn(typography.labelCaps, 'hidden normal-case tracking-normal sm:block')}>
                    {item.short}
                  </span>
                </MorphingDockIndicator>
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
