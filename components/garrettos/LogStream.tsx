'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type LogEntry = {
  id: string;
  time: string;
  level: LogLevel;
  source: string;
  message: string;
};

const levelStyles: Record<LogLevel, string> = {
  DEBUG: 'text-outline',
  INFO: 'text-tertiary',
  WARN: 'text-primary',
  ERROR: 'text-error',
};

const levelChip: Record<LogLevel, string> = {
  DEBUG: 'border-outline/30 bg-outline/10 text-outline',
  INFO: 'border-tertiary/30 bg-tertiary/10 text-tertiary',
  WARN: 'border-primary/30 bg-primary/10 text-primary',
  ERROR: 'border-error/30 bg-error/10 text-error',
};

export function LogStream({
  entries,
  className,
  live = true,
}: {
  entries: LogEntry[];
  className?: string;
  live?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'glass-card overflow-hidden rounded-xl font-mono text-body-code',
        className,
      )}
      role="log"
      aria-live={live ? 'polite' : 'off'}
      aria-label="System log stream"
    >
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="label-caps text-outline">logs.stream</span>
        {live ? (
          <span className="flex items-center gap-1.5">
            <motion.span
              className="size-1.5 rounded-full bg-secondary"
              animate={reduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <span className="label-caps text-secondary">LIVE</span>
          </span>
        ) : null}
      </div>
      <div className="max-h-[360px] overflow-y-auto scroll-hide p-3">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-outline">No log entries</p>
        ) : (
          <ul className="space-y-1">
            {entries.map((entry) => (
              <li key={entry.id} className="flex gap-2 leading-relaxed">
                <span className="shrink-0 text-outline">{entry.time}</span>
                <span className={cn('shrink-0 rounded border px-1.5 text-[10px] uppercase', levelChip[entry.level])}>
                  {entry.level}
                </span>
                <span className="shrink-0 text-on-surface-variant">{entry.source}</span>
                <span className={levelStyles[entry.level]}>{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function LogFilterBar({
  levels,
  activeLevel,
  onChange,
  className,
}: {
  levels: LogLevel[];
  activeLevel: LogLevel | 'ALL';
  onChange: (level: LogLevel | 'ALL') => void;
  className?: string;
}) {
  const all: (LogLevel | 'ALL')[] = ['ALL', ...levels];
  return (
    <div
      className={cn('flex flex-wrap items-center gap-1 rounded-lg border border-white/8 bg-surface-container/40 p-1', className)}
      role="group"
      aria-label="Log level filter"
    >
      {all.map((level) => {
        const active = level === activeLevel;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={cn(
              'rounded-md px-3 py-1.5 label-caps transition-colors',
              active ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface',
            )}
            aria-pressed={active}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}

export function TerminalOverlay({
  open,
  onClose,
  lines,
}: {
  open: boolean;
  onClose: () => void;
  lines: { id: string; text: string; tone?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'outline' }[];
}) {
  const reduceMotion = useReducedMotion();

  if (!open) return null;

  const toneClass: Record<string, string> = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
    error: 'text-error',
    outline: 'text-outline',
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Terminal"
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel milled-border w-full max-w-2xl overflow-hidden rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-white/8 bg-surface-container/30 px-4 py-2">
          <span className="label-caps text-outline">terminal — openclaw@vps</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-outline hover:bg-white/5 hover:text-on-surface"
            aria-label="Close terminal"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto scroll-hide p-4 font-mono text-body-code">
          {lines.map((line, i) => (
            <motion.div
              key={line.id}
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              className={cn('whitespace-pre-wrap', toneClass[line.tone ?? 'outline'])}
            >
              {line.text}
            </motion.div>
          ))}
          <div className="mt-2 flex items-center gap-1 text-primary">
            <span>$</span>
            <motion.span
              className="inline-block h-4 w-2 bg-primary"
              animate={reduceMotion ? undefined : { opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
