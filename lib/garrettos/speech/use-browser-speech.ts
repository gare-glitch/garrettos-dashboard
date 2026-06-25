'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { matchVoiceCommand } from './voice-commands';
import type { SpeechRecognitionCtor, SpeechRecognitionLike, VoiceMatchResult, VoiceState } from './types';

/**
 * Resolve the browser SpeechRecognition constructor, if any. Vendor-prefixed
 * on Safari. Returns null when unsupported — never throws.
 */
function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type UseBrowserSpeechOptions = {
  /** Called when a command is recognized. */
  onCommand?: (match: VoiceMatchResult) => void;
  /** Called whenever the voice state changes. */
  onStateChange?: (state: VoiceState) => void;
  /** BCP-47 language tag for recognition. */
  lang?: string;
  /** When true (default), motion-heavy "listening" visuals are suppressed. */
  respectReducedMotion?: boolean;
};

export type UseBrowserSpeechReturn = {
  state: VoiceState;
  transcript: string;
  supported: boolean;
  lastCommand: VoiceMatchResult | null;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

/**
 * useBrowserSpeech — a typed, SSR-safe wrapper around the Web Speech API.
 *
 * - Uses the browser's native SpeechRecognition when available.
 * - Gracefully reports `unsupported` when it isn't (no backend required).
 * - Respects prefers-reduced-motion by surfacing state but the caller decides
 *   how much visual flourish to show.
 * - Cleans up the recognition instance on unmount.
 */
export function useBrowserSpeech(options: UseBrowserSpeechOptions = {}): UseBrowserSpeechReturn {
  const { onCommand, onStateChange, lang = 'en-US', respectReducedMotion = true } = options;
  const reduceMotion = useReducedMotion();

  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onCommandRef = useRef(onCommand);
  const onStateRef = useRef(onStateChange);

  // Keep latest callbacks without re-creating the recognition instance.
  useEffect(() => {
    onCommandRef.current = onCommand;
    onStateRef.current = onStateChange;
  }, [onCommand, onStateChange]);

  const supported = useMemo(() => getRecognitionCtor() !== null, []);

  const updateState = useCallback((next: VoiceState) => {
    setState(next);
    onStateRef.current?.(next);
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    updateState('idle');
  }, [updateState]);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
    setLastCommand(null);
    updateState('idle');
  }, [updateState]);

  const start = useCallback(() => {
    if (respectReducedMotion && reduceMotion) {
      // Still allow the interaction, but flag unsupported-style idle so the UI
      // doesn't launch heavy listening visuals under reduced motion.
      setError('Voice input is paused under reduced-motion. Type your command instead.');
      updateState('error');
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      updateState('unsupported');
      return;
    }
    // Tear down any previous instance before starting a new one.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setTranscript('');
      setError(null);
      updateState('listening');
    };

    rec.onerror = (ev: Event) => {
      const detail = (ev as unknown as { error?: string }).error ?? 'speech-error';
      // "no-speech" / "aborted" are benign — fall back to idle, not error.
      if (detail === 'no-speech' || detail === 'aborted') {
        updateState('idle');
        return;
      }
      setError(detail);
      updateState('error');
    };

    rec.onresult = (ev) => {
      let interim = '';
      let finalText = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results.item(i);
        // A result is array-like of alternatives; take the top alternative.
        const alt = res[0] ?? res.item(0);
        const text = alt?.transcript ?? '';
        if (res.isFinal) finalText += text;
        else interim += text;
      }
      const live = (finalText || interim).trim();
      setTranscript(live);

      if (finalText) {
        const match = matchVoiceCommand(finalText);
        if (match) {
          setLastCommand(match);
          updateState('thinking');
          onCommandRef.current?.(match);
        } else {
          // Recognized speech but no command match — return to idle.
          updateState('idle');
        }
      }
    };

    rec.onend = () => {
      // If we transitioned to 'thinking' on a command match, let the caller
      // drive the next state; otherwise settle back to idle.
      setState((prev) => {
        if (prev === 'thinking' || prev === 'speaking') return prev;
        onStateRef.current?.('idle');
        return 'idle';
      });
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setError('could-not-start');
      updateState('error');
    }
  }, [lang, reduceMotion, respectReducedMotion, updateState]);

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

  return { state, transcript, supported, lastCommand, error, start, stop, reset };
}
