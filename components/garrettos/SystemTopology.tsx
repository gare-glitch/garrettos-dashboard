import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from './GlassPanel';
import { BreathingPip } from './BreathingPip';
import { GarrettIcon } from './GarrettIcon';
import { StatusChip } from './StatusChip';
import type { OsSystemNode } from './types';

const kindIcon: Record<OsSystemNode['kind'], string> = {
  service: 'dns',
  model: 'psychology',
  queue: 'sync',
  storage: 'storage',
};

export function SystemTopology({
  nodes,
  className,
}: {
  nodes: OsSystemNode[];
  className?: string;
}) {
  return (
    <GlassPanel variant="card" className={cn('p-3 md:p-4', className)} aria-label="System topology">
      <div className="grid gap-2 sm:grid-cols-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="glass-interactive flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-surface-container/30 px-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-surface-container-high/40">
                <GarrettIcon name={kindIcon[node.kind]} size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className={cn(typography.bodySm, 'truncate font-medium')}>{node.label}</p>
                <p className="label-caps text-[10px] text-outline">{node.kind}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusChip label={node.status} tone={node.status} showPip size="inline" />
              {node.metric ? <span className="font-mono text-[10px] tabular-nums text-outline">{node.metric}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
