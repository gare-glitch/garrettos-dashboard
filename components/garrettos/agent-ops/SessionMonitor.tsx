'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from '../GlassPanel';
import { BreathingPip } from '../BreathingPip';
import { GarrettIcon } from '../GarrettIcon';
import { ScrollReveal } from '../motion';
import type { TmuxSession } from '@/lib/garrettos/types';

/**
 * SessionMonitor — live tmux/session monitor for the Agent Ops center.
 * Renders name, status (attached/idle), last seen, current pane command,
 * and window count. Empty state when no sessions are running.
 */
export function SessionMonitor({
  sessions,
  source,
  warning,
  className,
}: {
  sessions?: TmuxSession[];
  source?: 'server' | 'mock' | 'stale';
  warning?: string;
  className?: string;
}) {
  const list = Array.isArray(sessions) ? sessions : [];

  return (
    <ScrollReveal className={className}>
      <GlassPanel variant="card" className="p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GarrettIcon name="terminal" size={18} className="text-primary" />
            <h3 className={typography.headlineMd}>Session monitor</h3>
          </div>
          <SourceTag source={source} count={list.length} label="sessions" />
        </div>

        {warning ? <p className={cn(typography.body, 'mb-3 text-[11px] text-primary/80')}>{warning}</p> : null}

        {list.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-on-surface-variant">
            No tmux sessions detected on the VPS.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <BreathingPip tone={s.attached ? 'secondary' : 'idle'} pulse={s.attached} />
                  <div className="min-w-0">
                    <p className={cn(typography.bodySm, 'truncate font-mono font-medium')}>{s.name}</p>
                    <p className="truncate font-mono text-[10px] text-outline">
                      {s.command && s.command !== '—' ? s.command : '—'} · {s.windows ?? '1'} win
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className={cn('label-caps text-[10px]', s.attached ? 'text-secondary' : 'text-outline')}>
                    {s.attached ? 'Attached' : 'Detached'}
                  </span>
                  {s.last_seen ? <span className="font-mono text-[9px] text-outline">{s.last_seen}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </ScrollReveal>
  );
}

/** Small reusable source chip used across the ops panels. */
export function SourceTag({
  source,
  count,
  label,
}: {
  source?: 'server' | 'mock' | 'stale';
  count: number;
  label: string;
}) {
  const tone = source === 'server' ? 'text-secondary' : source === 'stale' ? 'text-primary' : 'text-outline';
  const tag = source === 'server' ? 'Live' : source === 'stale' ? 'Stale' : 'Mock';
  return (
    <span className={cn('flex items-center gap-2 font-mono text-[10px]', tone)}>
      <span className="tabular-nums text-on-surface-variant">{count} {label}</span>
      <span className={cn('rounded-full border px-2 py-0.5', source === 'server' ? 'border-secondary/30 bg-secondary/10' : source === 'stale' ? 'border-primary/30 bg-primary/10' : 'border-white/10 bg-white/5')}>{tag}</span>
    </span>
  );
}
