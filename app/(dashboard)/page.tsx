import Link from 'next/link';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MiniChart } from '@/components/MiniChart';
import { agentRuns, garminDaily, launcher, onboardingChecklist, projects } from '@/data/mock';

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
      <Card title="Today Score" eyebrow="Garmin mock" className="span-4"><div className="metric">{today.bodyBattery}</div><p className="muted">Sleep {today.sleepScore} • HRV {today.hrv} • Stress {today.stress}</p><MiniChart label="weekly body battery" values={garminDaily.map((d) => d.bodyBattery)} /><EmptyState integration="Garmin" /></Card>
      <Card title="OpenClaw Runs" eyebrow="Approvals protected" className="span-4">{agentRuns.map((run) => <div className="row" key={run.title}><span>{run.title}</span><b>{run.status}</b></div>)}<EmptyState integration="OpenClaw" /></Card>
      <Card title="Projects / Revenue" eyebrow="MTD" className="span-4">{projects.map((project) => <div className="row" key={project.name}><span>{project.name}</span><b>{project.revenue}</b></div>)}<EmptyState integration="Revenue" /></Card>
      <Card title="Onboarding Checklist" eyebrow="Phase 2.1" className="span-12"><ul className="checklist">{onboardingChecklist.map((item) => <li key={item}><span className="check-dot">•</span><span>{item}</span></li>)}</ul></Card>
    </section>
  </div>;
}
