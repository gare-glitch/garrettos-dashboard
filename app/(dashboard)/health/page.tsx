'use client';

import { useState } from 'react';
import {
  AnimatedCounter,
  GlassPanel,
  MetricCard,
  MiniChart,
  ScrollReveal,
  SectionHeader,
  SectionHeaderCompact,
  Sparkline,
  StaggerItem,
  StaggerReveal,
  StatusChip,
} from '@/components/garrettos';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { garminDaily } from '@/data/mock';
import { osGarminSummary } from '@/data/os-mock';

export default function HealthPage() {
  const [intake, setIntake] = useState(0);
  const today = garminDaily.at(-1)!;
  const avgSleep = Math.round(garminDaily.reduce((s, d) => s + d.sleepScore, 0) / garminDaily.length);
  const avgHrv = Math.round(garminDaily.reduce((s, d) => s + d.hrv, 0) / garminDaily.length);

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow="Health"
        title="Garmin recovery intelligence"
        description="Mock summaries now; Phase 2 wires CSV import, server parsers, and Supabase realtime."
        action={<StatusChip label="Garmin synced" tone="good" showPip />}
      />

      {/* Hero vitals row */}
      <StaggerReveal className="grid grid-cols-2 gap-gutter md:grid-cols-4">
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Body Battery"
            value={<AnimatedCounter value={today.bodyBattery} suffix="/100" />}
            delta={`Sleep ${today.sleepScore}`}
            tone="good"
            progress={today.bodyBattery}
            sparkline={<Sparkline values={osGarminSummary.trend} label="body battery trend" color="primary" />}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="HRV"
            value={<AnimatedCounter value={today.hrv} suffix=" ms" />}
            delta="High"
            tone="info"
            sparkline={<Sparkline values={garminDaily.map((d) => d.hrv)} label="hrv trend" color="tertiary" />}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Stress"
            value={<AnimatedCounter value={today.stress} />}
            delta={today.stress < 25 ? 'Low' : 'Moderate'}
            tone={today.stress < 25 ? 'good' : 'warn'}
            progress={today.stress * 2}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="hero"
            label="Resting HR"
            value={<AnimatedCounter value={today.restingHr} suffix=" bpm" />}
            delta="Optimal"
            tone="good"
          />
        </StaggerItem>
      </StaggerReveal>

      {/* Secondary grid */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <ScrollReveal className="lg:col-span-2">
          <SectionHeaderCompact title="Weekly trends" />
          <GlassPanel variant="card" className="mt-2 grid grid-cols-1 gap-gutter p-4 md:grid-cols-2">
            <div>
              <p className={typography.labelCaps}>Sleep score</p>
              <MiniChart
                label="sleep scores"
                values={garminDaily.map((d) => d.sleepScore)}
                tone="primary"
                className="mt-2"
              />
              <p className={cn(typography.mono, 'mt-2')}>avg {avgSleep}/100</p>
            </div>
            <div>
              <p className={typography.labelCaps}>HRV trend</p>
              <MiniChart
                label="hrv"
                values={garminDaily.map((d) => d.hrv)}
                tone="tertiary"
                className="mt-2"
              />
              <p className={cn(typography.mono, 'mt-2')}>avg {avgHrv} ms</p>
            </div>
          </GlassPanel>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <SectionHeaderCompact title="Manual upload" />
          <GlassPanel variant="card" className="mt-2 p-4">
            <div className="grid gap-3 rounded-xl border border-dashed border-white/10 bg-surface-container-low/40 p-4 text-center">
              <GarrettIcon name="cloud" size={28} className="mx-auto text-primary" />
              <b className={typography.bodyLg}>CSV / FIT / TCX</b>
              <span className={typography.body}>Dropzone placeholder for Garmin exports</span>
              <input
                type="file"
                accept=".csv,.fit,.tcx"
                className="cursor-pointer text-[11px] text-outline file:mr-2 file:rounded file:border-0 file:bg-primary/15 file:px-3 file:py-1 file:text-primary"
                aria-label="Upload Garmin export"
              />
            </div>
          </GlassPanel>
        </ScrollReveal>
      </div>

      {/* Daily summaries table */}
      <ScrollReveal>
        <SectionHeaderCompact title="Daily summaries" meta={<StatusChip label="7 days" tone="info" size="inline" />} />
        <GlassPanel variant="card" className="mt-2 overflow-x-auto p-4">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th className="pb-2 pr-3 label-caps text-outline">Date</th>
                <th className="pb-2 pr-3 label-caps text-outline">Steps</th>
                <th className="pb-2 pr-3 label-caps text-outline">Calories</th>
                <th className="pb-2 pr-3 label-caps text-outline">RHR</th>
                <th className="pb-2 pr-3 label-caps text-outline">Stress</th>
                <th className="pb-2 label-caps text-outline">Battery</th>
              </tr>
            </thead>
            <tbody>
              {garminDaily.map((day) => (
                <tr key={day.date} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-3 font-medium">{day.date}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{day.steps.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{day.calories}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{day.restingHr}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{day.stress}</td>
                  <td className="py-2.5 tabular-nums text-primary">{day.bodyBattery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      </ScrollReveal>
    </div>
  );
}
