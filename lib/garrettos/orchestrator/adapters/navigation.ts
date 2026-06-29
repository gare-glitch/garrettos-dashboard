/**
 * Navigation adapter (M14A).
 *
 * Executes navigation/memory/system intents by calling `services.navigate`. Auto
 * executes only when confidence >= the configured threshold (default 0.9) and the
 * intent is not approval-gated; otherwise it returns `needs_approval` so the UI
 * can ask the user to confirm.
 */
import type {
  OrchestratorIntent,
  OrchestratorOptions,
  OrchestratorRequest,
  OrchestratorResult,
  OrchestratorServices,
} from '../types';

export function executeNavigation(
  intent: OrchestratorIntent,
  request: OrchestratorRequest,
  services: OrchestratorServices,
  options: OrchestratorOptions = {},
): OrchestratorResult {
  const href = intent.payload.href as string | undefined;
  const label = intent.payload.label as string | undefined;
  if (!href || !label) {
    return { status: 'failed', message: 'Navigation intent missing a route.' };
  }
  const route = { href, label };
  const threshold = options.navigationConfidenceThreshold ?? 0.9;

  if (intent.requiresApproval && !request.userConfirmed) {
    return {
      status: 'needs_approval',
      message: `Navigate to ${label}?`,
      route,
      pendingIntent: intent,
    };
  }

  if (intent.confidence >= threshold) {
    services.navigate(href);
    return { status: 'completed', route, message: `Opened ${label}` };
  }

  return {
    status: 'needs_approval',
    message: `Navigate to ${label}? (low confidence — confirm)`,
    route,
    pendingIntent: intent,
  };
}
