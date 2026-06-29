'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type {
  SpeechRecognitionCtor,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
  VoiceState,
} from '@/lib/garrettos/speech/types';
import { getVoiceAIMode, type AIVoiceMode } from './ai-intent-router';
import { phaseToLegacyState } from './voice-types';
import type { VoiceAction, VoiceIntent, VoicePhase, VoiceRoute, VoiceTaskResult } from './voice-types';
import {
  createRequest,
  type OrchestratorIntent,
  type OrchestratorOutcome,
  type OrchestratorRequest,
  type OrchestratorResult,
} from '@/lib/garrettos/orchestrator/types';

export type UseVoiceRecognitionOptions = {
  /** BCP-47 language tag for recognition. */
  lang?: string;
  /**
   * The central orchestrator entry point. When provided, every final transcript
   * flows through it (resolver → policy → executor). The deterministic parser
   * remains the resolver's fallback, so existing behavior is preserved.
   */
  orchestrate?: (request: OrchestratorRequest) => Promise<OrchestratorOutcome>;
};

export type UseVoiceRecognitionReturn = {
  phase: VoicePhase;
  /** Legacy M9A state derived from phase (for shared mic buttons / chips). */
  legacyState: VoiceState;
  /** Live partial transcript while listening. */
  interim: string;
  /** Final recognized transcript. */
  finalTranscript: string;
  /** Combined transcript (final || interim) — convenient for display. */
  transcript: string;
  intent: VoiceIntent | null;
  action: VoiceAction | null;
  supported: boolean;
  error: string | null;
  lastResult: VoiceTaskResult | null;
  /** Human feedback for the `completed` phase, e.g. "Opened Memory". */
  completionMessage: string | null;
  /** Configured AI interpretation mode (off / mock / litellm / openrouter / ollama). */
  aiMode: AIVoiceMode;
  start: () => void;
  stop: () => void;
  reset: () => void;
  /** Treat typed text as a final transcript (typed fallback path). */
  submitTyped: (text: string) => void;
  /** Clear the current intent/action and return to idle. */
  dismiss: () => void;
  /** Mark the outcome of an externally-run action (task create / navigate). */
  resolve: (result: VoiceTaskResult) => void;
};

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * useVoiceRecognition — the M13 voice command engine.
 *
 * Owns a single SpeechRecognition instance, separates interim vs final
 * transcripts, and runs the deterministic intent parser + action router on
 * every final result. Performs NO side-effects itself (no navigation, no task
 * creation) — it only proposes an action and calls `onAction`. The integrator
 * (VoiceProvider) decides how to execute it.
 *
 * SSR-safe: reports `supported: false` on the server and during prerender.
 */
