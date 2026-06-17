import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MiniChart } from '@/components/MiniChart';
import { garminDaily } from '@/data/mock';

export default function HealthPage() {
  return <div className="page-stack"><div><p className="eyebrow">Health</p><h1>Garmin-first recovery dashboard</h1><p className="muted">Mock summaries now; Phase 2 wires CSV import, server parsers, and Supabase realtime.</p></div><section className="dashboard-grid"><Card title="Manual Garmin Upload" className="span-4"><div className="upload"><b>CSV / FIT / TCX</b><span>Dropzone placeholder for Garmin exports</span><input type="file" accept=".csv,.fit,.tcx" /></div></Card><Card title="Sleep Score" className="span-4"><MiniChart label="sleep scores" values={garminDaily.map((d) => d.sleepScore)} /></Card><Card title="HRV" className="span-4"><MiniChart label="hrv" values={garminDaily.map((d) => d.hrv)} /></Card><Card title="Daily summaries" className="span-12"><table><thead><tr><th>Date</th><th>Steps</th><th>Calories</th><th>RHR</th><th>Stress</th><th>Body Battery</th></tr></thead><tbody>{garminDaily.map((day) => <tr key={day.date}><td>{day.date}</td><td>{day.steps}</td><td>{day.calories}</td><td>{day.restingHr}</td><td>{day.stress}</td><td>{day.bodyBattery}</td></tr>)}</tbody></table></Card><EmptyState integration="Garmin" /></section></div>;
}
