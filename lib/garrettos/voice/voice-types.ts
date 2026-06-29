/**
 * GarrettOS Voice Command Layer — types (M13).
 *
 * The richer state machine + intent model that sits on top of the M9A speech
 * foundation (lib/garrettos/speech). The browser Web Speech API still does the
 * actual recognition; this layer adds deterministic intent parsing, an approval
 * gate, and a typed action router so voice never mutates state directly.
 */
import type { TaskAgent } from '@/lib/garrettos/types';
import type { VoiceState } from '@/lib/garrettos/speech/types';

/** The rich voice command state machine. */
export type VoicePhase =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'interpreting'
  | 'needs_approval'
  | 'queued'
  | 'completed'
  | 'error'
  | 'unsupported';

/** Broad category of a parsed voice intent. */
export type VoiceIntentKind = 'navigation' | 'task' | 'composio' | 'unknown';

/** A route target for navigation intents. */
export type VoiceRoute = {
  href: string;
  label: string;
};

/** A parsed voice intent (deterministic, v1). */
export type VoiceIntent = {
  /** Stable id, e.g. 'navigate.memory' / 'task.create' / 'composio.draft_email'. */
  id: string;
  kind: VoiceIntentKind;
  /** Human label shown in the intent card. */
  label: string;
  /** 0..1 — rough confidence. v1 is rule-based so this is heuristic. */
  confidence: number;
  /** True when the action mutates state and must be approved before running. */
  requiresApproval: boolean;
  /** Composio toolkits the agent may use (composio intents only). */
  composioTools?: string[];
  /** Agent to assign for task creation. */
  agent?: TaskAgent;
  /** Route to push (navigation intents). */
  route?: VoiceRoute;
  /** Suggested task title for task/composio intents. */
  taskTitle?: string;
  /** Suggested task description/body. */
  taskDescription?: string;
  /** Original transcript that produced this intent. */
  transcript: string;
};

/** What the action router wants to happen. */
export type VoiceAction =
  | { type: 'navigate'; route: VoiceRoute; intent: VoiceIntent }
  | { type: 'queue-task'; intent: VoiceIntent }
  | { type: 'review-task'; intent: VoiceIntent }
  | { type: 'fallback'; transcript: string };

/** Result of submitting a voice task to the API. */
export type VoiceTaskResult = {
  ok: boolean;
  taskId?: string;
  taskTitle?: string;
  source?: 'server' | 'mock';
  warning?: string;
  error?: string;
};

/** Map a rich phase down to the legacy VoiceState for shared UI (M9A compat). */
export function phaseToLegacyState(phase: VoicePhase): VoiceState {
  switch (phase) {
    case 'listening':
      return 'listening';
    case 'transcribing':
    case 'interpreting':
    case 'needs_approval':
    case 'queued':
      return 'thinking';
    case 'completed':
      return 'idle';
    case 'error':
      return 'error';
    case 'unsupported':
      return 'unsupported';
    default:
      return 'idle';
  }
}
