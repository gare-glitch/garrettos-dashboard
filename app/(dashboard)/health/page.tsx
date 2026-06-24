import {
  GlassPanel,
  MetricCard,
  MiniChart,
  SectionHeader,
  SectionHeaderCompact,
  Sparkline,
} from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import { Input } from '@/components/ui/input';
import { garminDaily } from '@/data/mock';
import { osGarminSummary } from '@/data/os-mock';

export default function HealthPage() {
  const today = garminDaily.at(-1)!;

  return (
    <div className={spacing.page}>
      <SectionHeader
        eyebrow="Health"
        title="Garmin recovery intelligence"
        description="Mock summaries now; Phase 2 wires CSV import, server parsers, and Supabase realtime."
      />

      <div className="os-bento">
        <MetricCard
          label="Body Battery"
          value={today.bodyBattery}
          delta={`Sleep ${today.sleepScore}`}
          tone="good"
          sparkline={<Sparkline values={osGarminSummary.trend} label="body battery" />}
          className="col-span-1 md:col-span-3"
          compact
        />
        <MetricCard label="HRV" value={today.hrv} delta="ms" tone="info" className="col-span-1 md:col-span-3" compact />
        <MetricCard label="Stress" value={today.stress} tone="warn" className="col-span-1 md:col-span-3" compact />
        <MetricCard label="Steps" value={today.steps.toLocaleString()} className="col-span-1 md:col-span-3" compact />
      </div>

      <div className="os-bento">
        <GlassPanel className="col-span-2 p-4 md:col-span-4">
          <SectionHeaderCompact title="Manual Garmin upload" />
          <div className="mt-3 grid gap-2 rounded-xl border border-dashed border-border bg-input/30 p-4 text-center">
            <b className="text-sm">CSV / FIT / TCX</b>
            <span className="text-xs text-muted-foreground">Dropzone placeholder for Garmin exports</span>
            <Input type="file" accept=".csv,.fit,.tcx" className="cursor-pointer" />
          </div>
        </GlassPanel>
        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Sleep score" />
          <MiniChart label="sleep scores" values={garminDaily.map((d) => d.sleepScore)} className="mt-2" />
        </div>
        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="HRV trend" />
          <MiniChart label="hrv" values={garminDaily.map((d) => d.hrv)} className="mt-2" />
        </div>
      </div>

      <GlassPanel className="overflow-x-auto p-4">
        <SectionHeaderCompact title="Daily summaries" />
        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Date</th>
              <th className="pb-2 pr-3 font-medium">Steps</th>
              <th className="pb-2 pr-3 font-medium">Calories</th>
              <th className="pb-2 pr-3 font-medium">RHR</th>
              <th className="pb-2 pr-3 font-medium">Stress</th>
              <th className="pb-2 font-medium">Body Battery</th>
            </tr>
          </thead>
          <tbody>
            {garminDaily.map((day) => (
              <tr key={day.date} className="border-b border-border/50">
                <td className="py-2 pr-3">{day.date}</td>
                <td className="py-2 pr-3 tabular-nums">{day.steps}</td>
                <td className="py-2 pr-3 tabular-nums">{day.calories}</td>
                <td className="py-2 pr-3 tabular-nums">{day.restingHr}</td>
                <td className="py-2 pr-3 tabular-nums">{day.stress}</td>
                <td className="py-2 tabular-nums">{day.bodyBattery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}
