import { GlassPanel, MetricCard, SectionHeader, SectionHeaderCompact, SystemTopology } from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import { vpsMetrics } from '@/data/mock';
import { osTopology } from '@/data/os-mock';

export default function SystemPage() {
  return (
    <div className={spacing.page}>
      <SectionHeader eyebrow="System Health" title="VPS, containers, models, and metrics" />

      <div className="os-bento">
        {vpsMetrics.map((host) => (
          <MetricCard
            key={host.host}
            label={host.host}
            value={`${host.cpu}%`}
            delta={`RAM ${host.ram}%`}
            tone={host.cpu > 50 ? 'warn' : 'good'}
            footer={host.services}
            className="col-span-1 md:col-span-6"
            compact
          />
        ))}
      </div>

      <div className="os-bento">
        <div className="col-span-2 md:col-span-12">
          <SectionHeaderCompact title="Service topology" />
          <SystemTopology nodes={osTopology} className="mt-2" />
        </div>
      </div>

      <div className="os-bento">
        {vpsMetrics.map((host) => (
          <GlassPanel key={`detail-${host.host}`} className="col-span-1 p-4 md:col-span-6">
            <SectionHeaderCompact title={host.host} />
            <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div><dt className="text-muted-foreground">CPU</dt><dd className="font-bold tabular-nums">{host.cpu}%</dd></div>
              <div><dt className="text-muted-foreground">RAM</dt><dd className="font-bold tabular-nums">{host.ram}%</dd></div>
              <div><dt className="text-muted-foreground">Disk</dt><dd className="font-bold tabular-nums">{host.disk}%</dd></div>
            </dl>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
