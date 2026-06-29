/**
 * Memory adapter (M14A).
 *
 * v1: memory intents (e.g. "open memory", "neural index") route to the Memory
 * page. Future: run a read-only memory query inline (Qdrant/Obsidian) and return
 * results without a navigation.
 */
import type {
  OrchestratorIntent,
  OrchestratorOptions,
  OrchestratorRequest,
  OrchestratorResult,
  OrchestratorServices,
} from '../types';
import { executeNavigation } from './navigation';

export function executeMemory(
  intent: OrchestratorIntent,
  request: OrchestratorRequest,
  services: OrchestratorServices,
  options: OrchestratorOptions = {},
): OrchestratorResult {
  const withRoute: OrchestratorIntent =
    intent.payload.href && intent.payload.label
      ? intent
      : {
          ...intent,
          payload: { ...intent.payload, href: '/memory', label: 'Memory' },
        };
  return executeNavigation(withRoute, request, services, options);
}
