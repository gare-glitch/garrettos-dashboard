'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Command, Search } from 'lucide-react';
import { navItems } from '@/data/mock';
import { osCommands } from '@/data/os-mock';
import { Input } from '@/components/ui/input';
import { GlassPanel } from './GlassPanel';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const items = useMemo(() => {
    const q = query.toLowerCase();
    const routes = navItems.map((n) => ({ id: n.href, label: n.label, href: n.href, group: 'Navigate' }));
    const commands = osCommands.map((c) => ({ id: c.id, label: c.label, href: c.href ?? '#', group: c.group }));
    return [...routes, ...commands].filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-input/40 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-cyan/30 hover:text-foreground"
        aria-label="Open command palette"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate">Search commands, modules, agents…</span>
        <kbd className="hidden rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono sm:inline">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
            onClick={close}
            role="presentation"
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              <GlassPanel className="glow-ring overflow-hidden p-2">
                <div className="flex items-center gap-2 border-b border-border px-2 pb-2">
                  <Command className="size-4 text-cyan" />
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type a command or destination…"
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                </div>
                <ul className="max-h-72 overflow-y-auto p-1" role="listbox">
                  {items.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results</li>
                  ) : (
                    items.map((item) => (
                      <li key={item.id}>
                        {item.href.startsWith('/') ? (
                          <Link
                            href={item.href}
                            onClick={close}
                            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/50"
                          >
                            <span>
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.group}</span>
                              <span className="block font-medium">{item.label}</span>
                            </span>
                            <ArrowRight className="size-3.5 text-muted-foreground" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              close();
                              if (item.href) router.push(item.href);
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50"
                          >
                            <span>
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.group}</span>
                              <span className="block font-medium">{item.label}</span>
                            </span>
                          </button>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </GlassPanel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** Hook-friendly trigger for CommandDock */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen((v) => !v) };
}

export function CommandPaletteOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const reduceMotion = useReducedMotion();
  const items = useMemo(() => {
    const q = query.toLowerCase();
    return navItems.filter((n) => n.label.toLowerCase().includes(q));
  }, [query]);

  if (!open) return null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <GlassPanel className="w-full max-w-lg p-2" onClick={(e) => e.stopPropagation()}>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" autoFocus />
        <ul className="mt-2 max-h-60 overflow-y-auto">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={onClose} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted/50">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </motion.div>
  );
}
