import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from './GlassPanel';
import { StatusChip } from './StatusChip';
import type { OsTask } from './types';

const statusTone: Record<OsTask['status'], 'info' | 'good' | 'warn' | 'bad' | 'idle'> = {
  queued: 'idle',
  running: 'info',
  review: 'warn',
  blocked: 'bad',
  done: 'good',
};

export function TaskQueue({
  tasks,
  className,
  limit = 5,
}: {
  tasks: OsTask[];
  className?: string;
  limit?: number;
}) {
  return (
    <GlassPanel className={cn('p-3 md:p-4', className)} aria-label="Task queue">
      <ul className="space-y-0">
        {tasks.slice(0, limit).map((task, i) => (
          <li
            key={task.id}
            className={cn('flex items-center justify-between gap-3 py-2.5', i > 0 && 'border-t border-border/60')}
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{task.title}</p>
              <p className={typography.mono}>{task.agent}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <StatusChip label={task.priority} tone={task.priority === 'high' ? 'warn' : 'idle'} />
              <StatusChip label={task.status} tone={statusTone[task.status]} />
            </div>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
