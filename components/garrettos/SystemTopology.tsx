import { cn } from '@/lib/utils';
import { GlassPanel } from './GlassPanel';
import { StatusChip } from './StatusChip';
import type { OsSystemNode } from './types';

export function SystemTopology({
  nodes,
  className,
}: {
  nodes: OsSystemNode[];
  className?: string;
}) {
  return (
    <GlassPanel className={cn('p-3 md:p-4', className)} aria-label="System topology">
      <div className="grid gap-2 sm:grid-cols-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-input/20 px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{node.label}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{node.kind}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusChip label={node.status} tone={node.status} />
              {node.metric ? <span className="text-[10px] tabular-nums text-muted-foreground">{node.metric}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
