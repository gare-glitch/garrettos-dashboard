import { Card } from '@/components/Card';
import { DataRow } from '@/components/DataRow';
import { MetricCard } from '@/components/MetricCard';
import { PageHeader } from '@/components/PageHeader';
import { DashboardGrid } from '@/components/layout-grid';
import { Input } from '@/components/ui/input';
import { supplements } from '@/data/mock';
import { cn } from '@/lib/utils';

export default function WaterPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Water / Supplements" title="Hydration and dose schedule" />
      <DashboardGrid>
        <MetricCard
          title="Adaptive water target"
          value="120 oz"
          description="Based on body weight, activity, caffeine, and stimulant load."
          className="md:col-span-4"
        >
          <Input placeholder="Log ounces" />
        </MetricCard>
        <Card title="Supplement inventory" className="md:col-span-8">
          {supplements.map((item) => (
            <DataRow
              key={item.name}
              label={`${item.slot}: ${item.name}`}
              value={`${item.inventory} left • ${item.status}`}
              valueClassName={cn(item.status === 'low' ? 'text-amber' : 'text-green')}
            />
          ))}
        </Card>
      </DashboardGrid>
    </div>
  );
}
