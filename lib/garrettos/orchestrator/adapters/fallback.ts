/**
 * Fallback adapter (M14A).
 *
 * Handles unrecognized / question intents. It opens the command palette
 * prefilled with the transcript (so the user can pick a real command) and
 * returns `unsupported` with a few suggestions. The UI stays stable — nothing
 * navigates or mutates.
 */
import type {
  OrchestratorIntent,
  OrchestratorOptions,
  OrchestratorRequest,
  OrchestratorResult,
  OrchestratorServices,
} from '../types';

const SUGGESTIONS = [
  'open memory',
  'open system',
  'show OpenClaw',
  'ask OpenCode to research…',
  'create a task to…',
  'draft an email to…',
];

export function executeFallback(
  _intent: OrchestratorIntent,
  request: OrchestratorRequest,
  services: OrchestratorServices,
  _options?: OrchestratorOptions,
): OrchestratorResult {
  services.fallback(request.transcript);
  return {
    status: 'unsupported',
    message: 'Not recognized — opened the command palette.',
    suggestions: SUGGESTIONS,
  };
}
