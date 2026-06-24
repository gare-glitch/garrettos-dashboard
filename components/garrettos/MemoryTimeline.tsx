import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from './GlassPanel';
import type { OsMemoryEntry } from './types';

export function MemoryTimeline({
  entries,
  className,
  limit = 5,
}: {
  entries: OsMemoryEntry[];
  className?: string;
  limit?: number;
}) {
  return (
    <GlassPanel className={cn('p-3 md:p-4', className)} aria-label="Memory timeline">
      <ol className="relative space-y-0 border-l border-border/80 pl-4">
        {entries.slice(0, limit).map((entry) => (
          <li key={entry.id} className="relative pb-3 last:pb-0">
            <span className="absolute -left-[calc(1rem+3px)] top-1.5 size-1.5 rounded-full bg-cyan" aria-hidden />
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-medium">{entry.title}</p>
              <time className={cn(typography.mono, 'shrink-0')}>{entry.timestamp}</time>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {entry.source} • {entry.tags.join(', ')}
            </p>
          </li>
        ))}
      </ol>
    </GlassPanel>
  );
}
