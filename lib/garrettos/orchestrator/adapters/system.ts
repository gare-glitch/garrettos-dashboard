/**
 * System adapter (M14A).
 *
 * v1: system intents (e.g. "open system", "show system health") route to the
 * System page. Future: surface live telemetry inline via the executor without a
 * navigation, by reading `/api/garrettos/health`.
 */
import type {
  OrchestratorIntent,
  OrchestratorOptions,
  OrchestratorRequest,
  OrchestratorResult,
  OrchestratorServices,
} from '../types';
import { executeNavigation } from './navigation';

export function executeSystem(
  intent: OrchestratorIntent,
  request: OrchestratorRequest,
  services: OrchestratorServices,
  options: OrchestratorOptions = {},
): OrchestratorResult {
  // Ensure a system route target if the resolver didn't provide one.
  const withRoute: OrchestratorIntent =
    intent.payload.href && intent.payload.label
      ? intent
      : {
          ...intent,
          payload: { ...intent.payload, href: '/system', label: 'System' },
        };
  return executeNavigation(withRoute, request, services, options);
}
