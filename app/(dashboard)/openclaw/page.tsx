'use client';

import { useState } from 'react';
import {
  AgentGraph,
  GlassPanel,
  ScrollReveal,
  SectionHeader,
  SectionHeaderCompact,
  StaggerItem,
  StaggerReveal,
  StatusChip,
  TaskQueue,
  type AgentConfig,
  type AgentFleetRow,
  type Approval,
} from '@/components/garrettos';
import { ApprovalDialog, AgentFleetTable, AgentDrawer } from '@/components/garrettos/AgentOps';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { BreathingPip } from '@/components/garrettos/BreathingPip';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import {
  osAgents,
  osAgentFleet,
  osApprovals,
  osGuardrails,
  osTasks,
  osTmuxSessions,
} from '@/data/os-mock';

type View = 'grid' | 'table';

export default function OpenClawPage() {
  const [view, setView] = useState<View>('grid');
  const [approval, setApproval] = useState<Approval | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentFleetRow | null>(null);
  const [config, setConfig] = useState<AgentConfig>({
    model: 'claude-sonnet',
    systemPrompt: 'You are a careful autonomous agent operating on the GarrettOS VPS. Prefer minimal blast radius. Never deploy without approval.',
    temperature: 0.2,
  });

  function openApproval(a: Approval) {
    setApproval(a);
    setApprovalOpen(true);
  }

  function closeApproval() {
    setApprovalOpen(false);
    setApproval(null);
  }

  function openDrawer(row: AgentFleetRow) {
    setActiveAgent(row);
    setConfig({
      model: row.model,
      systemPrompt: 'You are a careful autonomous agent operating on the GarrettOS VPS. Prefer minimal blast radius. Never deploy without approval.',
      temperature: 0.2,
    });
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow="OpenClaw Control"
        title="Agent orchestration and approvals"
        description="Agent fleet, approvals, guardrails, tmux sessions, and per-agent configuration. Approvals are mock."
        action={
          <div className="flex items-center gap-1 rounded-full border border-white/8 bg-surface-container/40 p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={cn(
                'rounded-full px-3 py-1.5 label-caps transition-colors',
                view === 'grid' ? 'bg-primary/15 text-primary' : 'text-on-surface-variant',
              )}
              aria-pressed={view === 'grid'}
            >
              <GarrettIcon name="grid_view" size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={cn(
                'rounded-full px-3 py-1.5 label-caps transition-colors',
                view === 'table' ? 'bg-primary/15 text-primary' : 'text-on-surface-variant',
              )}
              aria-pressed={view === 'table'}
            >
              <GarrettIcon name="table_rows" size={16} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        {/* Agent fleet (grid or table) */}
        <ScrollReveal className="lg:col-span-2">
          <SectionHeaderCompact
            title="Agent fleet"
            meta={<StatusChip label={`${osAgentFleet.filter((a) => a.status === 'active').length}/${osAgentFleet.length} active`} tone="info" size="inline" />}
          />
          <div className="mt-2">
            {view === 'grid' ? (
              <AgentGraph nodes={osAgents.nodes} edges={osAgents.edges} />
            ) : (
              <AgentFleetTable rows={osAgentFleet} onConfigure={(id) => {
                const row = osAgentFleet.find((a) => a.id === id);
                if (row) openDrawer(row);
              }} />
            )}
          </div>
        </ScrollReveal>

        {/* Guardrails */}
        <ScrollReveal delay={0.05}>
          <SectionHeaderCompact title="Guardrails" />
          <GlassPanel variant="card" className="mt-2 p-4">
            <StaggerReveal className="space-y-2">
              {osGuardrails.map((g) => (
                <StaggerItem key={g.id}>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2.5">
                    <p className={cn(typography.bodySm)}>{g.label}</p>
                    <span
                      className={cn(
                        'relative h-5 w-9 rounded-full transition-colors',
                        g.enabled ? 'bg-secondary/60' : 'bg-surface-container-highest',
                      )}
                      role="switch"
                      aria-checked={g.enabled}
                      aria-label={g.label}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 size-4 rounded-full bg-on-surface transition-transform',
                          g.enabled ? 'translate-x-4' : 'translate-x-0.5',
                        )}
                      />
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </GlassPanel>
        </ScrollReveal>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        {/* Pending approvals */}
        <ScrollReveal>
          <SectionHeaderCompact
            title="Pending approvals"
            meta={<StatusChip label={`${osApprovals.length} queued`} tone="warn" size="inline" />}
          />
          <GlassPanel variant="card" className="mt-2 p-4">
            <StaggerReveal className="space-y-2">
              {osApprovals.map((a) => (
                <StaggerItem key={a.id}>
                  <button
                    type="button"
                    onClick={() => openApproval(a)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/5 bg-surface-container/30 px-3 py-3 text-left transition-colors hover:border-primary/20 hover:bg-primary/5"
                  >
                    <div className="min-w-0">
                      <p className={cn(typography.bodySm, 'font-medium')}>{a.action}</p>
                      <p className="text-[11px] text-outline">{a.agent}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusChip
                        label={`${a.risk} risk`}
                        tone={a.risk === 'high' ? 'bad' : a.risk === 'medium' ? 'warn' : 'good'}
                        size="inline"
                      />
                      <GarrettIcon name="chevron_right" size={16} className="text-outline" />
                    </div>
                  </button>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </GlassPanel>
        </ScrollReveal>

        {/* Task queue */}
        <ScrollReveal delay={0.05}>
          <SectionHeaderCompact title="Task queue" />
          <TaskQueue tasks={osTasks} className="mt-2" />
        </ScrollReveal>
      </div>

      {/* tmux sessions */}
      <ScrollReveal>
        <SectionHeaderCompact title="tmux sessions" meta={<StatusChip label="3 attached" tone="info" size="inline" />} />
        <StaggerReveal className="mt-2 grid gap-gutter md:grid-cols-3">
          {osTmuxSessions.map((s) => (
            <StaggerItem key={s.id}>
              <GlassPanel variant="card" interactive className="p-4">
                <div className="flex items-center justify-between">
                  <p className={cn(typography.bodyLg, 'font-mono font-medium')}>{s.name}</p>
                  <BreathingPip tone={s.attached ? 'secondary' : 'idle'} pulse={s.attached} />
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-outline">{s.command}</p>
                <p className="mt-2 text-[10px] text-outline">{s.attached ? 'Attached' : 'Detached'}</p>
              </GlassPanel>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </ScrollReveal>

      <ApprovalDialog
        approval={approval}
        open={approvalOpen}
        onClose={closeApproval}
        onApprove={() => closeApproval()}
        onDeny={() => closeApproval()}
      />

      <AgentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        agentName={activeAgent?.name ?? 'Agent'}
        config={config}
        onConfigChange={setConfig}
        onSave={() => setDrawerOpen(false)}
      />
    </div>
  );
}
