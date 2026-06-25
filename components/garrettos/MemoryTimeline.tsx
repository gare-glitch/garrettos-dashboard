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
    <GlassPanel variant="card" className={cn('p-3 md:p-4', className)} aria-label="Memory timeline">
      <ol className="relative space-y-0 border-l border-white/10 pl-5">
        {entries.slice(0, limit).map((entry, i) => (
          <li key={entry.id} className="relative pb-4 last:pb-0">
            <span
              className={cn(
                'absolute -left-[calc(1.25rem+2px)] top-1 size-2.5 rounded-full border-2 border-surface',
                i === 0 ? 'bg-primary shadow-[0_0_8px_rgba(236,189,164,0.45)]' : 'bg-outline',
              )}
              aria-hidden
            />
            <p className={cn(typography.mono, 'mb-0.5', i === 0 ? 'text-primary' : 'text-outline')}>
              {entry.timestamp}
            </p>
            <p className={cn(typography.bodySm, 'text-on-surface')}>{entry.title}</p>
            <p className="mt-0.5 text-[10px] text-outline">
              {entry.source} • {entry.tags.join(', ')}
            </p>
          </li>
        ))}
      </ol>
    </GlassPanel>
  );
}
