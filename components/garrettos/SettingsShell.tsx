'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { springs } from '@/lib/motion';
import { GarrettIcon, type MaterialSymbol } from './GarrettIcon';
import { GlassPanel } from './GlassPanel';
import { ScrollReveal } from './ScrollReveal';

export type SettingsNavItem = {
  id: string;
  label: string;
  icon: MaterialSymbol;
};

export function SettingsShell({
  navItems,
  activeId,
  onChange,
  children,
}: {
  navItems: readonly SettingsNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-[260px_1fr]">
      <SettingsNav navItems={navItems} activeId={activeId} onChange={onChange} />
      <ScrollReveal>{children}</ScrollReveal>
    </div>
  );
}

function SettingsNav({
  navItems,
  activeId,
  onChange,
}: {
  navItems: readonly SettingsNavItem[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <nav aria-label="Settings sections">
      <GlassPanel variant="card" className="flex flex-col p-4">
        <div className="mb-4 px-2">
          <h2 className={cn(typography.headlineMd, 'text-primary')}>Settings</h2>
          <p className={typography.body}>GarrettOS System</p>
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onChange(item.id)}
                  className={cn(
                    'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    active ? 'text-primary' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {active ? (
                    <motion.span
                      layoutId="settings-nav-active"
                      className="absolute inset-0 rounded-xl border border-primary/10 bg-primary/10"
                      transition={reduceMotion ? { duration: 0 } : springs.default}
                    />
                  ) : null}
                  <span className="relative z-10 flex items-center gap-3">
                    <GarrettIcon name={item.icon} size={20} fill={active} />
                    <span className={cn(typography.bodyLg, 'font-medium')}>{item.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </GlassPanel>
    </nav>
  );
}
