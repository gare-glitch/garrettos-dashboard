'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GlassPanel } from '../GlassPanel';
import { GarrettIcon } from '../GarrettIcon';
import { ScrollReveal, StaggerReveal, StaggerItem } from '../motion';
import { SourceTag } from './SessionMonitor';
import type { AgentHealth } from '@/lib/garrettos/types';

const HEALTH_ITEMS: { key: keyof AgentHealth; label: string; icon: string }[] = [
  { key: 'opencode', label: 'OpenCode', icon: 'code' },
  { key: 'claude', label: 'Claude Code', icon: 'smart_toy' },
  { key: 'openclaw', label: 'OpenClaw', icon: 'hub' },
  { key: 'litellm', label: 'LiteLLM', icon: 'route' },
  { key: 'ollama', label: 'Ollama', icon: 'memory' },
  { key: 'valkey', label: 'Valkey', icon: 'storage' },
  { key: 'qdrant', label: 'Qdrant', icon: 'database' },
  { key: 'tmux', label: 'tmux', icon: 'terminal' },
  { key: 'docker', label: 'Docker', icon: 'dns' },
];

/**
 * AgentHealthGrid — overview of the 9 services the ops center cares about.
 * Accepts a partial AgentHealth; any missing key is treated as unknown/idle.
 */
export function AgentHealthGrid({
  health,
  source,
  warning,
  className,
}: {
  health?: AgentHealth | null;
  source?: 'server' | 'mock' | 'stale';
  warning?: string;
  className?: string;
}) {
  const upCount = HEALTH_ITEMS.filter((i) => health?.[i.key] === true).length;

  return (
    <ScrollReveal className={className}>
      <GlassPanel variant="card" className="p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GarrettIcon name="monitor_heart" size={18} className="text-primary" />
            <h3 className={typography.headlineMd}>Agent health</h3>
          </div>
          <SourceTag source={source} count={upCount} label="up" />
        </div>

        {warning ? <p className={cn(typography.body, 'mb-3 text-[11px] text-primary/80')}>{warning}</p> : null}

        <StaggerReveal className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HEALTH_ITEMS.map((item) => {
            const up = health?.[item.key] === true;
            const unknown = health == null || health[item.key] === undefined;
            return (
              <StaggerItem key={item.key}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5',
                    up ? 'border-secondary/20 bg-secondary/5' : unknown ? 'border-white/8 bg-white/[0.02]' : 'border-primary/20 bg-primary/5',
                  )}
                >
                  <GarrettIcon name={item.icon} size={16} className={up ? 'text-secondary' : unknown ? 'text-outline' : 'text-primary'} />
                  <div className="min-w-0 flex-1">
                    <p className={cn(typography.bodySm, 'truncate font-medium')}>{item.label}</p>
                  </div>
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      up ? 'bg-secondary breathing-pip' : unknown ? 'bg-outline' : 'bg-primary breathing-pip',
                    )}
                    aria-label={up ? 'up' : unknown ? 'unknown' : 'down'}
                  />
                </div>
              </StaggerItem>
            );
          })}
        </StaggerReveal>
      </GlassPanel>
    </ScrollReveal>
  );
}
