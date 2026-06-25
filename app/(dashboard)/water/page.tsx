'use client';

import { useState } from 'react';
import {
  AnimatedCounter,
  GlassPanel,
  MetricCard,
  ScrollReveal,
  SectionHeader,
  SectionHeaderCompact,
  StaggerItem,
  StaggerReveal,
  StatusChip,
} from '@/components/garrettos';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { supplements } from '@/data/mock';
import { osWaterSummary } from '@/data/os-mock';

export default function WaterPage() {
  const [intake, setIntake] = useState(osWaterSummary.intake);
  const goal = osWaterSummary.goal;
  const pct = Math.round((intake / goal) * 100);

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow="Water / Supplements"
        title="Hydration and dose schedule"
        description="Adaptive targets from weight, activity, and caffeine. Mock data now."
        action={<StatusChip label={`${pct}% to goal`} tone={pct >= 100 ? 'good' : 'warn'} showPip />}
      />

      <StaggerReveal className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <StaggerItem>
          <MetricCard
            variant="progress"
            label="Hydration"
            value={
              <span>
                <AnimatedCounter value={intake} />
                <span className="text-sm text-outline">/{goal} {osWaterSummary.unit}</span>
              </span>
            }
            delta={pct >= 100 ? 'Goal hit' : 'On track'}
            tone={pct >= 100 ? 'good' : 'warn'}
            progress={pct}
            footer="Adaptive target from weight, activity, caffeine"
          >
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                placeholder="Log oz"
                aria-label="Log ounces"
                className="w-full rounded-lg border border-white/10 bg-surface-container-lowest/80 px-3 py-2 text-body-sm text-on-surface placeholder:text-outline/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setIntake((v) => Math.min(goal, v + 8))}
                className="rounded-lg bg-primary px-3 py-2 text-body-sm font-semibold text-on-primary transition-transform hover:scale-105 active:scale-95"
              >
                +8 oz
              </button>
            </div>
          </MetricCard>
        </StaggerItem>

        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Supplements due"
            value={<AnimatedCounter value={osWaterSummary.supplementsDue} />}
            delta="Today"
            tone="warn"
            footer="Creatine running low"
          />
        </StaggerItem>

        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Streak"
            value={<AnimatedCounter value={12} suffix=" days" />}
            delta="Hydration goal met"
            tone="good"
          />
        </StaggerItem>
      </StaggerReveal>

      <ScrollReveal>
        <SectionHeaderCompact title="Supplement inventory" meta={<StatusChip label={`${supplements.length} active`} tone="info" size="inline" />} />
        <GlassPanel variant="card" className="mt-2 p-4">
          <StaggerReveal className="space-y-0">
            {supplements.map((item, i) => {
              const low = item.status === 'low';
              return (
                <StaggerItem key={item.name}>
                  <div
                    className={cn(
                      'flex items-center justify-between gap-3 py-3',
                      i > 0 && 'border-t border-white/5',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex size-10 items-center justify-center rounded-xl border',
                          low
                            ? 'border-error/20 bg-error/10'
                            : 'border-secondary/20 bg-secondary/10',
                        )}
                      >
                        <GarrettIcon
                          name={low ? 'warning' : 'check'}
                          size={20}
                          className={low ? 'text-error' : 'text-secondary'}
                        />
                      </div>
                      <div>
                        <p className={cn(typography.bodyLg, 'font-medium')}>{item.name}</p>
                        <p className="text-[11px] text-outline">{item.slot}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-on-surface-variant">{item.inventory} left</span>
                      <StatusChip
                        label={item.status}
                        tone={low ? 'warn' : item.status === 'taken' ? 'good' : 'idle'}
                        showPip
                        size="inline"
                      />
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerReveal>
        </GlassPanel>
      </ScrollReveal>
    </div>
  );
}
