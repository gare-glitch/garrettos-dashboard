'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from '../GlassPanel';
import { GarrettIcon } from '../GarrettIcon';
import { ScrollReveal, StaggerReveal, StaggerItem } from '../motion';
import { SourceTag } from './SessionMonitor';
import type { TaskRun } from '@/lib/garrettos/types';

const STATUS_ORDER: TaskRun['status'][] = ['blocked', 'running', 'review', 'queued', 'done'];
const STATUS_LABEL: Record<TaskRun['status'], string> = {
  blocked: 'Blocked',
  running: 'Running',
  review: 'Review',
  queued: 'Queued',
  done: 'Done',
};
const STATUS_TONE: Record<TaskRun['status'], string> = {
  blocked: 'text-primary border-primary/30 bg-primary/10',
  running: 'text-secondary border-secondary/30 bg-secondary/10',
  review: 'text-primary border-primary/20 bg-primary/5',
  queued: 'text-on-surface-variant border-white/10 bg-white/5',
  done: 'text-outline border-white/8 bg-white/[0.02]',
};

/**
 * TaskBoard — task queue grouped by status for the Agent Ops center.
 * Shows priority, agent, updated time, and log path when present.
 */
export function TaskBoard({
  tasks,
  source,
  warning,
  loading,
  className,
  onSelect,
  onCreate,
}: {
  tasks?: TaskRun[];
  source?: 'server' | 'mock' | 'stale';
  warning?: string;
  loading?: boolean;
  className?: string;
  onSelect?: (task: TaskRun) => void;
  /** Called after a task is created elsewhere (e.g. composer) so the board can refresh. */
  onCreate?: () => void;
}) {
  const list = Array.isArray(tasks) ? tasks : [];
  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: list.filter((t) => t?.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <ScrollReveal className={className}>
      <GlassPanel variant="card" className="p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GarrettIcon name="queue" size={18} className="text-primary" />
            <h3 className={typography.headlineMd}>Task board</h3>
          </div>
          <div className="flex items-center gap-3">
            {onCreate ? (
              <button
                type="button"
                onClick={onCreate}
                className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 label-caps text-[10px] text-primary transition-colors hover:bg-primary/15"
              >
                <GarrettIcon name="add_task" size={14} />
                New
              </button>
            ) : null}
            <SourceTag source={source} count={list.length} label="tasks" />
          </div>
        </div>

        {warning ? <p className={cn(typography.body, 'mb-3 text-[11px] text-primary/80')}>{warning}</p> : null}

        {loading ? (
          <p className="py-6 text-center text-body-sm text-on-surface-variant">Loading tasks…</p>
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-on-surface-variant">No tasks in the queue.</p>
        ) : (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-5">
            {grouped.map(({ status, items }) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn('label-caps rounded-full border px-2 py-0.5 text-[10px]', STATUS_TONE[status])}>
                    {STATUS_LABEL[status]}
                  </span>
                  <span className="font-mono text-[10px] text-outline tabular-nums">{items.length}</span>
                </div>
                <StaggerReveal className="space-y-2">
                  {items.map((t) => (
                    <StaggerItem key={t.id}>
                      <button
                        type="button"
                        onClick={() => onSelect?.(t)}
                        className="w-full rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2.5 text-left transition-colors hover:border-primary/20 hover:bg-primary/5"
                      >
                        <p className={cn(typography.bodySm, 'truncate font-medium')}>{t.title}</p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-outline">
                          {t.agent} · {t.priority} priority
                        </p>
                        {t.updated ? <p className="mt-0.5 font-mono text-[9px] text-outline">updated {t.updated}</p> : null}
                        {t.logPath ? (
                          <p className="mt-0.5 truncate font-mono text-[9px] text-primary/70">log: {t.logPath}</p>
                        ) : null}
                      </button>
                    </StaggerItem>
                  ))}
                </StaggerReveal>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </ScrollReveal>
  );
}
