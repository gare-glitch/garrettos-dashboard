/**
 * Intent resolver (M14A → M14B).
 *
 * Turns an OrchestratorRequest into an OrchestratorIntent. Two resolvers:
 *
 *   1. AI resolver (optional) — runs first when `options.aiMode !== 'off'` and
 *      an `aiResolve` function is injected. It returns a *validated*
 *      OrchestratorIntent (pure data — the AI never executes anything). The
 *      React layer wires `aiResolve` to POST /api/garrettos/ai-intent, which
 *      runs the selected provider server-side and validates against the strict
 *      AIIntentJSON schema.
 *
 *   2. Deterministic resolver (default + fallback) — reuses the M13 voice
 *      intent parser (`parseVoiceIntent`). ALWAYS available. Runs whenever the
 *      AI resolver is disabled, returns null, or throws — so behavior never
 *      degrades below the rule-based parser.
 *
 * Either way the output is a pure OrchestratorIntent; the safety policy
 * (`policies.ts`) runs AFTER this and re-gates dangerous/Composio/mutating
 * intents regardless of what the resolver said.
 */
import { parseVoiceIntent } from '@/lib/garrettos/voice/intent-parser';
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
 * Resolve a request to an intent.
 *
 * AI-first when enabled + injected; deterministic otherwise. The AI branch is
 * fully wrapped so any throw/null falls through to the deterministic parser.
 */
export async function resolveIntent(
  request: OrchestratorRequest,
  options: OrchestratorOptions = {},
): Promise<OrchestratorIntent> {
  if (options.aiMode && options.aiMode !== 'off' && options.aiResolve) {
    const ai = await options.aiResolve(request.transcript).catch(() => null);
    if (ai) {
      return ai;
    }
  }
  return fromVoiceIntent(parseVoiceIntent(request.transcript));
}

/** Derive a navigation route (href/label) from an intent, if it has one. */
export function intentRoute(intent: OrchestratorIntent): VoiceRoute | null {
  const href = intent.payload.href as string | undefined;
  const label = intent.payload.label as string | undefined;
  if (!href || !label) return null;
  return { href, label };
}
