import Link from 'next/link';
import { Card } from '@/components/Card';
import { MiniChart } from '@/components/MiniChart';
import { agentRuns, garminDaily, launcher, projects } from '@/data/mock';

export default function HomePage() {
  const today = garminDaily.at(-1)!;
  return <div className="page-stack">
    <section className="hero-panel">
      <p className="eyebrow">Phase 1 • mock integrations live</p>
      <h1>Your private life operating system.</h1>
      <p>GarrettOS is a Supabase-ready, auth-gated command center for health, gym, water, AI agents, memory, systems, projects, and revenue.</p>
    </section>
    <section className="bento-grid">{launcher.map((item) => <Link className="launcher-card" href={item.href} key={item.href}><span>{item.title}</span><strong>{item.metric}</strong><small>{item.note}</small></Link>)}</section>
    <section className="dashboard-grid">
      <Card title="Today Score" eyebrow="Garmin mock" className="span-4"><div className="metric">{today.bodyBattery}</div><p className="muted">Sleep {today.sleepScore} • HRV {today.hrv} • Stress {today.stress}</p><MiniChart label="weekly body battery" values={garminDaily.map((d) => d.bodyBattery)} /></Card>
      <Card title="OpenClaw Runs" eyebrow="Approvals protected" className="span-4">{agentRuns.map((run) => <div className="row" key={run.title}><span>{run.title}</span><b>{run.status}</b></div>)}</Card>
      <Card title="Projects / Revenue" eyebrow="MTD" className="span-4">{projects.map((project) => <div className="row" key={project.name}><span>{project.name}</span><b>{project.revenue}</b></div>)}</Card>
    </section>
  </div>;
}
