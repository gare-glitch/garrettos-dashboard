import { GlassPanel, MetricCard, SectionHeader, SectionHeaderCompact } from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { gymSets } from '@/data/mock';

export default function GymPage() {
  return (
    <div className={spacing.page}>
      <SectionHeader eyebrow="Gym" title="Progressive overload tracker" description="Lift logs, body metrics, and progress photos." />

      <div className="os-bento">
        <MetricCard label="Bench trend" value="+5 lb" delta="This week" tone="good" className="col-span-1 md:col-span-4" compact />
        <MetricCard label="Squat trend" value="+10 lb" delta="This week" tone="good" className="col-span-1 md:col-span-4" compact />
        <MetricCard label="Sessions" value="3" footer="Garage + Iron Temple" className="col-span-1 md:col-span-4" compact />
      </div>

      <div className="os-bento">
        <GlassPanel className="col-span-2 overflow-x-auto p-4 md:col-span-8">
          <SectionHeaderCompact title="Recent lifts" />
          <table className="mt-3 w-full text-xs">
            <tbody>
              {gymSets.map((set) => (
                <tr key={set.exercise} className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">{set.exercise}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{set.sets}</td>
                  <td className="py-2 pr-3 tabular-nums">{set.weight}</td>
                  <td className="py-2 pr-3 font-semibold text-green">{set.trend}</td>
                  <td className="py-2 text-muted-foreground">{set.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
        <GlassPanel className="col-span-2 p-4 md:col-span-4">
          <SectionHeaderCompact title="Body + photos" />
          <Input className="mt-3" placeholder="Body weight" />
          <Textarea className="mt-2" placeholder="Lean bulk / cut notes" />
          <div className="mt-3 rounded-xl border border-dashed border-border bg-input/30 p-4 text-center text-xs text-muted-foreground">
            Supabase Storage photo placeholder
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
