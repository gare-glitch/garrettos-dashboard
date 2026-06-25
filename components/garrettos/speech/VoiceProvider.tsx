'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useBrowserSpeech } from '@/lib/garrettos/speech/use-browser-speech';
import { useTaskComposer } from '../agent-ops/TaskComposerContext';
import type { VoiceMatchResult, VoiceState } from '@/lib/garrettos/speech/types';

type VoiceContextValue = {
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
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

/**
 * VoiceProvider owns the single SpeechRecognition instance for the app and
 * routes recognized commands (navigate to a route, or emit an action id for
 * the integrator to handle). Mount once inside the Shell.
 *
 * Command routing:
 *  - commands with an `href` push the route and close the overlay.
 *  - commands with an `action` are stored as lastCommand for the caller;
 *    no mutating side-effects run from here (read-only by design).
 */
export function VoiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { openComposer } = useTaskComposer();
  const [overlayOpen, setOverlayOpen] = useState(false);

  const onCommand = useCallback(
    (match: VoiceMatchResult) => {
      if (match.command.href) {
        router.push(match.command.href);
        setOverlayOpen(false);
      }
      // Action-only commands: open the task composer for new-task; other
      // actions stay surfaced as lastCommand for the integrator. No mutations.
      if (match.command.action === 'new-task') {
        openComposer();
        setOverlayOpen(false);
      }
    },
    [router, openComposer],
  );

  const speech = useBrowserSpeech({ onCommand });

  const start = useCallback(() => {
    setOverlayOpen(true);
    speech.start();
  }, [speech]);

  const stop = useCallback(() => {
    speech.stop();
  }, [speech]);

  const openOverlay = useCallback(() => setOverlayOpen(true), []);
  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    speech.stop();
  }, [speech]);

  const value = useMemo<VoiceContextValue>(
    () => ({
      state: speech.state,
      transcript: speech.transcript,
      supported: speech.supported,
      lastCommand: speech.lastCommand,
      error: speech.error,
      overlayOpen,
      start,
      stop,
      reset: speech.reset,
      openOverlay,
      closeOverlay,
    }),
    [speech.state, speech.transcript, speech.supported, speech.lastCommand, speech.error, speech.reset, overlayOpen, start, stop, openOverlay, closeOverlay],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    // Safe no-op default when used outside the provider.
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
    };
  }
  return ctx;
}
