'use client';

import { BreathingPip } from './BreathingPip';
import { CommandInput } from './CommandInput';
import { ScrollReveal } from './ScrollReveal';
import { StatusChip } from './StatusChip';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { osShellTelemetry, osWorkspaceStatus } from '@/data/os-mock';

export function HomeHero({ onCommandOpen }: { onCommandOpen?: () => void }) {
  const status = osWorkspaceStatus;

  return (
    <ScrollReveal className="space-y-4">
      <div className="space-y-2">
        <p className={typography.eyebrowPrimary}>Command Workspace</p>
        <h1 className={typography.headline}>GarrettOS Command Workspace</h1>
        <p className={cn(typography.body, 'max-w-2xl')}>{status.summary}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-2xl">
          <CommandInput
            placeholder="Command Palette (⌘K)"
            onClick={onCommandOpen}
            onFocus={onCommandOpen}
          />
        </div>
        <div className="flex items-center gap-2">
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