export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {},
): UseVoiceRecognitionReturn {
  const { lang = 'en-US', orchestrate } = options;
  const pathname = usePathname();

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [interim, setInterim] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [intent, setIntent] = useState<VoiceIntent | null>(null);
  const [action, setAction] = useState<VoiceAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VoiceTaskResult | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const aiMode = useMemo<AIVoiceMode>(() => getVoiceAIMode(), []);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const orchestrateRef = useRef(orchestrate);
  useEffect(() => {
    orchestrateRef.current = orchestrate;
  }, [orchestrate]);

  const supported = useMemo(() => getRecognitionCtor() !== null, []);

  const dismiss = useCallback(() => {
    setIntent(null);
    setAction(null);
    setInterim('');
    setFinalTranscript('');
    setError(null);
    setCompletionMessage(null);
    setPhase('idle');
  }, []);

  const reset = useCallback(() => {
    dismiss();
    setLastResult(null);
  }, [dismiss]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    setPhase((prev) => (prev === 'listening' || prev === 'transcribing' ? 'idle' : prev));
  }, []);

  const interpret = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) {
        setPhase('idle');
        return;
      }
      setFinalTranscript(clean);
      setInterim('');
      setCompletionMessage(null);
      setPhase('interpreting');

      const run = orchestrateRef.current;
      if (!run) {
        setError('Orchestrator not configured');
        setPhase('error');
        return;
      }

      const request = createRequest({
        source: 'voice',
        transcript: clean,
        currentPage: pathname ?? undefined,
        userConfirmed: false,
      });

      let outcome: OrchestratorOutcome;
      try {
        outcome = await run(request);
      } catch {
        setError('Orchestration failed');
        setPhase('error');
        return;
      }

      applyOutcome(outcome);
    },
    [pathname],
  );

  /** Map an orchestrator outcome onto the voice state machine + UI models. */
  function applyOutcome(outcome: OrchestratorOutcome) {
    const { intent: oIntent, result } = outcome;
    const voiceIntent = toVoiceIntent(oIntent);
    setIntent(voiceIntent);
    setAction(deriveAction(oIntent, result, voiceIntent));

    switch (result.status) {
      case 'completed':
        setCompletionMessage(result.message);
        setLastResult(null);
        setPhase('completed');
        break;
      case 'queued':
        setLastResult({
          ok: true,
          taskId: result.taskId,
          taskTitle: result.taskTitle,
          source: (result.debug?.source as 'server' | 'mock' | undefined) ?? undefined,
          warning: result.warning,
        });
        setPhase('queued');
        break;
      case 'needs_approval':
        setLastResult(null);
        setPhase('needs_approval');
        break;
      case 'failed':
        setLastResult({ ok: false, error: result.message });
        setError(result.message);
        setPhase('error');
        break;
      case 'unsupported':
        // Fallback adapter already opened the command palette; show feedback and
        // let the overlay auto-close. UI stays stable (no navigation/mutation).
        setCompletionMessage(result.message);
        setLastResult(null);
        setPhase('completed');
        break;
      default:
        setPhase('idle');
    }
  }

  /** Build a VoiceIntent for the UI cards from the orchestrator intent. */
  function toVoiceIntent(o: OrchestratorIntent): VoiceIntent {
    if (o.rawIntent) return o.rawIntent;
    const href = o.payload.href as string | undefined;
    const label = o.payload.label as string | undefined;
    const route: VoiceRoute | undefined = href && label ? { href, label } : undefined;
    return {
      id: o.action ?? o.type,
      kind:
        o.type === 'navigation' || o.type === 'memory' || o.type === 'system'
          ? 'navigation'
          : o.type === 'task'
            ? 'task'
            : o.type === 'composio'
              ? 'composio'
              : 'unknown',
      label: o.action ?? 'Not recognized',
      confidence: o.confidence,
      requiresApproval: o.requiresApproval,
      composioTools: o.composioTools,
      agent: o.suggestedAgent,
      route,
      taskTitle: o.payload.taskTitle as string | undefined,
      taskDescription: o.payload.taskDescription as string | undefined,
      transcript: (o.payload.transcript as string | undefined) ?? '',
    };
  }

  /** Derive a VoiceAction so the existing VoiceActionPreview keeps working. */
  function deriveAction(
    o: OrchestratorIntent,
    result: OrchestratorResult,
    voiceIntent: VoiceIntent,
  ): VoiceAction | null {
    if (result.status === 'needs_approval') {
      const href = o.payload.href as string | undefined;
      const label = o.payload.label as string | undefined;
      if (href && label && (o.type === 'navigation' || o.type === 'memory' || o.type === 'system')) {
        return { type: 'navigate', route: { href, label }, intent: voiceIntent };
      }
      return o.requiresApproval
        ? { type: 'queue-task', intent: voiceIntent }
        : { type: 'review-task', intent: voiceIntent };
    }
    if (result.status === 'queued' || result.status === 'failed') {
      return { type: 'queue-task', intent: voiceIntent };
    }
    return null;
  }

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setPhase('unsupported');
      setError(null);
      return;
    }
    // Tear down any previous instance.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
    }
    setIntent(null);
    setAction(null);
    setInterim('');
    setFinalTranscript('');
    setError(null);
    setLastResult(null);
    setCompletionMessage(null);

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setPhase('listening');
    };

    rec.onerror = (ev: Event) => {
      const detail = (ev as unknown as { error?: string }).error ?? 'speech-error';
      if (detail === 'no-speech' || detail === 'aborted') {
        setPhase('idle');
        return;
      }
      if (detail === 'not-allowed' || detail === 'service-not-allowed') {
        setError('Microphone permission denied — allow mic access in your browser.');
      } else {
        setError(detail);
      }
      setPhase('error');
    };

    rec.onresult = (ev: SpeechRecognitionEventLike) => {
      let interimText = '';
      let finalText = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results.item(i);
        const alt = res[0] ?? res.item(0);
        const text = alt?.transcript ?? '';
        if (res.isFinal) finalText += text;
        else interimText += text;
      }
      if (interimText) {
        setInterim(interimText.trim());
        setPhase('transcribing');
      }
      if (finalText) {
        interpret(finalText);
      }
    };

    rec.onend = () => {
      // Preserve terminal/paused states set during onresult so feedback and the
      // approval gate survive the recognition session ending. Crucially, do NOT
      // preserve 'interpreting' — interpret() always advances to a terminal
      // state synchronously, so a leftover 'interpreting' means something
      // failed to advance and must fall back to idle (no stuck THINKING).
      setPhase((prev) => {
        if (
          prev === 'needs_approval' ||
          prev === 'queued' ||
          prev === 'completed' ||
          prev === 'error'
        ) {
          return prev;
        }
        return 'idle';
      });
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setError('could-not-start');
      setPhase('error');
    }
  }, [interpret, lang]);

  const submitTyped = useCallback(
    (text: string) => {
      // Typed fallback works regardless of speech support / reduced motion.
      stop();
      interpret(text);
    },
    [interpret, stop],
  );

  const resolve = useCallback((result: VoiceTaskResult) => {
    setLastResult(result);
    if (result.ok) {
      setCompletionMessage(null);
      setPhase('queued');
    } else {
      setError(result.error ?? 'task create failed');
      setPhase('error');
    }
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const transcript = finalTranscript || interim;

  return {
    phase,
    legacyState: phaseToLegacyState(phase),
    interim,
    finalTranscript,
    transcript,
    intent,
    action,
    supported,
    error,
    lastResult,
    completionMessage,
    aiMode,
    start,
    stop,
    reset,
    submitTyped,
    dismiss,
    resolve,
  };
}
