'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { navItems } from '@/data/mock';
import { navIconMap, primaryNavHrefs, secondaryNavHrefs } from '@/lib/nav-config';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { springs } from '@/lib/motion';
import { GarrettIcon } from './GarrettIcon';

function NavLink({
  href,
  label,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
        active
          ? 'text-primary'
          : 'text-outline hover:bg-white/5 hover:text-on-surface-variant',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {active ? (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg border border-primary/10 bg-primary/10"
          transition={reduceMotion ? { duration: 0 } : springs.default}
        />
      ) : null}
      {active ? (
        <motion.span
          layoutId="sidebar-active-border"
          className="absolute bottom-1 left-0 top-1 w-0.5 rounded-full bg-primary"
          transition={reduceMotion ? { duration: 0 } : springs.default}
        />
      ) : null}
      <span className="relative z-10 flex items-center gap-3">
        <GarrettIcon name={icon} size={20} fill={active} />
        <span className={cn(typography.labelCaps, 'normal-case tracking-wide')}>{label}</span>
      </span>
    </Link>
  );
}

function NavSection({
  title,
  hrefs,
  pathname,
  onNavigate,
}: {
  title?: string;
  hrefs: readonly string[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const items = navItems.filter((n) => hrefs.includes(n.href));

  return (
    <div className="space-y-1">
      {title ? (
        <p className={cn(typography.labelCaps, 'px-3 pb-1 text-[10px] text-outline')}>{title}</p>
      ) : null}
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={navIconMap[item.icon]}
          active={pathname === item.href}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

/** Desktop contextual rail */
export function SideNavBar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-topbar z-40 hidden h-[calc(100dvh-var(--spacing-topbar))] w-sidebar',
        'flex-col border-r border-white/5 bg-surface-container-low/60 backdrop-blur-2xl md:flex',
        className,
      )}
      aria-label="Main navigation"
    >
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto scroll-hide px-3 py-4">
        <NavSection hrefs={primaryNavHrefs} pathname={pathname} />
        <NavSection title="Health & Body" hrefs={secondaryNavHrefs} pathname={pathname} />
      </nav>
      <div className="border-t border-white/5 p-3">
        <NavLink
          href="/settings"
          label="Settings"
          icon={navIconMap.settings}
          active={pathname === '/settings'}
        />
      </div>
    </aside>
  );
}

/** Mobile drawer overlay */
export function SideNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          />
          <motion.aside
            initial={reduceMotion ? false : { x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={reduceMotion ? { duration: 0 } : springs.soft}
            className="fixed left-0 top-0 z-50 flex h-dvh w-sidebar flex-col border-r border-white/8 bg-surface-container-low backdrop-blur-2xl md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex h-topbar items-center border-b border-white/5 px-4">
              <span className="text-headline-md font-bold text-primary">GarrettOS</span>
            </div>
            <nav className="flex flex-1 flex-col gap-4 overflow-y-auto scroll-hide p-3">
              <NavSection hrefs={primaryNavHrefs} pathname={pathname} onNavigate={onClose} />
              <NavSection title="Health & Body" hrefs={secondaryNavHrefs} pathname={pathname} onNavigate={onClose} />
              <NavSection hrefs={['/settings']} pathname={pathname} onNavigate={onClose} />
            </nav>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
