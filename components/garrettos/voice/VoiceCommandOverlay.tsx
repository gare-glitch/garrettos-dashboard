'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from '../GarrettIcon';
import { FluidGlassPanel } from '../motion';
import { VoiceOrb } from './VoiceOrb';
import { VoiceTranscript } from './VoiceTranscript';
import { VoiceIntentCard } from './VoiceIntentCard';
import { VoiceActionPreview } from './VoiceActionPreview';
import { useVoice } from '../speech/VoiceProvider';
import type { VoicePhase } from '@/lib/garrettos/voice/voice-types';

const HINTS: { kind: string; phrases: string[] }[] = [
  { kind: 'Navigate', phrases: ['open memory', 'show OpenClaw', 'go to system', 'open settings'] },
  { kind: 'Task', phrases: ['ask OpenCode to research…', 'have Claude review…', 'create a task to…'] },
  { kind: 'Composio', phrases: ['draft an email to…', 'look up my latest emails', 'show my GitHub repos'] },
];

/**
 * VoiceCommandOverlay (M13) — the Siri/Raycast-style voice surface. Composes
 * the orb, live transcript, parsed intent card, and an approval-gated action
 * preview. Always offers a typed fallback so it's useful without a microphone.
 *
 * Reads all state from the VoiceProvider via useVoice(); the parent only needs
 * to render it once inside the provider tree. Esc / outside click closes.
 */
export function VoiceCommandOverlay({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const voice = useVoice();
  const {
    overlayOpen,
    phase,
    interim,
    finalTranscript,
    intent,
    action,
    lastResult,
    submitting,
    supported,
    error,
    closeOverlay,
    start,
    submitTyped,
    approve,
    navigate,
    editInComposer,
    fallback,
    dismiss,
  } = voice;

  const [typed, setTyped] = useState('');

  // Esc to close.
  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeOverlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlayOpen, closeOverlay]);

  const showIntent = intent && intent.kind !== 'unknown' && (phase === 'needs_approval' || phase === 'interpreting' || phase === 'queued' || phase === 'error');
  const showAction = action && (phase === 'needs_approval' || phase === 'queued' || phase === 'error');
  const permissionDenied = error?.toLowerCase().includes('permission') || error?.toLowerCase().includes('not-allowed');

  function handleTypedSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = typed.trim();
    if (!text) return;
    submitTyped(text);
    setTyped('');
  }

  return (
    <AnimatePresence>
      {overlayOpen ? (
        <motion.div
          className={cn('fixed inset-0 z-[60] flex items-center justify-center px-4', className)}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-label="Voice command"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-[#021018]/40"
            onClick={closeOverlay}
            aria-label="Close voice command"
            tabIndex={-1}
          />
          <FluidGlassPanel
            variant="active"
            interactive={false}
            rounded="rounded-2xl"
            className="relative w-full max-w-lg p-6"
          >
            <div className="flex flex-col items-center gap-4">
              {/* Orb + header */}
              <VoiceOrb phase={phase as VoicePhase} size={92} />
              <div className="text-center">
                <h2 className={cn(typography.headlineMd, 'text-on-surface')}>Talk to GarrettOS</h2>
                <p className={cn(typography.body, 'mt-1 text-[12px] text-on-surface-variant')}>
                  {supported
                    ? 'Speak a command — I will route you or queue a safe task.'
                    : 'Voice input is not available in this browser — type a command below.'}
                </p>
              </div>

              {/* Permission / error note */}
              {permissionDenied ? (
                <p className="flex items-center gap-1.5 rounded-lg border border-error/25 bg-error/10 px-3 py-2 text-[11px] text-error">
                  <GarrettIcon name="gpp_maybe" size={13} />
                  Microphone blocked. Allow mic access in your browser settings, then try again.
                </p>
              ) : null}

              {/* Live transcript */}
              <VoiceTranscript
                interim={interim}
                finalTranscript={finalTranscript}
                phase={phase as VoicePhase}
                className="max-w-md"
              />

              {/* Re-listen control */}
              {supported && phase !== 'listening' && phase !== 'transcribing' ? (
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-on-surface-variant transition-colors hover:border-tertiary/30 hover:text-tertiary"
                >
                  <GarrettIcon name="mic" size={13} />
                  {finalTranscript ? 'Listen again' : 'Start listening'}
                </button>
              ) : null}

              {/* Intent + action */}
              <div className="w-full max-w-md space-y-2.5">
                {showIntent && intent ? <VoiceIntentCard intent={intent} /> : null}
                {showAction && action ? (
                  <VoiceActionPreview
                    action={action}
                    phase={phase as VoicePhase}
                    lastResult={lastResult}
                    submitting={submitting}
                    onApprove={approve}
                    onEditInComposer={editInComposer}
                    onNavigate={navigate}
                    onFallback={fallback}
                    onDismiss={dismiss}
                  />
                ) : null}
              </div>

              {/* Typed fallback — always available */}
              <form onSubmit={handleTypedSubmit} className="w-full max-w-md">
                <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-surface-container-low/40 px-3 py-2 transition-colors focus-within:border-primary/40">
                  <GarrettIcon name="keyboard" size={16} className="text-on-surface-variant" />
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder="Or type a command — e.g. draft an email to…"
                    className="flex-1 bg-transparent text-body-sm text-on-surface outline-none placeholder:text-outline/60"
                    aria-label="Type a voice command"
                  />
                  <button
                    type="submit"
                    disabled={!typed.trim()}
                    className={cn(
                      'flex items-center gap-1 rounded-lg bg-primary/90 px-2.5 py-1 label-caps text-[10px] text-on-primary transition-opacity',
                      !typed.trim() && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <GarrettIcon name="arrow_forward" size={13} />
                    Go
                  </button>
                </div>
              </form>

              {/* Hints — hidden once an intent is shown to reduce clutter */}
              {!showIntent ? (
                <div className="w-full border-t border-white/8 pt-3">
                  <p className={cn(typography.labelCaps, 'mb-2 text-center text-[10px] text-outline')}>Try saying</p>
                  <div className="space-y-1.5">
                    {HINTS.map((group) => (
                      <div key={group.kind} className="flex flex-wrap items-center justify-center gap-1.5">
                        <span className="text-[9px] text-outline/70">{group.kind}:</span>
                        {group.phrases.map((p) => (
                          <span
                            key={p}
                            className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-on-surface-variant"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex w-full items-center justify-between font-mono text-[10px] text-outline">
                <span>⌘⇧Space · esc to close</span>
                <span>approval-gated</span>
              </div>
            </div>
          </FluidGlassPanel>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
