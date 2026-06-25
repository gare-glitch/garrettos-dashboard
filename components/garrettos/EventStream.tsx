'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from './GlassPanel';
import { StatusChip } from './StatusChip';
import { StaggeredMotionList } from './motion';
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
    <GlassPanel variant="card" className={cn('p-3 md:p-4', className)} aria-label="Recent events">
      <ul className="space-y-0">
        <StaggeredMotionList
          items={items}
          direction="up"
          stagger={0.06}
          renderItem={(event) => (
            <li className="flex items-start gap-3 py-2.5 border-t border-white/5 first:border-t-0">
              <time className={cn(typography.mono, 'shrink-0 pt-0.5 text-outline')}>{event.time}</time>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-medium text-on-surface">{event.source}</span>
                  <StatusChip label={event.tone} tone={event.tone} showPip size="inline" />
                </div>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">{event.message}</p>
              </div>
            </li>
          )}
        />
      </ul>
    </GlassPanel>
  );
}
