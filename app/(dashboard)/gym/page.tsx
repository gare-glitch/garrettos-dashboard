import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { DashboardGrid } from '@/components/layout-grid';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { gymSets } from '@/data/mock';

export default function GymPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Gym" title="Progressive overload tracker" />
      <DashboardGrid>
        <Card title="Recent lifts" className="md:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {gymSets.map((set) => (
                  <tr key={set.exercise} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-medium">{set.exercise}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{set.sets}</td>
                    <td className="py-3 pr-4">{set.weight}</td>
                    <td className="py-3 pr-4 font-semibold text-green">{set.trend}</td>
                    <td className="py-3 text-muted-foreground">{set.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Body + photos" className="md:col-span-4">
          <Input placeholder="Body weight" />
          <Textarea className="mt-3" placeholder="Lean bulk / cut notes" />
          <div className="mt-3 grid gap-2 rounded-2xl border border-dashed border-border bg-input/50 p-4 text-center text-sm text-muted-foreground">
            Supabase Storage photo placeholder
          </div>
        </Card>
      </DashboardGrid>
    </div>
  );
}
