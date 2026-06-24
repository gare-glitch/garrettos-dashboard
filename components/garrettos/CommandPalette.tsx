'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { navItems } from '@/data/mock';
import { osCommands, osRecentCommands } from '@/data/os-mock';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { scaleIn, springs } from '@/lib/motion';
import { GarrettIcon } from './GarrettIcon';
import { GlassPanel } from './GlassPanel';

export { CommandPaletteProvider, useCommandPaletteContext, useCommandPalette } from './CommandPaletteContext';

type PaletteItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  icon?: string;
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const items = useMemo(() => {
    const q = query.toLowerCase().trim();
    const routes: PaletteItem[] = navItems.map((n) => ({
      id: n.href,
      label: n.label,
      href: n.href,
      group: 'Navigate',
      icon: n.icon,
    }));
    const commands: PaletteItem[] = osCommands.map((c) => ({
      id: c.id,
      label: c.label,
      href: c.href,
      group: c.group,
      icon: c.icon,
    }));
    const all = [...commands, ...routes];
    if (!q) return all;
    return all.filter((item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of items) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [items]);

  const flatItems = items;

  const close = useCallback(() => {
    onClose();
    setQuery('');
    setActiveIndex(0);
  }, [onClose]);

  const runItem = useCallback(
    (item: PaletteItem) => {
      close();
      if (item.href.startsWith('/')) router.push(item.href);
    },
    [close, router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && flatItems[activeIndex]) {
        e.preventDefault();
        runItem(flatItems[activeIndex]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, flatItems, activeIndex, runItem]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[10vh] backdrop-blur-md"
          onClick={close}
          role="presentation"
        >
          <motion.div
            variants={scaleIn}
            initial={reduceMotion ? false : 'hidden'}
            animate="visible"
            exit={reduceMotion ? undefined : 'hidden'}
            transition={reduceMotion ? { duration: 0 } : springs.palette}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <GlassPanel variant="panel" className="overflow-hidden p-0 glow-ring">
              <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
                <GarrettIcon name="search" size={20} className="text-primary" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, modules, agents…"
                  className={cn(
                    'flex-1 bg-transparent text-body-sm text-on-surface outline-none',
                    'placeholder:text-outline/60',
                  )}
                  aria-label="Search commands"
                />
                <kbd className="hidden rounded border border-white/10 bg-surface-container-high/50 px-1.5 py-0.5 font-mono text-[10px] text-outline sm:inline">
                  esc
                </kbd>
              </div>

              <div className="max-h-[min(420px,50vh)] overflow-y-auto scroll-hide p-2">
                {!query && osRecentCommands.length > 0 ? (
                  <div className="mb-2 px-2">
                    <p className={cn(typography.labelCaps, 'mb-2 text-[10px]')}>Recent</p>
                    <ul className="space-y-0.5">
                      {osRecentCommands.map((rc) => (
                        <li
                          key={rc.id}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-body-sm text-on-surface-variant"
                        >
                          <span>{rc.label}</span>
                          <span className="font-mono text-[10px] text-outline">{rc.timestamp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {grouped.length === 0 ? (
                  <p className="px-4 py-8 text-center text-body-sm text-on-surface-variant">No results</p>
                ) : (
                  grouped.map(([group, groupItems]) => (
                    <div key={group} className="mb-2">
                      <p className={cn(typography.labelCaps, 'px-3 py-1.5 text-[10px]')}>{group}</p>
                      <ul role="listbox">
                        {groupItems.map((item) => {
                          const idx = flatItems.indexOf(item);
                          const isActive = idx === activeIndex;
                          return (
                            <li key={item.id} role="option" aria-selected={isActive}>
                              <button
                                type="button"
                                onClick={() => runItem(item)}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                                  isActive ? 'bg-primary/10 text-on-surface' : 'text-on-surface-variant hover:bg-white/5',
                                )}
                              >
                                {item.icon ? (
                                  <GarrettIcon name={item.icon} size={18} className="text-primary" />
                                ) : null}
                                <span className="flex-1 text-body-sm font-medium">{item.label}</span>
                                <GarrettIcon name="chevron_right" size={16} className="text-outline opacity-50" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/8 px-4 py-2">
                <span className="font-mono text-[10px] text-outline">↑↓ navigate · ↵ select · esc close</span>
                <span className="font-mono text-[10px] text-outline">⌘K</span>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** @deprecated Use CommandPalette with useCommandPalette hook */
export function CommandPaletteOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return <CommandPalette open={open} onClose={onClose} />;
}

/** Standalone trigger button — used when not embedded in TopAppBar */
export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-xl border border-white/8 bg-surface-container-low/40 px-3 py-2 text-left text-body-sm text-on-surface-variant transition-colors hover:border-primary/30 hover:text-on-surface"
      aria-label="Open command palette"
    >
      <GarrettIcon name="search" size={18} />
      <span className="flex-1 truncate">Search commands, modules, agents…</span>
      <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘K</kbd>
    </button>
  );
}
