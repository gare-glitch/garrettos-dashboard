import { cn } from '@/lib/utils';
import { GlassPanel } from './GlassPanel';
import { StatusChip } from './StatusChip';
import type { OsAgentEdge, OsAgentNode } from './types';

export function AgentGraph({
  nodes,
  edges,
  className,
}: {
  nodes: OsAgentNode[];
  edges: OsAgentEdge[];
  className?: string;
}) {
  return (
    <GlassPanel className={cn('p-3 md:p-4', className)} aria-label="Agent graph">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="rounded-xl border border-border bg-input/30 px-2.5 py-2"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-xs font-medium">{node.label}</span>
              <StatusChip
                label={node.status}
                tone={node.status === 'active' ? 'good' : node.status === 'error' ? 'bad' : 'idle'}
              />
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-cyan" style={{ width: `${node.load}%` }} />
            </div>
          </div>
        ))}
      </div>
      {edges.length > 0 ? (
        <p className="mt-3 text-[10px] text-muted-foreground">
          {edges.length} active routes • {edges.map((e) => `${e.from}→${e.to}`).join(', ')}
        </p>
      ) : null}
    </GlassPanel>
  );
}
