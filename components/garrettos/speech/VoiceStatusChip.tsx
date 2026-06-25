'use client';

import { cn } from '@/lib/utils';
import type { VoiceState } from '@/lib/garrettos/speech/types';

const STATE_META: Record<VoiceState, { label: string; tone: 'good' | 'warn' | 'bad' | 'idle' | 'info' }> = {
  idle: { label: 'Voice ready', tone: 'idle' },
  listening: { label: 'Listening', tone: 'info' },
  thinking: { label: 'Thinking', tone: 'warn' },
  speaking: { label: 'Speaking', tone: 'good' },
  unsupported: { label: 'Voice unsupported', tone: 'idle' },
  error: { label: 'Voice error', tone: 'bad' },
};

const TONE_CLASS: Record<string, string> = {
  good: 'border-secondary/30 bg-secondary/10 text-secondary',
  warn: 'border-primary/30 bg-primary/10 text-primary',
  bad: 'border-error/30 bg-error/10 text-error',
  info: 'border-tertiary/30 bg-tertiary/10 text-tertiary',
  idle: 'border-white/10 bg-white/5 text-on-surface-variant',
};

/**
 * VoiceStatusChip — compact pill showing the current voice state. Used inline
 * in the top app bar and command palette. Non-intrusive.
 */
export function VoiceStatusChip({
  state,
  className,
  showPip = true,
}: {
  state: VoiceState;
  className?: string;
  showPip?: boolean;
}) {
  const meta = STATE_META[state] ?? STATE_META.idle;
  const pulse = state === 'listening' || state === 'thinking' || state === 'speaking';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 label-caps text-[10px]',
        TONE_CLASS[meta.tone],
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {showPip ? (
        <span
          className={cn(
            'size-1.5 rounded-full',
            meta.tone === 'good' ? 'bg-secondary' : meta.tone === 'bad' ? 'bg-error' : meta.tone === 'warn' ? 'bg-primary' : meta.tone === 'info' ? 'bg-tertiary' : 'bg-outline',
            pulse && 'breathing-pip',
          )}
        />
      ) : null}
      {meta.label}
    </span>
  );
}
