'use client';

import { BreathingPip } from './BreathingPip';
import { CommandInput } from './CommandInput';
import { ScrollReveal } from './ScrollReveal';
import { StatusChip } from './StatusChip';
import { AmbientStrandsBackground, PointerGlow } from './effects';
import { VoiceStatusChip, useVoice } from './speech';
import { GarrettIcon } from './GarrettIcon';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { osShellTelemetry, osWorkspaceStatus } from '@/data/os-mock';

export function HomeHero({ onCommandOpen }: { onCommandOpen?: () => void }) {
  const status = osWorkspaceStatus;
  const { state, supported, start, stop } = useVoice();
  const voiceActive = state === 'listening' || state === 'thinking';

  return (
    <ScrollReveal className="space-y-4">
      {/* Ambient strand layer — sits behind the hero only, low opacity */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[280px] overflow-hidden opacity-60">
        <AmbientStrandsBackground className="opacity-70" />
      </div>

      <div className="space-y-2">
        <p className={typography.eyebrowPrimary}>Command Workspace</p>
        <h1 className={typography.headline}>GarrettOS Command Workspace</h1>
        <p className={cn(typography.body, 'max-w-2xl')}>{status.summary}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-2xl">
          <PointerGlow radius={200}>
            <CommandInput
              placeholder="Command Palette (⌘K)"
              onClick={onCommandOpen}
              onFocus={onCommandOpen}
            />
          </PointerGlow>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={voiceActive ? stop : start}
            disabled={!supported}
            className={cn(
              'group flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors outline-none',
              'focus-visible:ring-2 focus-visible:ring-primary/50',
              voiceActive
                ? 'border-tertiary/40 bg-tertiary/15 text-tertiary'
                : 'border-white/8 bg-white/5 text-on-surface-variant hover:border-primary/30 hover:text-primary',
              !supported && 'cursor-not-allowed opacity-60',
            )}
            aria-label="Talk to GarrettOS"
          >
            <GarrettIcon name={voiceActive ? 'mic' : 'mic_none'} size={16} fill={voiceActive} />
            <span className={cn(typography.labelCaps, 'normal-case tracking-normal text-[11px]')}>Talk to GarrettOS</span>
            {voiceActive ? <VoiceStatusChip state={state} showPip={false} className="ml-1" /> : null}
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5">
            <BreathingPip tone="secondary" />
            <span className={cn(typography.labelCaps, 'text-secondary')}>{status.mode}</span>
          </div>
          <StatusChip label={osShellTelemetry.activeModel} tone="info" showPip />
        </div>
      </div>
    </ScrollReveal>
  );
}
