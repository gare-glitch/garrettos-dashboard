'use client';

import Link from 'next/link';
import {
  AnimatedCounter,
  AssistantPanel,
  EventStream,
  GlassPanel,
  HomeHero,
  MemoryTimeline,
  MetricCard,
  RevenueChart,
  RevenueSummary,
  ScrollReveal,
  SectionHeaderCompact,
  Sparkline,
  StaggerItem,
  StaggerReveal,
  StatusChip,
  TaskQueue,
  useCommandPaletteContext,
} from '@/components/garrettos';
import { supplements } from '@/data/mock';
import {
  osActiveNotes,
  osAgenda,
  osApiUsage,
  osApprovals,
  osAssistantMessages,
  osCurrentProject,
  osEvents,
  osGarminSummary,
  osMemory,
  osModelRoutes,
  osOpportunities,
  osPinnedProjects,
  osPriorities,
  osRevenue,
  osAgentSwarm,
  osSystemHealth,
  osTasks,
  osWaterSummary,
  osWeather,
  osWorkspaceStatus,
} from '@/data/os-mock';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { useGarrettOSData } from '@/lib/garrettos/use-garrettos-data';
import type { EventsPayload } from '@/lib/garrettos/types';

const accentBorder = {
  primary: 'border-l-primary',
  secondary: 'border-l-secondary',
  idle: 'border-l-transparent',
} as const;

