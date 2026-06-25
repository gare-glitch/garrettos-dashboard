'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from './GlassPanel';
import { StatusChip } from './StatusChip';
import { StaggeredMotionList } from './motion';
import type { OsTask } from './types';

const statusTone: Record<OsTask['status'], 'info' | 'good' | 'warn' | 'bad' | 'idle'> = {
  queued: 'idle',
  running: 'info',
  review: 'warn',
  blocked: 'bad',
  done: 'good',
};

export function TaskQueue({
  tasks = [],
  className,
  limit = 5,
}: {
  tasks?: OsTask[];
  className?: string;
  limit?: number;
}) {
  const items = tasks.slice(0, limit);
  return (
    <GlassPanel variant="card" className={cn('p-3 md:p-4', className)} aria-label="Task queue">
      <ul className="space-y-0">
        <StaggeredMotionList
          items={items}
          direction="up"
          stagger={0.06}
          renderItem={(task) => (
            <li className="flex items-center justify-between gap-3 py-2.5 border-t border-white/5 first:border-t-0">
              <div className="min-w-0">
                <p className="truncate text-body-sm font-medium">{task.title}</p>
                <p className={typography.mono}>{task.agent}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <StatusChip label={task.priority} tone={task.priority === 'high' ? 'warn' : 'idle'} size="inline" />
                <StatusChip label={task.status} tone={statusTone[task.status]} showPip size="inline" />
              </div>
            </li>
          )}
        />
      </ul>
    </GlassPanel>
  );
}
