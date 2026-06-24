import { Card } from '@/components/Card';
import { DataRow } from '@/components/DataRow';
import { MiniChart } from '@/components/MiniChart';
import { PageHeader } from '@/components/PageHeader';
import { DashboardGrid } from '@/components/layout-grid';
import { Input } from '@/components/ui/input';
import { garminDaily } from '@/data/mock';

export default function HealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Health"
        title="Garmin-first recovery dashboard"
        description="Mock summaries now; Phase 2 wires CSV import, server parsers, and Supabase realtime."
      />
      <DashboardGrid>
        <Card title="Manual Garmin Upload" className="md:col-span-4">
          <div className="grid gap-3 rounded-2xl border border-dashed border-border bg-input/50 p-5 text-center">
            <b>CSV / FIT / TCX</b>
            <span className="text-sm text-muted-foreground">Dropzone placeholder for Garmin exports</span>
            <Input type="file" accept=".csv,.fit,.tcx" className="cursor-pointer" />
          </div>
        </Card>
        <Card title="Sleep Score" className="md:col-span-4">
          <MiniChart label="sleep scores" values={garminDaily.map((d) => d.sleepScore)} />
        </Card>
        <Card title="HRV" className="md:col-span-4">
          <MiniChart label="hrv" values={garminDaily.map((d) => d.hrv)} />
        </Card>
        <Card title="Daily summaries" className="md:col-span-12">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Steps</th>
                  <th className="pb-3 pr-4 font-medium">Calories</th>
                  <th className="pb-3 pr-4 font-medium">RHR</th>
                  <th className="pb-3 pr-4 font-medium">Stress</th>
                  <th className="pb-3 font-medium">Body Battery</th>
                </tr>
              </thead>
              <tbody>
                {garminDaily.map((day) => (
                  <tr key={day.date} className="border-b border-border/70">
                    <td className="py-3 pr-4">{day.date}</td>
                    <td className="py-3 pr-4">{day.steps}</td>
                    <td className="py-3 pr-4">{day.calories}</td>
                    <td className="py-3 pr-4">{day.restingHr}</td>
                    <td className="py-3 pr-4">{day.stress}</td>
                    <td className="py-3">{day.bodyBattery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </DashboardGrid>
    </div>
  );
}
