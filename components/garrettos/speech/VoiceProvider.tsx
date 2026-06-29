'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceRecognition } from '@/lib/garrettos/voice/useVoiceRecognition';
import { useTaskComposer } from '../agent-ops/TaskComposerContext';
import { useCommandPaletteContext } from '../CommandPaletteContext';
import type { VoiceMatchResult, VoiceState } from '@/lib/garrettos/speech/types';
import type {
  VoiceAction,
  VoiceIntent,
  VoicePhase,
  VoiceTaskResult,
} from '@/lib/garrettos/voice/voice-types';
import type { TaskCreateInput } from '@/lib/garrettos/types';

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
  // --- M13 voice command layer ---
  phase: VoicePhase;
  interim: string;
  finalTranscript: string;
  intent: VoiceIntent | null;
  action: VoiceAction | null;
  lastResult: VoiceTaskResult | null;
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
 * VoiceProvider (M13) owns the single voice command engine for the app.
 *
 * It wraps useVoiceRecognition (Web Speech API + deterministic intent parser)
 * and is the ONLY place a voice intent becomes a side-effect:
 *  - navigation intents route immediately (read-only),
 *  - unknown intents fall back to the command palette prefilled with the
 *    transcript,
 *  - task/composio intents surface an approval-gated action preview; the user
 *    must click approve → this provider POSTs a queued task record. Nothing
 *    executes from voice.
 */
export function VoiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { openComposerWithPrefill } = useTaskComposer();
  const { openPaletteWithQuery } = useCommandPaletteContext();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // onAction: react immediately to navigation + fallback; task actions pause
  // for approval (the overlay renders the action preview).
  const onAction = useCallback(
    (action: VoiceAction) => {
      if (action.type === 'navigate') {
        router.push(action.route.href);
        setOverlayOpen(false);
      } else if (action.type === 'fallback') {
        openPaletteWithQuery(action.transcript);
        setOverlayOpen(false);
      }
      // queue-task / review-task → no auto-action; user approves in the overlay.
    },
    [router, openPaletteWithQuery],
  );

  const rec = useVoiceRecognition({ onAction });

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

  const approve = useCallback(async () => {
    const intent = rec.intent;
    if (!intent || !intent.taskTitle) return;
    setSubmitting(true);
    try {
      const body: TaskCreateInput = {
        title: intent.taskTitle,
        description: intent.taskDescription,
        agent: intent.agent ?? 'openclaw',
        priority: 'medium',
        requiresApproval: intent.requiresApproval,
        composioTools: intent.composioTools,
        source: 'voice',
        transcript: intent.transcript,
        intent: intent.id,
      };
      const res = await fetch('/api/garrettos/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const task = json?.data?.task;
      if (!res.ok || !task) {
        rec.resolve({
          ok: false,
          error: json?.warning || `Request failed (${res.status})`,
        });
        return;
      }
      rec.resolve({
        ok: true,
        taskId: task.id,
        taskTitle: task.title,
        source: json.data.source ?? 'mock',
        warning: json.warning,
      });
    } catch {
      rec.resolve({ ok: false, error: 'Network error — task not created' });
    } finally {
      setSubmitting(false);
    }
  }, [rec]);

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