export function CommandWorkspace() {
  const { openPalette } = useCommandPaletteContext();
  // Event stream is provider-backed; falls back to mock on any failure.
  const { data: eventsData } = useGarrettOSData<EventsPayload>(
    '/api/garrettos/events',
    () => ({ events: osEvents }),
  );
  const events = eventsData?.events ?? osEvents;

  return (
    <div className="space-y-6 md:space-y-8">
      <HomeHero onCommandOpen={openPalette} />

      {/* Primary 3-column grid */}
      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
        {/* LEFT — Today */}
        <aside className="space-y-gutter xl:col-span-3">
          <ScrollReveal>
            <GlassPanel variant="card" className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className={typography.headlineMd}>{osWeather.day}</h2>
                  <p className={typography.body}>{osWeather.date}</p>
                </div>
                <div className="text-right">
                  <GarrettIcon name="cloud" size={32} className="text-primary" />
                  <p className={cn(typography.bodyLg, 'font-bold')}>
                    {osWeather.temp}
                    {osWeather.unit}
                  </p>
                </div>
              </div>
            </GlassPanel>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <GlassPanel variant="card" className="p-4 md:p-5">
              <SectionHeaderCompact
                title="Priority Protocol"
                meta={<StatusChip label={`${osPriorities.length}`} tone="warn" size="inline" />}
              />
              <ul className="mt-3 space-y-2">
                {osAgenda.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      'flex gap-3 rounded-lg border-l-2 p-2 transition-colors hover:bg-white/5',
                      accentBorder[item.accent],
                    )}
                  >
                    <span className={cn(typography.labelCaps, 'pt-0.5 text-outline')}>{item.time}</span>
                    <div className="min-w-0">
                      <p className={cn(typography.bodyLg, 'font-semibold')}>{item.title}</p>
                      <p className="text-[11px] text-on-surface-variant">{item.location}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <MetricCard
              variant="progress"
              label="Biometrics"
              value={<AnimatedCounter value={osGarminSummary.bodyBattery} suffix="/100" />}
              delta={`Recovery ${osGarminSummary.recovery}`}
              tone="good"
              progress={osGarminSummary.bodyBattery}
              sparkline={<Sparkline values={osGarminSummary.trend} label="body battery" color="primary" />}
            />
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <GlassPanel variant="card" className="p-4">
              <SectionHeaderCompact title="Water & Supplements" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className={typography.labelCaps}>Intake</p>
                  <p className={typography.metricMd}>
                    {osWaterSummary.intake}
                    <span className="text-sm text-outline">/{osWaterSummary.goal} {osWaterSummary.unit}</span>
                  </p>
                </div>
                <div>
                  <p className={typography.labelCaps}>Due</p>
                  <p className={typography.metricMd}>{osWaterSummary.supplementsDue}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {supplements.slice(0, 2).map((s) => (
                  <li key={s.name} className="flex justify-between text-body-sm">
                    <span>{s.name}</span>
                    <StatusChip label={s.status} tone={s.status === 'low' ? 'warn' : 'good'} size="inline" />
                  </li>
                ))}
              </ul>
              <Link href="/water" className="mt-2 inline-block text-[11px] text-primary hover:underline">
                Open Water module
              </Link>
            </GlassPanel>
          </ScrollReveal>

          <ScrollReveal delay={0.12}>
            <GlassPanel variant="card" className="p-4">
              <SectionHeaderCompact title="Pinned Projects" />
              <ul className="mt-3 space-y-3">
                {osPinnedProjects.map((p) => (
                  <li key={p.id}>
                    <div className="flex justify-between text-body-sm">
                      <span className="font-medium">{p.name}</span>
                      <span className="font-mono text-primary">{p.progress}%</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-container-highest">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </ScrollReveal>
        </aside>

        {/* CENTER — Workspace */}
        <section className="space-y-gutter xl:col-span-6">
          <AssistantPanel messages={osAssistantMessages} generating={osWorkspaceStatus.generating} />

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <ScrollReveal>
              <GlassPanel variant="card" className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <h3 className={typography.labelCaps}>Current Project</h3>
                  <StatusChip label={osCurrentProject.phase} tone="info" size="inline" />
                </div>
                <p className={cn(typography.headlineMd, 'mt-2')}>{osCurrentProject.name}</p>
                <div className="mt-3 flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">{osCurrentProject.phase}</span>
                  <span className="font-mono text-primary">{osCurrentProject.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full glow-primary rounded-full bg-primary" style={{ width: `${osCurrentProject.progress}%` }} />
                </div>
              </GlassPanel>
            </ScrollReveal>

            <ScrollReveal delay={0.05}>
              <GlassPanel variant="card" className="p-4 md:p-5">
                <h3 className={typography.labelCaps}>Active Notes</h3>
                <ul className="mt-3 space-y-2">
                  {osActiveNotes.map((note) => (
                    <li key={note.id} className="group flex cursor-pointer items-center gap-2">
                      <GarrettIcon name="description" size={14} className="text-secondary" />
                      <span className="text-body-sm text-on-surface-variant transition-colors group-hover:text-on-surface">
                        {note.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/memory" className="mt-3 inline-block text-[11px] text-primary hover:underline">
                  Search memory index
                </Link>
              </GlassPanel>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={0.08}>
            <GlassPanel variant="card" className="p-4">
              <SectionHeaderCompact title="Research Module" meta={<Link href="/mentor" className="text-[10px] text-primary hover:underline">Mentor</Link>} />
              <StaggerReveal className="mt-3 space-y-2">
                {osPriorities.slice(0, 3).map((p) => (
                  <StaggerItem key={p.id}>
                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div>
                        <p className="text-body-sm font-medium">{p.label}</p>
                        <p className="text-[10px] text-outline">{p.module}</p>
                      </div>
                      <StatusChip label={p.urgency} tone={p.urgency} size="inline" />
                    </div>
                  </StaggerItem>
                ))}
              </StaggerReveal>
            </GlassPanel>
          </ScrollReveal>
        </section>

        {/* RIGHT — Live Intelligence */}
        <aside className="space-y-gutter xl:col-span-3">
          <ScrollReveal>
            <GlassPanel variant="card" className="p-4 md:p-5">
              <SectionHeaderCompact title="Agent Swarm" meta={<span className="label-caps text-[9px] text-primary">{osAgentSwarm.filter((a) => a.status === 'active').length} ACTIVE</span>} />
              <ul className="mt-3 space-y-3">
                {osAgentSwarm.map((agent) => (
                  <li key={agent.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'size-2 rounded-full',
                          agent.status === 'active' ? 'bg-secondary breathing-pip' : agent.status === 'idle' ? 'bg-primary/50' : 'bg-outline',
                        )}
                      />
                      <span className="text-body-sm">{agent.name}</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase text-outline">{agent.status}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <GlassPanel variant="card" className="p-4 md:p-5">
              <RevenueSummary total={`$${(osRevenue.mtd / 1000).toFixed(1)}k`} delta={osRevenue.delta} />
              <RevenueChart values={osRevenue.sparkline} label="Daily revenue" className="mt-4" />
            </GlassPanel>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <GlassPanel variant="card" className="p-4 md:p-5">
              <SectionHeaderCompact title="OpenClaw Opportunities" />
              <ul className="mt-3 space-y-2">
                {osOpportunities.map((o) => (
                  <li key={o.id} className="border-b border-white/5 pb-2 last:border-0">
                    <div className="flex justify-between gap-2">
                      <p className="text-body-sm font-medium">{o.title}</p>
                      <span className="shrink-0 font-mono text-[10px] text-tertiary">{o.confidence}%</span>
                    </div>
                    <p className="text-[10px] text-outline">{o.value}</p>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <GlassPanel variant="card" className="p-4 md:p-5">
              <SectionHeaderCompact title="System Health" />
              <ul className="mt-3 space-y-3">
                {osSystemHealth.map((row) => (
                  <li key={row.label} className="flex justify-between text-body-sm">
                    <span className="text-on-surface-variant">{row.label}</span>
                    <span className={cn('font-mono', row.tone === 'warn' ? 'text-primary' : 'text-secondary')}>{row.value}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </ScrollReveal>

          <ScrollReveal delay={0.12}>
            <GlassPanel variant="card" className="p-4">
              <SectionHeaderCompact title="API / Model Routing" />
              <ul className="mt-3 space-y-2">
                {osModelRoutes.slice(0, 3).map((m) => (
                  <li key={m.model} className="flex justify-between text-body-sm">
                    <span className="text-on-surface-variant">{m.model}</span>
                    <span className="font-mono text-on-surface">{m.usage}%</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-2">
                {osApiUsage.slice(0, 2).map((api) => (
                  <div key={api.service} className="flex justify-between text-[11px]">
                    <span>{api.service}</span>
                    <span className="font-mono text-outline">
                      <AnimatedCounter value={api.calls} /> calls
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </ScrollReveal>
        </aside>
      </div>

      {/* Bottom secondary grid */}
      <StaggerReveal className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
        <StaggerItem>
          <SectionHeaderCompact title="Task Queue" meta={<Link href="/openclaw" className="text-[10px] text-primary hover:underline">OpenClaw</Link>} />
          <TaskQueue tasks={osTasks} className="mt-2" />
        </StaggerItem>

        <StaggerItem>
          <SectionHeaderCompact title="Model Routing Matrix" />
          <GlassPanel variant="card" className="mt-2 p-4">
            <ul className="space-y-2">
              {osModelRoutes.map((m) => (
                <li key={m.model} className="grid grid-cols-[1fr_auto_auto] gap-2 text-body-sm">
                  <span>{m.model}</span>
                  <span className="font-mono text-outline">{m.latency}</span>
                  <StatusChip label={`${m.usage}%`} tone={m.status} size="inline" />
                </li>
              ))}
            </ul>
          </GlassPanel>
        </StaggerItem>

        <StaggerItem>
          <SectionHeaderCompact title="Memory Timeline" meta={<Link href="/memory" className="text-[10px] text-primary hover:underline">View all</Link>} />
          <MemoryTimeline entries={osMemory} limit={4} className="mt-2" />
        </StaggerItem>

        <StaggerItem>
          <SectionHeaderCompact title="Recent Events" />
          <EventStream events={events} limit={5} className="mt-2" />
        </StaggerItem>

        <StaggerItem>
          <SectionHeaderCompact title="Approvals" />
          <GlassPanel variant="card" className="mt-2 p-4">
            <ul className="space-y-2">
              {osApprovals.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium">{a.action}</p>
                    <p className="text-[10px] text-outline">{a.agent}</p>
                  </div>
                  <StatusChip
                    label={a.risk}
                    tone={a.risk === 'high' ? 'bad' : a.risk === 'medium' ? 'warn' : 'good'}
                    size="inline"
                  />
                </li>
              ))}
            </ul>
          </GlassPanel>
        </StaggerItem>

        <StaggerItem>
          <MetricCard
            variant="sparkline"
            label="Memory Chunks"
            value={<AnimatedCounter value={248} />}
            delta="12 new today"
            tone="info"
            sparkline={<Sparkline values={[220, 228, 235, 240, 244, 248, 248]} label="memory growth" color="tertiary" />}
            footer="Obsidian + OpenClawMemory"
          />
        </StaggerItem>
      </StaggerReveal>
    </div>
  );
}
