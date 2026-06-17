import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { gymSets } from '@/data/mock';

export default function GymPage() {
  return <div className="page-stack"><div><p className="eyebrow">Gym</p><h1>Progressive overload tracker</h1></div><section className="dashboard-grid"><Card title="Recent lifts" className="span-8"><table><tbody>{gymSets.map((set) => <tr key={set.exercise}><td>{set.exercise}</td><td>{set.sets}</td><td>{set.weight}</td><td className="good">{set.trend}</td><td>{set.location}</td></tr>)}</tbody></table></Card><Card title="Body + photos" className="span-4"><input placeholder="Body weight" /><textarea placeholder="Lean bulk / cut notes" /><div className="upload">Supabase Storage photo placeholder</div></Card><EmptyState integration="Gym" /></section></div>;
}
