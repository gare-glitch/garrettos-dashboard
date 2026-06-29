'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceRecognition } from '@/lib/garrettos/voice/useVoiceRecognition';
import { useOrchestrator } from '../orchestrator/OrchestratorProvider';
import { useTaskComposer } from '../agent-ops/TaskComposerContext';
import { useCommandPaletteContext } from '../CommandPaletteContext';
import type { VoiceMatchResult, VoiceState } from '@/lib/garrettos/speech/types';
import type {
  VoiceAction,
  VoiceIntent,
  VoicePhase,
  VoiceTaskResult,
} from '@/lib/garrettos/voice/voice-types';

type VoiceContextValue = {
  // --- M9A legacy (kept for TopAppBar / CommandPalette / HomeHero) ---
  state: VoiceState;
  transcript: string;
  supported: boolean;
  lastCommand: VoiceMatchResult | null;
  error: string | null;
  overlayOpen: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  openOverlay: () => void;
  closeOverlay: () => void;
  // --- M13/M14A voice command layer ---
  phase: VoicePhase;
  interim: string;
  finalTranscript: string;
  intent: VoiceIntent | null;
  action: VoiceAction | null;
  lastResult: VoiceTaskResult | null;
  /** Human feedback for the `completed` phase, e.g. "Opened Memory". */
  completionMessage: string | null;
  /** Configured AI interpretation mode (off / litellm / openrouter / nemotron). */
  aiMode: 'off' | 'litellm' | 'openrouter' | 'nemotron';
  submitting: boolean;
  approve: () => Promise<void>;
  navigate: () => void;
  editInComposer: () => void;
  fallback: () => void;
  dismiss: () => void;
  submitTyped: (text: string) => void;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

/**
 * VoiceProvider owns the single voice command engine for the app.
 *
 * As of M14A, voice no longer resolves/executes actions itself — every final
 * transcript flows through the central orchestrator
 * (resolver → policy → executor adapter). This provider:
 *  - passes the orchestrator's `orchestrate` into the recognition hook,
 *  - implements `approve()` by calling the orchestrator's `approvePending`
 *    (which re-executes the gated intent with `userConfirmed: true`),
 *  - keeps the manual navigate/fallback/edit-in-composer buttons for the
 *    approval-gated action preview.
 *
 * Navigation + fallback side-effects now live in the orchestrator's injected
 * services (router.push / openPaletteWithQuery), not here.
 */
export function VoiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { openComposerWithPrefill } = useTaskComposer();
  const { openPaletteWithQuery } = useCommandPaletteContext();
  const { orchestrate, approvePending } = useOrchestrator();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const rec = useVoiceRecognition({ orchestrate });

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    rec.stop();
    rec.dismiss();
  }, [rec]);

  const start = useCallback(() => {
    setOverlayOpen(true);
    rec.start();
  }, [rec]);

  const openOverlay = useCallback(() => {
    setOverlayOpen(true);
  }, []);

  const reset = useCallback(() => {
    rec.reset();
    setOverlayOpen(false);
  }, [rec]);

  const dismiss = useCallback(() => {
    rec.dismiss();
  }, [rec]);

  const submitTyped = useCallback(
    (text: string) => {
      rec.submitTyped(text);
    },
    [rec],
  );

  const navigate = useCallback(() => {
    if (rec.intent?.route) {
      router.push(rec.intent.route.href);
      setOverlayOpen(false);
    }
  }, [router, rec.intent]);

  const fallback = useCallback(() => {
    if (rec.intent) {
      openPaletteWithQuery(rec.intent.transcript);
    }
    setOverlayOpen(false);
  }, [openPaletteWithQuery, rec.intent]);

  const editInComposer = useCallback(() => {
    const intent = rec.intent;
    if (!intent) return;
    openComposerWithPrefill({
      title: intent.taskTitle ?? intent.transcript,
      description: intent.taskDescription,
      agent: intent.agent,
      requiresApproval: intent.requiresApproval,
      composioTools: intent.composioTools,
      source: 'voice',
    });
    setOverlayOpen(false);
  }, [openComposerWithPrefill, rec.intent]);

  // Approve re-runs the pending intent through the orchestrator with
  // userConfirmed: true, then maps the result onto the voice state machine.
  const approve = useCallback(async () => {
    setSubmitting(true);
    try {
      const result = await approvePending();
      if (result.status === 'queued') {
        rec.resolve({
          ok: true,
          taskId: result.taskId,
          taskTitle: result.taskTitle,
          source: (result.debug?.source as 'server' | 'mock' | undefined) ?? undefined,
          warning: result.warning,
        });
      } else {
        rec.resolve({ ok: false, error: result.message });
      }
    } catch {
      rec.resolve({ ok: false, error: 'Approval failed — task not created' });
    } finally {
      setSubmitting(false);
    }
  }, [approvePending, rec]);

  // Derive a legacy lastCommand so the M9A VoiceTranscriptPanel (in the command
  // palette) keeps working for navigation intents.
  const lastCommand = useMemo<VoiceMatchResult | null>(() => {
    const intent = rec.intent;
    if (!intent || intent.kind !== 'navigation' || !intent.route) return null;
    return {
      command: {
        id: 'open-memory',
        label: intent.label,
        phrases: [],
        href: intent.route.href,
      },
      transcript: intent.transcript,
    } as VoiceMatchResult;
  }, [rec.intent]);

  const value = useMemo<VoiceContextValue>(
    () => ({
      state: rec.legacyState,
      transcript: rec.transcript,
      supported: rec.supported,
      lastCommand,
      error: rec.error,
      overlayOpen,
      start,
      stop: rec.stop,
      reset,
      openOverlay,
      closeOverlay,
      phase: rec.phase,
      interim: rec.interim,
      finalTranscript: rec.finalTranscript,
      intent: rec.intent,
      action: rec.action,
      lastResult: rec.lastResult,
      completionMessage: rec.completionMessage,
      aiMode: rec.aiMode,
      submitting,
      approve,
      navigate,
      editInComposer,
      fallback,
      dismiss,
      submitTyped,
    }),
    [
      rec.legacyState,
      rec.transcript,
      rec.supported,
      rec.error,
      rec.phase,
      rec.interim,
      rec.finalTranscript,
      rec.intent,
      rec.action,
      rec.lastResult,
      rec.completionMessage,
      rec.aiMode,
      lastCommand,
      overlayOpen,
      start,
      rec.stop,
      reset,
      openOverlay,
      closeOverlay,
      submitting,
      approve,
      navigate,
      editInComposer,
      fallback,
      dismiss,
      submitTyped,
    ],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    return {
      state: 'idle',
      transcript: '',
      supported: false,
      lastCommand: null,
      error: null,
      overlayOpen: false,
      start: () => {},
      stop: () => {},
      reset: () => {},
      openOverlay: () => {},
      closeOverlay: () => {},
      phase: 'idle',
      interim: '',
      finalTranscript: '',
      intent: null,
      action: null,
      lastResult: null,
      completionMessage: null,
      aiMode: 'off',
      submitting: false,
      approve: () => Promise.resolve(),
      navigate: () => {},
      editInComposer: () => {},
      fallback: () => {},
      dismiss: () => {},
      submitTyped: () => {},
    };
  }
  return ctx;
}
