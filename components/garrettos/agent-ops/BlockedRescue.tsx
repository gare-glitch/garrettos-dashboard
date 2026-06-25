'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from '../GlassPanel';
import { GarrettIcon } from '../GarrettIcon';
import { ScrollReveal } from '../motion';
import type { TaskRun } from '@/lib/garrettos/types';

/**
 * BlockedRescue — surfaces blocked tasks prominently with a suggested next
 * action. Read-only: no destructive action buttons yet (per M9 rules).
 * Renders nothing if there are no blocked tasks.
 */
export function BlockedRescue({
  tasks,
  className,
}: {
  tasks?: TaskRun[];
  className?: string;
}) {
  const blocked = (Array.isArray(tasks) ? tasks : []).filter((t) => t?.status === 'blocked');
  if (blocked.length === 0) return null;

  return (
    <ScrollReveal className={className}>
      <GlassPanel variant="card" className="border-primary/30 p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <GarrettIcon name="gpp_maybe" size={18} className="text-primary" />
          </span>
          <div>
            <h3 className={typography.headlineMd}>Blocked tasks need attention</h3>
            <p className="text-[11px] text-on-surface-variant">
              {blocked.length} task{blocked.length === 1 ? '' : 's'} blocked · review-only, no actions yet
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {blocked.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className={cn(typography.bodySm, 'font-medium')}>{t.title}</p>
                <span className="label-caps rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  {t.priority} priority
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-outline">{t.agent}</p>
              {t.tmuxSession ? (
                <p className="mt-0.5 truncate font-mono text-[9px] text-tertiary/80">tmux: {t.tmuxSession}</p>
              ) : null}
              <div className="mt-2 rounded-md border border-white/5 bg-surface-container/40 px-3 py-2">
                <p className="label-caps text-[9px] text-outline">Suggested next action</p>
                <p className={cn(typography.body, 'mt-0.5 text-[12px]')}>
                  {t.nextAction
                    ? t.nextAction
                    : 'Inspect the task log and unblock the dependency, then flip the frontmatter status to queued.'}
                </p>
              </div>
              {t.logPath ? (
                <p className="mt-1.5 truncate font-mono text-[9px] text-primary/70">log: {t.logPath}</p>
              ) : null}
              {t.lastLogTail ? (
                <pre className="mt-1.5 max-h-24 overflow-y-auto scroll-hide rounded border border-white/5 bg-[#021018]/60 px-2 py-1 font-mono text-[9px] leading-relaxed text-outline">
                  {t.lastLogTail.split('\n').slice(-8).join('\n')}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      </GlassPanel>
    </ScrollReveal>
  );
}
