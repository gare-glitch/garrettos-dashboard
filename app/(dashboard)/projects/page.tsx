import { Card } from '@/components/Card';
import { getProjectData } from '@/lib/dashboard-data';

export default async function ProjectsPage() {
  const projects = await getProjectData();
  return <div className="page-stack"><div><p className="eyebrow">Projects / Revenue</p><h1>Project execution and revenue signals</h1></div><section className="dashboard-grid"><Card title="Active projects" className="span-8">{projects.map((project) => <div className="row" key={project.name}><span>{project.name}<small>{project.status} • Next: {project.next}</small></span><b>{project.revenue}</b></div>)}</Card><Card title="Revenue events" className="span-4"><div className="metric">$12.4k</div><p className="muted">Mock month-to-date revenue before Stripe/accounting integrations.</p></Card></section></div>;
}
