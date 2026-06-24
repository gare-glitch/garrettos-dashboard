import Link from 'next/link';
import {
  AgentGraph,
  AnimatedCounter,
  EventStream,
  GlassPanel,
  MemoryTimeline,
  MetricCard,
  MiniChart,
  SectionHeader,
  SectionHeaderCompact,
  Sparkline,
  StatusChip,
  SystemTopology,
  TaskQueue,
} from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import {
  osAgents,
  osApiUsage,
  osApprovals,
  osEvents,
  osGarminSummary,
  osMemory,
  osModelRoutes,
  osOpportunities,
  osPriorities,
  osResearch,
  osRevenue,
  osTasks,
  osTopology,
} from '@/data/os-mock';
import { agentRuns } from '@/data/mock';

export default function HomePage() {
  return (
    <div className={spacing.page}>
      <SectionHeader
        eyebrow="Command Center"
        title="Operating system overview"
        description="Unified view of agents, memory, infrastructure, health, research, and revenue. Mock data — Phase 2 wires live integrations."
      />

      {/* Row 1: Key metrics */}
      <div className="os-bento">
        <MetricCard
          label="Body Battery"
          value={<AnimatedCounter value={osGarminSummary.bodyBattery} />}
          delta={`Recovery ${osGarminSummary.recovery}`}
          tone="good"
          sparkline={<Sparkline values={osGarminSummary.trend} label="body battery trend" />}
          className="col-span-1 md:col-span-3"
          compact
        />
        <MetricCard
          label="Revenue MTD"
          value={<AnimatedCounter value={osRevenue.mtd} suffix="" />}
          delta={osRevenue.delta}
          tone="good"
          sparkline={<Sparkline values={osRevenue.sparkline} label="revenue trend" color="stroke-green" />}
          footer="$12.4k across active projects"
          className="col-span-1 md:col-span-3"
          compact
        />
        <MetricCard
          label="Running agents"
          value={osAgents.nodes.filter((n) => n.status === 'active').length}
          delta={`${osTasks.filter((t) => t.status === 'running').length} active tasks`}
          tone="info"
          className="col-span-1 md:col-span-3"
          compact
        />
        <MetricCard
          label="Memory index"
          value="248"
          delta="12 new today"
          tone="info"
          footer="Obsidian + OpenClawMemory"
          className="col-span-1 md:col-span-3"
          compact
        />
      </div>

      {/* Row 2: Priorities + Agents */}
      <div className="os-bento">
        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Today's priorities" meta={<StatusChip label={`${osPriorities.length} items`} tone="warn" />} />
          <GlassPanel className="mt-2 p-3">
            <ul className="space-y-0">
              {osPriorities.map((p, i) => (
                <li key={p.id} className={`flex items-center justify-between gap-2 py-2 ${i > 0 ? 'border-t border-border/60' : ''}`}>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground">{p.module}</p>
                  </div>
                  <StatusChip label={p.urgency} tone={p.urgency} />
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>

        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Running agents" />
          <div className="mt-2">
            <AgentGraph nodes={osAgents.nodes} edges={osAgents.edges} />
          </div>
        </div>

        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="OpenClaw opportunities" />
          <GlassPanel className="mt-2 p-3">
            <ul className="space-y-0">
              {osOpportunities.map((o, i) => (
                <li key={o.id} className={`py-2 ${i > 0 ? 'border-t border-border/60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium">{o.title}</p>
                    <span className="shrink-0 text-[10px] tabular-nums text-cyan">{o.confidence}%</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{o.value}</p>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      </div>

      {/* Row 3: Memory, System, Research */}
      <div className="os-bento">
        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Memory summary" meta={<Link href="/memory" className="text-[10px] text-cyan hover:underline">View all</Link>} />
          <div className="mt-2">
            <MemoryTimeline entries={osMemory} limit={4} />
          </div>
        </div>

        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="System health" meta={<Link href="/system" className="text-[10px] text-cyan hover:underline">Topology</Link>} />
          <div className="mt-2">
            <SystemTopology nodes={osTopology} />
          </div>
        </div>

        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Research queue" />
          <GlassPanel className="mt-2 p-3">
            <ul className="space-y-0">
              {osResearch.map((r, i) => (
                <li key={r.id} className={`flex items-center justify-between gap-2 py-2 ${i > 0 ? 'border-t border-border/60' : ''}`}>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">{r.source}</p>
                  </div>
                  <StatusChip label={r.status} tone="info" />
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      </div>

      {/* Row 4: Tasks, Approvals, Model routing */}
      <div className="os-bento">
        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Task queue" meta={<Link href="/openclaw" className="text-[10px] text-cyan hover:underline">OpenClaw</Link>} />
          <div className="mt-2">
            <TaskQueue tasks={osTasks} />
          </div>
        </div>

        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Task approvals" />
          <GlassPanel className="mt-2 p-3">
            <ul className="space-y-0">
              {osApprovals.map((a, i) => (
                <li key={a.id} className={`flex items-center justify-between gap-2 py-2 ${i > 0 ? 'border-t border-border/60' : ''}`}>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{a.action}</p>
                    <p className="text-[10px] text-muted-foreground">{a.agent}</p>
                  </div>
                  <StatusChip label={a.risk} tone={a.risk === 'high' ? 'bad' : a.risk === 'medium' ? 'warn' : 'good'} />
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>

        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Model routing" />
          <GlassPanel className="mt-2 p-3">
            <ul className="space-y-0">
              {osModelRoutes.map((m, i) => (
                <li key={m.model} className={`py-2 ${i > 0 ? 'border-t border-border/60' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium">{m.model}</p>
                      <p className="text-[10px] text-muted-foreground">{m.provider}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs tabular-nums">{m.usage}%</p>
                      <p className="text-[10px] text-muted-foreground">{m.latency}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      </div>

      {/* Row 5: API usage, Events, Garmin chart */}
      <div className="os-bento">
        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="API usage" />
          <GlassPanel className="mt-2 space-y-3 p-3">
            {osApiUsage.map((api) => (
              <div key={api.service}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{api.service}</span>
                  <span className="tabular-nums text-muted-foreground">{api.calls} calls • {api.cost}</span>
                </div>
                <Sparkline values={api.trend} label={`${api.service} usage`} className="mt-1 max-w-none" />
              </div>
            ))}
          </GlassPanel>
        </div>

        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Recent events" />
          <div className="mt-2">
            <EventStream events={osEvents} limit={5} />
          </div>
        </div>

        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Garmin summary" meta={<Link href="/health" className="text-[10px] text-cyan hover:underline">Health</Link>} />
          <GlassPanel className="mt-2 p-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold tabular-nums">{osGarminSummary.sleep}</p>
                <p className="text-[10px] text-muted-foreground">Sleep</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{osGarminSummary.hrv}</p>
                <p className="text-[10px] text-muted-foreground">HRV</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{osGarminSummary.recovery}</p>
                <p className="text-[10px] text-muted-foreground">Recovery</p>
              </div>
            </div>
            <MiniChart values={osGarminSummary.trend} label="weekly body battery" className="mt-3" />
          </GlassPanel>
        </div>
      </div>

      {/* Row 6: OpenClaw runs from legacy mock */}
      <div className="os-bento">
        <GlassPanel className="col-span-2 p-3 md:col-span-12">
          <SectionHeaderCompact
            title="Agent runs requiring attention"
            meta={<StatusChip label={`${agentRuns.length} runs`} tone="warn" />}
          />
          <ul className="mt-2 grid gap-2 md:grid-cols-3">
            {agentRuns.map((run) => (
              <li key={run.title} className="rounded-xl border border-border bg-input/20 px-3 py-2">
                <p className="text-xs font-medium">{run.title}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <StatusChip label={run.status} tone={run.status === 'blocked' ? 'bad' : 'warn'} />
                  <span className="truncate text-[10px] text-muted-foreground">{run.approval}</span>
                </div>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>
    </div>
  );
}
