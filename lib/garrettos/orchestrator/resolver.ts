/**
 * Intent resolver (M14A).
 *
 * Turns an OrchestratorRequest into an OrchestratorIntent. The DEFAULT resolver
 * is deterministic and reuses the M13 voice intent parser (`parseVoiceIntent`)
 * so existing behavior is preserved — no regression, no new hallucinations.
 *
 * The AI router hook is here: when `options.aiMode !== 'off'`, an AI resolver
 * can be tried first (future). For now `aiInterpretIntent` returns null for
 * every mode, so the deterministic parser stays the source of truth.
 */
import { parseVoiceIntent } from '@/lib/garrettos/voice/intent-parser';
import { aiInterpretIntent } from '@/lib/garrettos/voice/ai-intent-router';
import type { TaskAgent } from '@/lib/garrettos/types';
import type { VoiceIntent, VoiceRoute } from '@/lib/garrettos/voice/voice-types';
import type {
  OrchestratorIntent,
  OrchestratorIntentType,
  OrchestratorOptions,
  OrchestratorRequest,
} from './types';

/** Map a parsed VoiceIntent kind onto the richer orchestrator type. */
function mapKind(raw: VoiceIntent): OrchestratorIntentType {
  if (raw.kind === 'navigation') {
    const href = raw.route?.href ?? '';
    if (href === '/memory') return 'memory';
    if (href === '/system') return 'system';
    return 'navigation';
  }
  if (raw.kind === 'task') return 'task';
  if (raw.kind === 'composio') return 'composio';
  return 'unknown';
}

/** Build the adapter payload from a parsed intent. */
function buildPayload(raw: VoiceIntent): Record<string, unknown> {
  if (raw.kind === 'navigation' && raw.route) {
    return { href: raw.route.href, label: raw.route.label, transcript: raw.transcript };
  }
  if (raw.kind === 'task' || raw.kind === 'composio') {
    return {
      taskTitle: raw.taskTitle,
      taskDescription: raw.taskDescription,
      agent: raw.agent,
      composioTools: raw.composioTools,
      transcript: raw.transcript,
    };
  }
  return { transcript: raw.transcript };
}

/** Convert a parsed VoiceIntent into an OrchestratorIntent. */
export function fromVoiceIntent(raw: VoiceIntent): OrchestratorIntent {
  const type = mapKind(raw);
  return {
    type,
    confidence: raw.confidence,
    target:
      raw.route?.href ?? (raw.composioTools?.length ? raw.composioTools[0] : raw.agent),
    action: raw.label,
    requiresApproval: raw.requiresApproval,
    suggestedAgent: raw.agent as TaskAgent | undefined,
    composioTools: raw.composioTools,
    payload: buildPayload(raw),
    rawIntent: raw,
  };
}

/**
 * Resolve a request to an intent. Deterministic by default; AI mode is a
 * no-op placeholder that falls back to deterministic on null.
 */
export async function resolveIntent(
  request: OrchestratorRequest,
  options: OrchestratorOptions = {},
): Promise<OrchestratorIntent> {
  const deterministic = parseVoiceIntent(request.transcript);

  if (options.aiMode && options.aiMode !== 'off') {
    const ai = await aiInterpretIntent(request.transcript, {
      mode: options.aiMode,
    }).catch(() => null);
    if (ai) {
      // Future: validate + clamp requiresApproval, then return fromVoiceIntent(ai).
      return fromVoiceIntent(ai);
    }
  }

  return fromVoiceIntent(deterministic);
}

/** Derive a navigation route (href/label) from an intent, if it has one. */
export function intentRoute(intent: OrchestratorIntent): VoiceRoute | null {
  const href = intent.payload.href as string | undefined;
  const label = intent.payload.label as string | undefined;
  if (!href || !label) return null;
  return { href, label };
}
