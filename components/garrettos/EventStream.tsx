import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from './GlassPanel';
import { StatusChip } from './StatusChip';
import type { OsEvent } from './types';

export function EventStream({
  events,
  className,
  limit = 6,
}: {
  events: OsEvent[];
  className?: string;
  limit?: number;
}) {
  const items = events.slice(0, limit);

  return (
    <GlassPanel className={cn('p-3 md:p-4', className)} aria-label="Recent events">
      <ul className="space-y-0">
        {items.map((event, i) => (
          <li
            key={event.id}
            className={cn(
              'flex items-start gap-3 py-2.5',
              i > 0 && 'border-t border-border/60',
            )}
          >
            <time className={cn(typography.mono, 'shrink-0 pt-0.5 text-muted-foreground')}>{event.time}</time>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{event.source}</span>
                <StatusChip label={event.tone} tone={event.tone} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{event.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
