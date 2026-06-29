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
import { VoiceDebugPanel } from './VoiceDebugPanel';
import { useVoice } from '../speech/VoiceProvider';
import type { VoicePhase } from '@/lib/garrettos/voice/voice-types';

const HINTS: { kind: string; phrases: string[] }[] = [
  { kind: 'Navigate', phrases: ['open memory', 'show OpenClaw', 'go to system', 'open settings'] },
  { kind: 'Task', phrases: ['ask OpenCode to research…', 'have Claude review…', 'create a task to…'] },
  { kind: 'Composio', phrases: ['draft an email to…', 'look up my latest emails', 'show my GitHub repos'] },
];

/**
 * VoiceCommandOverlay (M13) — the Siri/Raycast-style voice surface. Composes
 * the orb, live transcript, parsed intent card, an approval-gated action
 * preview, and a completion banner for immediate navigation. Always offers a
 * typed fallback and a debug panel so the command path is observable.
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
    completionMessage,
    aiMode,
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
  const [debugOpen, setDebugOpen] = useState(false);

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

  // Auto-close on the `completed` phase so navigation/fallback show brief
  // feedback ("Opened Memory") then dismiss — never leaving the overlay stuck.
  useEffect(() => {
    if (!overlayOpen || phase !== 'completed') return;
    const delay = action?.type === 'fallback' ? 900 : 1400;
    const t = window.setTimeout(closeOverlay, delay);
    return () => window.clearTimeout(t);
  }, [overlayOpen, phase, action, closeOverlay]);

  const showIntent =
    !!intent &&
    intent.kind !== 'unknown' &&
    (phase === 'needs_approval' || phase === 'interpreting' || phase === 'queued' || phase === 'error');
  const showAction = !!action && (phase === 'needs_approval' || phase === 'queued' || phase === 'error');
  const showCompletion = phase === 'completed' && !!completionMessage;
  const permissionDenied =
    error?.toLowerCase().includes('permission') || error?.toLowerCase().includes('not-allowed');

  // Re-listen is available whenever we're not actively listening and not in a
  // terminal completed/queued state (those auto-close or show a result).
  const canRelisten =
    supported &&
    phase !== 'listening' &&
    phase !== 'transcribing' &&
    phase !== 'completed' &&
    phase !== 'queued';

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

              {/* Completion banner — immediate feedback for navigation/fallback */}
              {showCompletion ? (
                <motion.div
                  className="flex w-full max-w-md items-center gap-2.5 rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2.5"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  role="status"
                  aria-live="polite"
                >
                  <GarrettIcon name="check_circle" size={18} className="text-secondary" />
                  <p className={cn(typography.bodySm, 'flex-1 font-medium text-secondary')}>
                    {completionMessage}
                  </p>
                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="rounded-md px-1.5 py-0.5 text-[10px] text-secondary/80 transition-colors hover:bg-white/5"
                  >
                    Done
                  </button>
                </motion.div>
              ) : null}

              {/* Permission / error note */}
              {permissionDenied && phase === 'error' ? (
                <p className="flex items-center gap-1.5 rounded-lg border border-error/25 bg-error/10 px-3 py-2 text-[11px] text-error">
                  <GarrettIcon name="gpp_maybe" size={13} />
                  Microphone blocked. Allow mic access in your browser settings, then try again.
                </p>
              ) : null}

              {/* Live transcript (hidden once a completion banner takes over) */}
              {!showCompletion ? (
                <VoiceTranscript
                  interim={interim}
                  finalTranscript={finalTranscript}
                  phase={phase as VoicePhase}
                  className="max-w-md"
                />
              ) : null}

              {/* Re-listen control */}
              {canRelisten ? (
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

              {/* Typed fallback — always available (not during completion) */}
              {!showCompletion ? (
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
              ) : null}

              {/* Hints — hidden once an intent/completion is shown to reduce clutter */}
              {!showIntent && !showCompletion ? (
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
                <button
                  type="button"
                  onClick={() => setDebugOpen((v) => !v)}
                  className="rounded px-1.5 py-0.5 font-mono text-[10px] text-outline transition-colors hover:bg-white/5 hover:text-on-surface-variant"
                  aria-expanded={debugOpen}
                  aria-label="Toggle voice debug panel"
                >
                  debug
                </button>
              </div>

              {debugOpen ? (
                <VoiceDebugPanel
                  phase={phase as VoicePhase}
                  transcript={finalTranscript || interim}
                  intent={intent}
                  action={action}
                  lastResult={lastResult}
                  error={error}
                  aiMode={aiMode}
                  supported={supported}
                />
              ) : null}
            </div>
          </FluidGlassPanel>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
