'use client';

import { useMemo, useState } from 'react';
import {
  AnimatedCounter,
  GlassPanel,
  MetricCard,
  ScrollReveal,
  SectionHeader,
  SectionHeaderCompact,
  StaggerItem,
  StaggerReveal,
  StatusChip,
  SystemTopology,
  TelemetryChip,
} from '@/components/garrettos';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { LogFilterBar, LogStream, TerminalOverlay, type LogLevel, type LogEntry } from '@/components/garrettos/LogStream';
import { ThinkingLoader } from '@/components/garrettos/ThinkingLoader';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { osModelRoutes } from '@/data/os-mock';
import { osSystemContainers, osSystemLogs, osTerminalLines } from '@/data/os-mock';
import { osTopology } from '@/data/os-mock';
import { vpsMetrics } from '@/data/mock';

export default function SystemPage() {
  const [activeLevel, setActiveLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [terminalOpen, setTerminalOpen] = useState(false);

  const filteredLogs = useMemo<LogEntry[]>(() => {
    if (activeLevel === 'ALL') return osSystemLogs;
    return osSystemLogs.filter((l) => l.level === activeLevel);
  }, [activeLevel]);

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow="System Health"
        title="VPS, containers, models, and routing"
        description="Mock telemetry now; Phase 2 wires Hetzner + Ollama + LiteLLM + Qdrant live probes."
        action={
          <button
            type="button"
            onClick={() => setTerminalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-container/40 px-4 py-2 text-body-sm font-medium text-on-surface transition-colors hover:border-primary/30 hover:text-primary"
          >
            <GarrettIcon name="terminal" size={18} />
            Open terminal
          </button>
        }
      />

      {/* Telemetry chips */}
      <ScrollReveal>
        <div className="flex flex-wrap items-center gap-2">
          <TelemetryChip icon="memory" value="CPU: 24%" />
          <TelemetryChip icon="sensors" value="MEM: 12.4 GB" />
          <TelemetryChip icon="signal_cellular_alt" value="LAT: 12ms" />
          <TelemetryChip icon="hub" value="API: 1.2k/hr" />
          <StatusChip label="All systems nominal" tone="good" showPip />
        </div>
      </ScrollReveal>

      {/* Host metric cards */}
      <StaggerReveal className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        {vpsMetrics.map((host) => (
          <StaggerItem key={host.host}>
            <MetricCard
              variant="progress"
              label={host.host}
              value={<AnimatedCounter value={host.cpu} suffix="%" />}
              delta={`RAM ${host.ram}% • Disk ${host.disk}%`}
              tone={host.cpu > 50 ? 'warn' : 'good'}
              progress={host.cpu}
              footer={host.services}
            />
          </StaggerItem>
        ))}
      </StaggerReveal>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        {/* Service topology */}
        <ScrollReveal className="lg:col-span-2">
          <SectionHeaderCompact
            title="Service topology"
            meta={<StatusChip label={`${osTopology.length} services`} tone="info" size="inline" />}
          />
          <SystemTopology nodes={osTopology} className="mt-2" />
        </ScrollReveal>

        {/* Containers */}
        <ScrollReveal delay={0.05}>
          <SectionHeaderCompact title="Containers" />
          <GlassPanel variant="card" className="mt-2 p-4">
            <StaggerReveal className="space-y-2">
              {osSystemContainers.map((c) => {
                const running = c.status === 'running';
                return (
                  <StaggerItem key={c.id}>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'size-2 rounded-full',
                            running ? 'bg-secondary breathing-pip' : c.status === 'restart' ? 'bg-primary breathing-pip' : 'bg-error',
                          )}
                        />
                        <div>
                          <p className={cn(typography.bodySm, 'font-mono')}>{c.name}</p>
                          <p className="text-[10px] text-outline">{c.uptime} uptime</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[11px] text-on-surface-variant">{c.cpu}% CPU</p>
                        <p className="font-mono text-[10px] text-outline">{c.mem} GB</p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerReveal>
          </GlassPanel>
        </ScrollReveal>
      </div>

      {/* Model routing matrix */}
      <ScrollReveal>
        <SectionHeaderCompact
          title="Model routing matrix"
          meta={<ThinkingLoader label="Live" />}
        />
        <GlassPanel variant="card" className="mt-2 overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th className="px-4 py-3 label-caps text-outline">Provider</th>
                <th className="px-3 py-3 label-caps text-outline">Model</th>
                <th className="px-3 py-3 label-caps text-outline">Usage</th>
                <th className="px-3 py-3 label-caps text-outline">Latency</th>
                <th className="px-4 py-3 label-caps text-outline text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {osModelRoutes.map((m) => (
                <tr key={m.model} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">{m.provider}</td>
                  <td className="px-3 py-3 font-mono text-on-surface-variant">{m.model}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-container-highest">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${m.usage}%` }} />
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-on-surface">{m.usage}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-on-surface-variant">{m.latency}</td>
                  <td className="px-4 py-3 text-right">
                    <StatusChip label={m.status} tone={m.status} showPip size="inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      </ScrollReveal>

      {/* Log stream */}
      <ScrollReveal>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeaderCompact title="System logs" />
          <LogFilterBar levels={['INFO', 'WARN', 'ERROR', 'DEBUG']} activeLevel={activeLevel} onChange={setActiveLevel} />
        </div>
        <LogStream entries={filteredLogs} className="mt-2" />
      </ScrollReveal>

      <TerminalOverlay
        open={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        lines={osTerminalLines}
      />
    </div>
  );
}
