'use client';

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
import { gymSets } from '@/data/mock';

export const gymMetrics = {
  benchTrend: 5,
  squatTrend: 10,
  sessions: 3,
  nextWorkout: 'Push A — Bench / OHP / Incline',
  nextDate: 'Tomorrow 06:30',
  volume: 18400,
};

export const gymProgression = [
  { week: 'W1', bench: 195, squat: 265 },
  { week: 'W2', bench: 200, squat: 270 },
  { week: 'W3', bench: 205, squat: 275 },
  { week: 'W4', bench: 205, squat: 275 },
];

export default function GymPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow="Gym"
        title="Progressive overload tracker"
        description="Lift logs, body metrics, and progress photos. Mock data now; Phase 2 wires Strava/Garmin strength."
      />

      <StaggerReveal className="grid grid-cols-2 gap-gutter md:grid-cols-4">
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Bench trend"
            value={<span className="text-secondary">+{gymMetrics.benchTrend} lb</span>}
            delta="This week"
            tone="good"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Squat trend"
            value={<span className="text-secondary">+{gymMetrics.squatTrend} lb</span>}
            delta="This week"
            tone="good"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Sessions"
            value={<AnimatedCounter value={gymMetrics.sessions} />}
            delta="Garage + Iron Temple"
            tone="info"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Volume (lb)"
            value={<AnimatedCounter value={gymMetrics.volume} />}
            delta="Weekly total"
            tone="good"
          />
        </StaggerItem>
      </StaggerReveal>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <ScrollReveal className="lg:col-span-2">
          <SectionHeaderCompact title="Recent lifts" />
          <GlassPanel variant="card" className="mt-2 overflow-x-auto p-4">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  <th className="pb-2 pr-3 label-caps text-outline">Exercise</th>
                  <th className="pb-2 pr-3 label-caps text-outline">Sets</th>
                  <th className="pb-2 pr-3 label-caps text-outline">Weight</th>
                  <th className="pb-2 pr-3 label-caps text-outline">Trend</th>
                  <th className="pb-2 label-caps text-outline">Location</th>
                </tr>
              </thead>
              <tbody>
                {gymSets.map((set) => (
                  <tr key={set.exercise} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 font-medium">{set.exercise}</td>
                    <td className="py-2.5 pr-3 text-on-surface-variant">{set.sets}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{set.weight}</td>
                    <td className="py-2.5 pr-3 font-semibold text-secondary">{set.trend}</td>
                    <td className="py-2.5 text-on-surface-variant">{set.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassPanel>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <SectionHeaderCompact title="Next workout" />
          <GlassPanel variant="card" className="mt-2 space-y-3 p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <GarrettIcon name="bolt" size={20} className="text-primary" />
              </div>
              <div>
                <p className={cn(typography.bodyLg, 'font-semibold')}>{gymMetrics.nextWorkout}</p>
                <p className="text-[11px] text-outline">{gymMetrics.nextDate}</p>
              </div>
            </div>
            <div className="rounded-lg border border-white/5 bg-surface-container/30 p-3">
              <p className={typography.labelCaps}>Progression (4 weeks)</p>
              <div className="mt-2 flex items-end gap-2 h-20">
                {gymProgression.map((p, i) => {
                  const max = 275;
                  const h = Math.max(20, (p.bench / max) * 100);
                  return (
                    <div key={p.week} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm bg-primary/60"
                        style={{ height: `${h}%` }}
                        title={`${p.week}: ${p.bench} lb bench`}
                      />
                      <span className="text-[9px] text-outline">{p.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <SectionHeaderCompact title="Body + photos" />
        <GlassPanel variant="card" className="mt-2 grid gap-gutter p-4 md:grid-cols-2 md:p-5">
          <div className="space-y-3">
            <label className={typography.labelCaps} htmlFor="body-weight">Body weight</label>
            <input
              id="body-weight"
              placeholder="182 lb"
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest/80 px-4 py-2.5 text-body-sm text-on-surface placeholder:text-outline/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <label className={typography.labelCaps} htmlFor="bulk-notes">Lean bulk / cut notes</label>
            <textarea
              id="bulk-notes"
              rows={4}
              placeholder="Lean bulk at +200 kcal surplus…"
              className="w-full resize-none rounded-xl border border-white/10 bg-surface-container-lowest/80 px-4 py-2.5 text-body-sm text-on-surface placeholder:text-outline/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="grid place-items-center rounded-xl border border-dashed border-white/10 bg-surface-container-low/40 p-6 text-center">
            <GarrettIcon name="photo_camera" size={32} className="text-outline" />
            <p className={cn(typography.body, 'mt-2')}>Supabase Storage photo placeholder</p>
          </div>
        </GlassPanel>
      </ScrollReveal>
    </div>
  );
}
