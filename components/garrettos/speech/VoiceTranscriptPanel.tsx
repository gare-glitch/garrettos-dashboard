'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from '../GarrettIcon';
import { SpeechOrb } from './SpeechOrb';
import { VoiceStatusChip } from './VoiceStatusChip';
import type { VoiceMatchResult, VoiceState } from '@/lib/garrettos/speech/types';

/**
 * VoiceTranscriptPanel — shows the live transcript, the matched command (if
 * any), and the current status chip. Used inside the command palette voice
 * section and the voice overlay. Collapses to nothing when idle and empty.
 */
export function VoiceTranscriptPanel({
  state,
  transcript,
  lastCommand,
  supported,
  className,
}: {
  state: VoiceState;
  transcript: string;
  lastCommand: VoiceMatchResult | null;
  supported: boolean;
  className?: string;
}) {
  const show = state !== 'idle' || transcript || lastCommand;
  if (!show) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-white/8 bg-surface-container-low/40 px-3 py-2.5',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <SpeechOrb state={state} size={32} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <VoiceStatusChip state={state} showPip={false} />
          {!supported ? (
            <span className="font-mono text-[9px] text-outline">Web Speech API not available</span>
          ) : null}
        </div>
        {transcript ? (
          <p className={cn(typography.body, 'mt-1.5 truncate text-[13px] text-on-surface')}>
            &ldquo;{transcript}&rdquo;
          </p>
        ) : state === 'listening' ? (
          <p className={cn(typography.body, 'mt-1.5 text-[12px] text-on-surface-variant')}>
            Listening — say a command like &ldquo;open memory&rdquo;…
          </p>
        ) : null}
        {lastCommand ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
            <GarrettIcon name="bolt" size={14} className="shrink-0 text-primary" />
            <span className={cn(typography.bodySm, 'truncate font-medium text-primary')}>
              {lastCommand.command.label}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
