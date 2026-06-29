'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  SpeechRecognitionCtor,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
  VoiceState,
} from '@/lib/garrettos/speech/types';
import { parseVoiceIntent } from './intent-parser';
import { routeVoiceIntent } from './action-router';
import { phaseToLegacyState } from './voice-types';
import type { VoiceAction, VoiceIntent, VoicePhase, VoiceTaskResult } from './voice-types';

export type UseVoiceRecognitionOptions = {
  /** BCP-47 language tag for recognition. */
  lang?: string;
  /** Fired when a final transcript is parsed into an action. */
  onAction?: (action: VoiceAction) => void;
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
  const { lang = 'en-US', onAction } = options;

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [interim, setInterim] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [intent, setIntent] = useState<VoiceIntent | null>(null);
  const [action, setAction] = useState<VoiceAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VoiceTaskResult | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onActionRef = useRef(onAction);
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const supported = useMemo(() => getRecognitionCtor() !== null, []);

  const dismiss = useCallback(() => {
    setIntent(null);
    setAction(null);
    setInterim('');
    setFinalTranscript('');
    setError(null);
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

  const interpret = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean) {
      setPhase('idle');
      return;
    }
    setFinalTranscript(clean);
    setInterim('');
    setPhase('interpreting');
    const parsed = parseVoiceIntent(clean);
    const routed = routeVoiceIntent(parsed);
    setIntent(parsed);
    setAction(routed);
    onActionRef.current?.(routed);
    // Phase transition: navigation/fallback are handled by the integrator
    // (they close the overlay); task actions pause for approval.
    if (routed.type === 'queue-task' || routed.type === 'review-task') {
      setPhase('needs_approval');
    }
  }, []);

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
      // If we already moved to interpreting/needs_approval, keep that state;
      // otherwise settle back to idle.
      setPhase((prev) => {
        if (
          prev === 'interpreting' ||
          prev === 'needs_approval' ||
          prev === 'queued' ||
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
    start,
    stop,
    reset,
    submitTyped,
    dismiss,
    resolve,
  };
}
