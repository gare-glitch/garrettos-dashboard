'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from '../GlassPanel';
import { GarrettIcon } from '../GarrettIcon';
import { ScrollReveal } from '../motion';
import { SourceTag } from './SessionMonitor';
import type { EventStreamItem } from '@/lib/garrettos/types';

type Filter = 'all' | 'errors' | 'agents' | 'system';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'errors', label: 'Errors' },
  { id: 'agents', label: 'Agents' },
  { id: 'system', label: 'System' },
];

/**
 * LogConsole — premium terminal-style event/log stream for the Agent Ops
 * center. Supports all/errors/agents/system filtering against the `scope`
 * tag the bridge attaches to each event. Falls back to tone-based filtering
 * for mock events that have no scope.
 */
export function LogConsole({
  events,
  source,
  warning,
  className,
}: {
  events?: EventStreamItem[];
  source?: 'server' | 'mock' | 'stale';
  warning?: string;
  className?: string;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const list = Array.isArray(events) ? events : [];

  const filtered = useMemo(() => {
    if (filter === 'all') return list;
    return list.filter((e) => {
      if (e?.scope) return e.scope === filter;
      // Fallback classification for mock events without a scope tag.
      if (filter === 'errors') return e?.tone === 'bad';
      if (filter === 'agents') return ['OpenClaw', 'tmux', 'Codex', 'Claude'].includes(e?.source ?? '');
      return ['LiteLLM', 'Qdrant', 'Ollama', 'Valkey', 'VPS', 'Bridge'].includes(e?.source ?? '');
    });
  }, [list, filter]);

  return (
    <ScrollReveal className={className}>
      <GlassPanel variant="card" className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <GarrettIcon name="subject" size={18} className="text-primary" />
            <h3 className={typography.headlineMd}>Event stream</h3>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/8 bg-surface-container/40 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded-full px-3 py-1 label-caps text-[10px] transition-colors',
                  filter === f.id ? 'bg-primary/15 text-primary' : 'text-on-surface-variant',
                )}
                aria-pressed={filter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {warning ? <p className={cn(typography.body, 'px-4 pt-2 text-[11px] text-primary/80')}>{warning}</p> : null}

        <div className="flex items-center justify-end px-4 py-1.5">
          <SourceTag source={source} count={filtered.length} label="events" />
        </div>

        <div className="max-h-[360px] overflow-y-auto scroll-hide px-4 pb-4 font-mono text-body-code">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-body-sm text-on-surface-variant">No events in this scope.</p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((e) => (
                <li key={e.id} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-white/[0.02]">
                  <span className="shrink-0 tabular-nums text-[10px] text-outline">{e.time}</span>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                      e.tone === 'bad'
                        ? 'bg-error/15 text-error'
                        : e.tone === 'warn'
                          ? 'bg-primary/15 text-primary'
                          : e.tone === 'good'
                            ? 'bg-secondary/15 text-secondary'
                            : 'bg-white/5 text-on-surface-variant',
                    )}
                  >
                    {e.source}
                  </span>
                  <span className="min-w-0 flex-1 text-on-surface-variant">{e.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassPanel>
    </ScrollReveal>
  );
}
