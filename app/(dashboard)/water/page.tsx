import { GlassPanel, MetricCard, SectionHeader, SectionHeaderCompact, StatusChip } from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import { Input } from '@/components/ui/input';
import { supplements } from '@/data/mock';
import { cn } from '@/lib/utils';

export default function WaterPage() {
  return (
    <div className={spacing.page}>
      <SectionHeader eyebrow="Water / Supplements" title="Hydration and dose schedule" />

      <div className="os-bento">
        <MetricCard
          label="Water target"
          value="120 oz"
          delta="52% complete"
          tone="warn"
          footer="Adaptive target from weight, activity, caffeine"
          className="col-span-2 md:col-span-4"
        >
          <Input className="mt-2" placeholder="Log ounces" />
        </MetricCard>
        <GlassPanel className="col-span-2 p-4 md:col-span-8">
          <SectionHeaderCompact title="Supplement inventory" />
          <ul className="mt-2 space-y-0">
            {supplements.map((item, i) => (
              <li key={item.name} className={cn('flex items-center justify-between gap-3 py-2.5', i > 0 && 'border-t border-border/60')}>
                <div>
                  <p className="text-xs font-medium">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.slot}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground">{item.inventory} left</span>
                  <StatusChip label={item.status} tone={item.status === 'low' ? 'warn' : 'good'} />
                </div>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>
    </div>
  );
}
