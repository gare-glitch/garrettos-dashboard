/**
 * GarrettOS Central Orchestrator — entry point (M14A).
 *
 * The single pipeline every input method flows through:
 *
 *   Request → resolveIntent → applyPolicy → executeIntent → Result
 *
 * Pure: no React, no DOM. Side-effects happen only through the injected
 * `OrchestratorServices`. The deterministic parser is the default resolver
 * (preserving existing M13 behavior); the AI router is a placeholder hook.
 */
import { resolveIntent } from './resolver';
import { applyPolicy } from './policies';
import { executeIntent } from './executor';
import type {
  OrchestratorOptions,
  OrchestratorOutcome,
  OrchestratorRequest,
  OrchestratorServices,
} from './types';

/**
 * Run a request through the full pipeline. Always resolves — never throws — so
 * callers can `await` without a try/catch and trust the typed result.
 */
export async function runOrchestrator(
  request: OrchestratorRequest,
  services: OrchestratorServices,
  options: OrchestratorOptions = {},
): Promise<OrchestratorOutcome> {
  let result;
  try {
    const intent = await resolveIntent(request, options);
    const { intent: gatedIntent, decision } = applyPolicy(intent, request);

    // Hard-blocked dangerous intents that were NOT upgraded to a task still
    // surface as needs_approval with the policy reason — never auto-execute.
    if (decision.blocked && gatedIntent.type === 'unknown') {
      result = {
        status: 'needs_approval' as const,
        message: decision.reason ?? 'Dangerous action — approval required.',
        pendingIntent: gatedIntent,
        debug: { decision },
      };
    } else {
      result = await executeIntent(gatedIntent, request, services, options);
      // Attach the policy decision for observability without overwriting status.
      result = { ...result, debug: { ...result.debug, decision } };
    }

    return {
      id: request.id,
      intent: gatedIntent,
      result,
      auditId: request.id,
    };
  } catch (err) {
    result = {
      status: 'failed' as const,
      message: err instanceof Error ? `Orchestration error: ${err.message}` : 'Orchestration error.',
    };
    return {
      id: request.id,
      intent: {
        type: 'unknown',
        confidence: 0,
        requiresApproval: false,
        payload: { transcript: request.transcript },
      },
      result,
      auditId: request.id,
    };
  }
}

export { resolveIntent } from './resolver';
export { applyPolicy, isDangerous, isReadOnlyTaskBody, DANGEROUS_VERBS, READ_ONLY_TASK_VERBS } from './policies';
export { executeIntent } from './executor';
export { createRequest } from './types';
export type * from './types';
