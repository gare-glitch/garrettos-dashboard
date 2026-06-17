import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { supplements } from '@/data/mock';

export default function WaterPage() {
  return <div className="page-stack"><div><p className="eyebrow">Water / Supplements</p><h1>Hydration and dose schedule</h1></div><section className="dashboard-grid"><Card title="Adaptive water target" className="span-4"><div className="metric">120 oz</div><p className="muted">Based on body weight, activity, caffeine, and stimulant load.</p><input placeholder="Log ounces" /></Card><Card title="Supplement inventory" className="span-8">{supplements.map((item) => <div className="row" key={item.name}><span>{item.slot}: {item.name}</span><b className={item.status === 'low' ? 'warn' : 'good'}>{item.inventory} left • {item.status}</b></div>)}</Card><EmptyState integration="Water and supplements" /></section></div>;
}
