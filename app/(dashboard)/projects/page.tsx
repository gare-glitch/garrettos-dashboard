'use client';

import {
  AnimatedCounter,
  GlassPanel,
  MetricCard,
  RevenueChart,
  RevenueSummary,
  ScrollReveal,
  SectionHeader,
  SectionHeaderCompact,
  Sparkline,
  StaggerItem,
  StaggerReveal,
  StatusChip,
} from '@/components/garrettos';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { projects } from '@/data/mock';
import { osRevenue } from '@/data/os-mock';

export const osProjectsOpportunities = [
  { id: 'op1', name: 'Acme Corp — AI audit retainer', value: '$24k', stage: 'Discovery', confidence: 60, owner: 'OpenClaw Cortex' },
  { id: 'op2', name: 'Stitch dashboard template license', value: '$6k', stage: 'Proposal', confidence: 80, owner: 'Direct' },
  { id: 'op3', name: 'Garmin HRV analytics API', value: '$12k', stage: 'Negotiation', confidence: 90, owner: 'Mentor' },
];

export const osProjectsEvents = [
  { id: 'ev1', title: 'OpenClaw agent demo', date: 'Jun 26', attendees: 4, tone: 'info' as const },
  { id: 'ev2', title: 'Q3 revenue review', date: 'Jul 01', attendees: 2, tone: 'good' as const },
  { id: 'ev3', title: 'Garmin sync deadline', date: 'Jul 03', attendees: 1, tone: 'warn' as const },
];

export const osProjectsLeads = [
  { id: 'le1', name: 'Jordan Reyes', source: 'Referral', note: 'Wants agent ops dashboard', value: '$8k' },
  { id: 'le2', name: 'Maya Chen', source: 'Stitch', note: 'Asked about voice hooks', value: '$4k' },
  { id: 'le3', name: 'Dev Patel', source: 'GitHub', note: 'Codex integration interest', value: '$6k' },
];

const stageTone: Record<string, 'good' | 'warn' | 'info' | 'idle'> = {
  Discovery: 'info',
  Proposal: 'info',
  Negotiation: 'warn',
  Closed: 'good',
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow="Projects / Revenue"
        title="Project execution and revenue signals"
        description="Revenue pipeline, opportunities, active projects, events, and leads. Mock data now; Phase 2 wires Stripe."
        action={<StatusChip label="Stripe pending" tone="warn" showPip />}
      />

      {/* Hero metrics */}
      <StaggerReveal className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Revenue MTD"
            value={<AnimatedCounter value={osRevenue.mtd} prefix="$" suffix="k" />}
            delta={osRevenue.delta}
            tone="good"
            sparkline={<Sparkline values={osRevenue.sparkline} label="revenue" color="primary" />}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Active projects"
            value={<AnimatedCounter value={projects.length} />}
            delta="Across 3 clients"
            tone="info"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Pipeline"
            value="$42k"
            delta="3 opportunities"
            tone="good"
            footer="Mock before Stripe integration"
          />
        </StaggerItem>
      </StaggerReveal>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        {/* Revenue chart */}
        <ScrollReveal className="lg:col-span-2">
          <SectionHeaderCompact title="Daily revenue" />
          <GlassPanel variant="card" className="mt-2 p-4 md:p-5">
            <RevenueSummary total="$1,240" delta="+12% wow" />
            <RevenueChart
              values={osRevenue.sparkline}
              label="daily revenue"
              height="h-32"
              className="mt-4"
            />
          </GlassPanel>
        </ScrollReveal>

        {/* Opportunities */}
        <ScrollReveal delay={0.05}>
          <SectionHeaderCompact title="Opportunities" meta={<StatusChip label="3 open" tone="info" size="inline" />} />
          <GlassPanel variant="card" className="mt-2 p-4">
            <StaggerReveal className="space-y-3">
              {osProjectsOpportunities.map((opp) => (
                <StaggerItem key={opp.id}>
                  <div className="rounded-lg border border-white/5 bg-surface-container/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(typography.bodySm, 'font-medium')}>{opp.name}</p>
                      <span className="shrink-0 font-mono text-body-sm text-primary">{opp.value}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusChip label={opp.stage} tone={stageTone[opp.stage] ?? 'info'} size="inline" />
                      <span className="font-mono text-[10px] text-outline">{opp.confidence}% • {opp.owner}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-container-highest">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${opp.confidence}%` }} />
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </GlassPanel>
        </ScrollReveal>
      </div>

      {/* Active projects table */}
      <ScrollReveal>
        <SectionHeaderCompact title="Active projects" meta={<StatusChip label={`${projects.length}`} tone="info" size="inline" />} />
        <GlassPanel variant="card" className="mt-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-white/8 text-left bg-surface-container-highest/30">
                  <th className="px-4 py-3 label-caps text-outline">Project</th>
                  <th className="px-3 py-3 label-caps text-outline">Status</th>
                  <th className="px-3 py-3 label-caps text-outline">Revenue</th>
                  <th className="px-4 py-3 label-caps text-outline">Next step</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.name} className="border-b border-white/5 last:border-0 hover:bg-surface-container/40">
                    <td className="px-4 py-3 font-medium">{project.name}</td>
                    <td className="px-3 py-3">
                      <StatusChip
                        label={project.status}
                        tone={project.status === 'Active' ? 'good' : 'info'}
                        showPip
                        size="inline"
                      />
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-primary">{project.revenue}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{project.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        {/* Events */}
        <ScrollReveal>
          <SectionHeaderCompact title="Upcoming events" />
          <GlassPanel variant="card" className="mt-2 p-4">
            <StaggerReveal className="space-y-2">
              {osProjectsEvents.map((event) => (
                <StaggerItem key={event.id}>
                  <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 px-3 py-3">
                    <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg border border-white/8 bg-surface-container-high/40">
                      <span className="font-mono text-[10px] text-outline">{event.date.split(' ')[0]}</span>
                      <span className="font-mono text-sm font-semibold text-primary">{event.date.split(' ')[1]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(typography.bodySm, 'font-medium')}>{event.title}</p>
                      <p className="text-[11px] text-outline">{event.attendees} attendee{event.attendees === 1 ? '' : 's'}</p>
                    </div>
                    <StatusChip label="" tone={event.tone} showPip size="inline" />
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </GlassPanel>
        </ScrollReveal>

        {/* Leads */}
        <ScrollReveal delay={0.05}>
          <SectionHeaderCompact title="Leads" />
          <GlassPanel variant="card" className="mt-2 p-4">
            <StaggerReveal className="space-y-2">
              {osProjectsLeads.map((lead) => (
                <StaggerItem key={lead.id}>
                  <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 px-3 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/8 bg-surface-container-high/40">
                      <GarrettIcon name="person" size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(typography.bodySm, 'font-medium')}>{lead.name}</p>
                      <p className="text-[11px] text-outline">{lead.source} • {lead.note}</p>
                    </div>
                    <span className="shrink-0 font-mono text-body-sm text-primary">{lead.value}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </GlassPanel>
        </ScrollReveal>
      </div>
    </div>
  );
}
