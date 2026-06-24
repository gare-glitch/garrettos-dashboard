import { AnimatedCounter, GlassPanel, MetricCard, SectionHeader, SectionHeaderCompact, Sparkline } from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import { projects } from '@/data/mock';
import { osRevenue } from '@/data/os-mock';

export default function ProjectsPage() {
  return (
    <div className={spacing.page}>
      <SectionHeader eyebrow="Projects / Revenue" title="Project execution and revenue signals" />

      <div className="os-bento">
        <MetricCard
          label="Revenue MTD"
          value={<AnimatedCounter value={osRevenue.mtd} />}
          delta={osRevenue.delta}
          tone="good"
          sparkline={<Sparkline values={osRevenue.sparkline} label="revenue" color="stroke-green" />}
          className="col-span-2 md:col-span-4"
        />
        <MetricCard label="Active projects" value={projects.length} className="col-span-1 md:col-span-4" compact />
        <MetricCard label="Pipeline" value="$12.4k" footer="Mock before Stripe integration" className="col-span-1 md:col-span-4" compact />
      </div>

      <GlassPanel className="p-4">
        <SectionHeaderCompact title="Active projects" />
        <ul className="mt-2 space-y-0">
          {projects.map((project, i) => (
            <li key={project.name} className={`flex items-start justify-between gap-3 py-2.5 ${i > 0 ? 'border-t border-border/60' : ''}`}>
              <div className="min-w-0">
                <p className="text-xs font-medium">{project.name}</p>
                <p className="text-[10px] text-muted-foreground">{project.status} • Next: {project.next}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{project.revenue}</span>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  );
}
