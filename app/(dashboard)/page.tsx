import Link from 'next/link';
import { Card } from '@/components/Card';
import { LauncherCard } from '@/components/LauncherCard';
import { MiniChart } from '@/components/MiniChart';
import { BentoGrid, DashboardGrid } from '@/components/layout-grid';
import { DataRow } from '@/components/DataRow';
import { Badge } from '@/components/ui/badge';
import { agentRuns, garminDaily, launcher, projects } from '@/data/mock';

export default function HomePage() {
  const today = garminDaily.at(-1)!;

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="glass-panel glow-ring overflow-hidden rounded-3xl p-6 md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">Phase 1 • mock integrations live</p>
        <h1 className="mt-2 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl md:leading-[0.95]">
          Your private <span className="text-gradient">AI operating system</span>.
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
          GarrettOS is a Supabase-ready, auth-gated command center for health, gym, water, AI agents, memory, systems,
          projects, and revenue.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Command launcher</h2>
          <Badge variant="secondary">9 modules</Badge>
        </div>
        <BentoGrid>
          {launcher.map((item) => (
            <LauncherCard
              key={item.href}
              href={item.href}
              title={item.title}
              metric={item.metric}
              note={item.note}
              className="col-span-1 md:col-span-1"
            />
          ))}
        </BentoGrid>
      </section>

      <DashboardGrid>
        <Card title="Today Score" eyebrow="Garmin mock" className="md:col-span-4">
          <div className="text-5xl font-black tracking-tight">{today.bodyBattery}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Sleep {today.sleepScore} • HRV {today.hrv} • Stress {today.stress}
          </p>
          <MiniChart label="weekly body battery" values={garminDaily.map((d) => d.bodyBattery)} className="mt-4" />
        </Card>

        <Card title="OpenClaw Runs" eyebrow="Approvals protected" className="md:col-span-4">
          {agentRuns.map((run) => (
            <DataRow key={run.title} label={run.title} value={run.status} hint={run.approval} />
          ))}
        </Card>

        <Card title="Projects / Revenue" eyebrow="MTD" className="md:col-span-4">
          {projects.map((project) => (
            <DataRow key={project.name} label={project.name} value={project.revenue} hint={`${project.status} • ${project.next}`} />
          ))}
        </Card>
      </DashboardGrid>

      <div className="text-center text-xs text-muted-foreground">
        <Link href="/settings" className="underline-offset-4 hover:text-cyan hover:underline">
          View integration status center
        </Link>
      </div>
    </div>
  );
}
