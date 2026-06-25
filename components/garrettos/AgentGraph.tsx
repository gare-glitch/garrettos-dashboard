import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from './GlassPanel';
import { BreathingPip } from './BreathingPip';
import { GarrettIcon } from './GarrettIcon';
import { StatusChip } from './StatusChip';
import type { OsAgentEdge, OsAgentNode } from './types';

const statusTone = {
  active: 'good',
  idle: 'idle',
  error: 'bad',
} as const;

export function AgentGraph({
  nodes = [],
  edges = [],
  className,
}: {
  nodes?: OsAgentNode[];
  edges?: OsAgentEdge[];
  className?: string;
}) {
  return (
    <GlassPanel variant="card" className={cn('p-3 md:p-4', className)} aria-label="Agent graph">
      {nodes.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-on-surface-variant">No agent nodes.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="glass-interactive rounded-xl border border-white/5 bg-surface-container/30 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <GarrettIcon name="smart_toy" size={16} className="text-primary" />
                  <span className={cn(typography.bodySm, 'truncate font-medium')}>{node.label}</span>
                </div>
                <BreathingPip
                  tone={node.status === 'active' ? 'secondary' : node.status === 'error' ? 'error' : 'idle'}
                  pulse={node.status === 'active' || node.status === 'error'}
                />
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className={cn(
                    'h-full rounded-full',
                    node.status === 'active' ? 'bg-secondary' : node.status === 'error' ? 'bg-error' : 'bg-outline',
                  )}
                  style={{ width: `${node.load}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-outline">{node.load}% load</span>
                <StatusChip label={node.status} tone={statusTone[node.status] ?? 'idle'} size="inline" />
              </div>
            </div>
          ))}
        </div>
      )}
      {edges.length > 0 ? (
        <p className="mt-3 font-mono text-[10px] text-outline">
          {edges.length} active routes • {edges.map((e) => `${e.from}→${e.to}`).join(', ')}
        </p>
      ) : null}
    </GlassPanel>
  );
}
