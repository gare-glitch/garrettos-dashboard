'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { VOICE_COMMANDS } from '@/lib/garrettos/speech/voice-commands';
import { GarrettIcon } from '../GarrettIcon';
import { FluidGlassPanel } from '../motion';
import { SpeechOrb } from './SpeechOrb';
import { VoiceStatusChip } from './VoiceStatusChip';
import type { VoiceMatchResult, VoiceState } from '@/lib/garrettos/speech/types';

/**
 * VoiceCommandOverlay — a calm, focused full-screen takeover for voice input.
 * Shows the live orb, transcript, matched command, and the list of available
 * commands as a subtle hint. Closes on Escape / outside click / when idle.
 *
 * Reduced motion: the orb renders statically and the overlay simply fades.
 */
export function VoiceCommandOverlay({
  open,
  state,
  transcript,
  lastCommand,
  supported,
  onClose,
  className,
}: {
  open: boolean;
  state: VoiceState;
  transcript: string;
  lastCommand: VoiceMatchResult | null;
  supported: boolean;
  onClose: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn(
            'fixed inset-0 z-[60] flex items-center justify-center px-4',
            className,
          )}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-label="Voice command"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-[#021018]/40"
            onClick={onClose}
            aria-label="Close voice command"
            tabIndex={-1}
          />
          <FluidGlassPanel
            variant="active"
            interactive={false}
            rounded="rounded-2xl"
            className="relative w-full max-w-md p-6"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <SpeechOrb state={state} size={72} />
              <div>
                <h2 className={cn(typography.headlineMd, 'text-on-surface')}>Talk to GarrettOS</h2>
                <p className={cn(typography.body, 'mt-1 text-[12px] text-on-surface-variant')}>
                  {supported
                    ? 'Say a command. I will route you there.'
                    : 'Voice input is not available in this browser — type in the command palette instead.'}
                </p>
              </div>

              <VoiceStatusChip state={state} />

              {transcript ? (
                <p className={cn(typography.body, 'max-w-sm truncate text-[14px] text-on-surface')}>
                  &ldquo;{transcript}&rdquo;
                </p>
              ) : state === 'listening' ? (
                <p className={cn(typography.body, 'text-[12px] text-on-surface-variant')}>
                  Listening…
                </p>
              ) : null}

              {lastCommand ? (
                <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
                  <GarrettIcon name="bolt" size={14} className="text-primary" />
                  <span className={cn(typography.bodySm, 'font-medium text-primary')}>
                    {lastCommand.command.label}
                  </span>
                </div>
              ) : null}

              <div className="mt-1 w-full border-t border-white/8 pt-3">
                <p className={cn(typography.labelCaps, 'mb-2 text-[10px] text-outline')}>Try saying</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {VOICE_COMMANDS.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] text-on-surface-variant"
                    >
                      {c.phrases[0]}
                    </span>
                  ))}
                </div>
              </div>

              <p className="font-mono text-[10px] text-outline">esc to close</p>
            </div>
          </FluidGlassPanel>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
