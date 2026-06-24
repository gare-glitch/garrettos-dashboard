import { Card } from '@/components/Card';
import { DataRow } from '@/components/DataRow';
import { PageHeader } from '@/components/PageHeader';
import { DashboardGrid } from '@/components/layout-grid';
import { vpsMetrics } from '@/data/mock';

export default function SystemPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="System Health" title="VPS, containers, models, and metrics" />
      <DashboardGrid>
        {vpsMetrics.map((host) => (
          <Card title={host.host} key={host.host} className="md:col-span-6">
            <DataRow label="CPU" value={`${host.cpu}%`} />
            <DataRow label="RAM" value={`${host.ram}%`} />
            <DataRow label="Disk" value={`${host.disk}%`} />
            <p className="mt-3 text-sm text-muted-foreground">{host.services}</p>
          </Card>
        ))}
      </DashboardGrid>
    </div>
  );
}
