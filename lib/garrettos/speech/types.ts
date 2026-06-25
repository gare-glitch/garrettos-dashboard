/**
 * GarrettOS speech foundation — types only.
 *
 * The Web Speech API is not part of the TS DOM lib's stable surface in all
 * target versions, so we declare the minimal shapes we rely on here instead
 * of casting to `any`. This keeps the speech layer fully typed without a
 * backend or paid API.
 */

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'unsupported'
  | 'error';

export type VoiceCommandId =
  | 'open-memory'
  | 'open-system'
  | 'launch-agent'
  | 'show-tasks'
  | 'ask-garrett'
  | 'sync-memory'
  | 'new-task';

export type VoiceCommand = {
  id: VoiceCommandId;
  /** Phrases that map to this command (lowercased, matched as substrings). */
  phrases: string[];
  /** Human label shown in the transcript / overlay. */
  label: string;
  /** Optional route to push when the command fires. */
  href?: string;
  /** Optional side-effect action id (handled by the integrator, not the lib). */
  action?: string;
};

export type VoiceMatchResult = {
  command: VoiceCommand;
  /** The raw recognized transcript that matched. */
  transcript: string;
};

export type VoiceEvent =
  | { type: 'state'; state: VoiceState }
  | { type: 'transcript'; transcript: string; final: boolean }
  | { type: 'command'; match: VoiceMatchResult }
  | { type: 'error'; message: string };

export type VoiceController = {
  state: VoiceState;
  /** Live partial/final transcript. */
  transcript: string;
  /** True when the browser exposes SpeechRecognition. */
  supported: boolean;
  /** Most recent recognized command, if any. */
  lastCommand: VoiceMatchResult | null;
  /** Last error message, if state === 'error'. */
  error: string | null;
  /** Begin listening. No-op if unsupported. */
  start: () => void;
  /** Stop listening / cancel. */
  stop: () => void;
};

// --- Minimal Web Speech API surface (browser-only) ---------------------------

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResultLike {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeLike;
  /** Index access returns an alternative (array-like). */
  [index: number]: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}

export interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    item(index: number): SpeechRecognitionResultLike;
  };
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => void) | null;
}

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
