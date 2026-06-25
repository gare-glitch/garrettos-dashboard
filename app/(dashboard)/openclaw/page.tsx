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
import {
  AgentHealthGrid,
  BlockedRescue,
  LogConsole,
  SessionMonitor,
  TaskBoard,
} from '@/components/garrettos/agent-ops';
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
import { useGarrettOSData } from '@/lib/garrettos/use-garrettos-data';
import type {
  AgentsPayload,
  EventsPayload,
  HealthPayload,
  TasksPayload,
  TmuxSession,
} from '@/lib/garrettos/types';

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

  // --- Provider-backed live data (all fall back to mock on any failure) ---
  const { data: healthData, source: healthSource, warning: healthWarning } = useGarrettOSData<HealthPayload>(
    '/api/garrettos/health',
    () => ({ health: [], telemetry: { cpu: '—', mem: '—', lat: '—', api: '—', activeModel: '—', agentStatus: 'Idle', activeAgents: 0 } }),
  );

  const { data: agentsData, source: agentsSource, warning: agentsWarning } = useGarrettOSData<AgentsPayload>(
    '/api/garrettos/agents',
    () => ({
      sessions: osAgentFleet.map((f) => ({ id: f.id, name: f.name, model: f.model, status: f.status, latency: f.latency, uptime: f.uptime })),
      fleet: osAgentFleet,
      graph: { nodes: osAgents.nodes, edges: osAgents.edges },
      approvals: osApprovals,
      tmux_sessions: osTmuxSessions as unknown as TmuxSession[],
    }),
  );

  const { data: tasksData, source: tasksSource, warning: tasksWarning } = useGarrettOSData<TasksPayload>(
    '/api/garrettos/tasks',
    () => ({ tasks: osTasks }),
  );

  const { data: eventsData, source: eventsSource, warning: eventsWarning } = useGarrettOSData<EventsPayload>(
    '/api/garrettos/events',
    () => ({ events: [] }),
  );

  // --- Hardened defaults (no .map on undefined, no unguarded nested access) ---
  const fleet = Array.isArray(agentsData?.fleet) ? agentsData!.fleet : osAgentFleet;
  const graphNodes = Array.isArray(agentsData?.graph?.nodes) ? agentsData!.graph.nodes : osAgents.nodes;
  const graphEdges = Array.isArray(agentsData?.graph?.edges) ? agentsData!.graph.edges : osAgents.edges;
  const approvals = Array.isArray(agentsData?.approvals) ? agentsData!.approvals : osApprovals;
  const tmuxSessions: TmuxSession[] = Array.isArray(agentsData?.tmux_sessions)
    ? agentsData!.tmux_sessions
    : osTmuxSessions as unknown as TmuxSession[];
  const tasks = Array.isArray(tasksData?.tasks) ? tasksData!.tasks : osTasks;
  const events = Array.isArray(eventsData?.events) ? eventsData!.events : [];
  const agentHealth = healthData?.agent_health ?? null;
  const activeFleetCount = fleet.filter((a) => a?.status === 'active').length;

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
        title="Agent Operations Center"
        description="Live tmux sessions, task board, event stream, agent health, and blocked-task rescue. Read-only — no mutating actions yet."
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

      {/* Blocked-task rescue — shown prominently only when blocked tasks exist */}
      <BlockedRescue tasks={tasks} />

      {/* Top row: session monitor + agent health */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <SessionMonitor
          sessions={tmuxSessions}
          source={agentsSource}
          warning={agentsWarning}
        />
        <AgentHealthGrid
          health={agentHealth}
          source={healthSource}
          warning={healthWarning}
        />
      </div>

      {/* Agent fleet (grid or table) + guardrails */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <ScrollReveal className="lg:col-span-2">
          <SectionHeaderCompact
            title="Agent fleet"
            meta={
              <span className="flex items-center gap-2">
                <StatusChip label={`${activeFleetCount}/${fleet.length} active`} tone="info" size="inline" />
                <StatusChip
                  label={agentsSource === 'server' ? 'Live' : agentsSource === 'stale' ? 'Stale' : 'Mock'}
                  tone={agentsSource === 'server' ? 'good' : agentsSource === 'stale' ? 'warn' : 'info'}
                  showPip
                  size="inline"
                />
              </span>
            }
          />
          <div className="mt-2">
            {fleet.length === 0 ? (
              <GlassPanel variant="card" className="p-6 text-center text-body-sm text-on-surface-variant">
                No agent sessions detected on the VPS.
              </GlassPanel>
            ) : view === 'grid' ? (
              <AgentGraph nodes={graphNodes} edges={graphEdges} />
            ) : (
              <AgentFleetTable
                rows={fleet}
                onConfigure={(id) => {
                  const row = fleet.find((a) => a?.id === id);
                  if (row) openDrawer(row);
                }}
              />
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

      {/* Task board grouped by status */}
      <TaskBoard tasks={tasks} source={tasksSource} warning={tasksWarning} />

      {/* Pending approvals + compact task queue */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <ScrollReveal>
          <SectionHeaderCompact
            title="Pending approvals"
            meta={<StatusChip label={`${approvals.length} queued`} tone="warn" size="inline" />}
          />
          <GlassPanel variant="card" className="mt-2 p-4">
            {approvals.length === 0 ? (
              <p className="py-4 text-center text-body-sm text-on-surface-variant">No pending approvals.</p>
            ) : (
              <StaggerReveal className="space-y-2">
                {approvals.map((a) => (
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
            )}
          </GlassPanel>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <SectionHeaderCompact
            title="Compact task queue"
            meta={
              <StatusChip
                label={tasksSource === 'server' ? 'Live' : tasksSource === 'stale' ? 'Stale' : 'Mock'}
                tone={tasksSource === 'server' ? 'good' : tasksSource === 'stale' ? 'warn' : 'info'}
                showPip
                size="inline"
              />
            }
          />
          <TaskQueue tasks={tasks} className="mt-2" />
        </ScrollReveal>
      </div>

      {/* Event/log stream with filters */}
      <LogConsole events={events} source={eventsSource} warning={eventsWarning} />

      {/* tmux sessions (legacy card view, kept alongside the new monitor) */}
      <ScrollReveal>
        <SectionHeaderCompact
          title="tmux sessions"
          meta={
            <StatusChip
              label={`${tmuxSessions.filter((s) => s?.attached).length} attached`}
              tone="info"
              size="inline"
            />
          }
        />
        {tmuxSessions.length === 0 ? (
          <GlassPanel variant="card" className="mt-2 p-6 text-center text-body-sm text-on-surface-variant">
            No tmux sessions detected.
          </GlassPanel>
        ) : (
          <StaggerReveal className="mt-2 grid gap-gutter md:grid-cols-3">
            {tmuxSessions.map((s) => (
              <StaggerItem key={s.name}>
                <GlassPanel variant="card" interactive className="p-4">
                  <div className="flex items-center justify-between">
                    <p className={cn(typography.bodyLg, 'font-mono font-medium')}>{s.name}</p>
                    <BreathingPip tone={s.attached ? 'secondary' : 'idle'} pulse={s.attached} />
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-outline">{s.command ?? '—'}</p>
                  <p className="mt-2 text-[10px] text-outline">{s.attached ? 'Attached' : 'Detached'}</p>
                </GlassPanel>
              </StaggerItem>
            ))}
          </StaggerReveal>
        )}
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
