import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { vpsMetrics } from '@/data/mock';

export default function SystemPage() {
  return <div className="page-stack"><div><p className="eyebrow">System Health</p><h1>VPS, containers, models, and metrics</h1></div><section className="dashboard-grid">{vpsMetrics.map((host) => <Card title={host.host} key={host.host} className="span-6"><div className="row"><span>CPU</span><b>{host.cpu}%</b></div><div className="row"><span>RAM</span><b>{host.ram}%</b></div><div className="row"><span>Disk</span><b>{host.disk}%</b></div><p className="muted">{host.services}</p></Card>)}<EmptyState integration="VPS metrics" /></section></div>;
}
