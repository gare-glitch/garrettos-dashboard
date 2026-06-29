/**
 * Executor (M14A).
 *
 * Dispatches a (policy-gated) intent to the right adapter and returns its
 * OrchestratorResult. Adapters own the side-effects (via injected services);
 * the executor itself is pure dispatch.
 */
import type {
  OrchestratorIntent,
  OrchestratorOptions,
  OrchestratorRequest,
  OrchestratorResult,
  OrchestratorServices,
} from './types';
import { executeNavigation } from './adapters/navigation';
import { executeMemory } from './adapters/memory';
import { executeSystem } from './adapters/system';
import { executeTask } from './adapters/task';
import { executeComposio } from './adapters/composio';
import { executeFallback } from './adapters/fallback';

export async function executeIntent(
  intent: OrchestratorIntent,
  request: OrchestratorRequest,
  services: OrchestratorServices,
  options: OrchestratorOptions = {},
): Promise<OrchestratorResult> {
  switch (intent.type) {
    case 'navigation':
      return executeNavigation(intent, request, services, options);
    case 'memory':
      return executeMemory(intent, request, services, options);
    case 'system':
      return executeSystem(intent, request, services, options);
    case 'task':
      return executeTask(intent, request, services, options);
    case 'composio':
      return executeComposio(intent, request, services, options);
    case 'question':
    case 'unknown':
    default:
      return executeFallback(intent, request, services, options);
  }
}
