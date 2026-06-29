/**
 * GarrettOS Voice Action Router (M13).
 *
 * Converts a parsed VoiceIntent into a typed VoiceAction. This is the single
 * place that decides *what should happen* — and it never performs a side-effect
 * itself. Navigation routes immediately (read-only). Read-only queries become a
 * review task. Mutating intents become a queued task that requires approval.
 * Unknown intents fall back to the command palette with the transcript
 * prefilled, so the user is never left with a dead-end.
 */
import type { VoiceAction, VoiceIntent } from './voice-types';

export function routeVoiceIntent(intent: VoiceIntent): VoiceAction {
  switch (intent.kind) {
    case 'navigation':
      if (intent.route) {
        return { type: 'navigate', route: intent.route, intent };
      }
      return { type: 'fallback', transcript: intent.transcript };

    case 'composio':
      // Read-only Composio queries (list repos, read emails, search drive) become
      // a review task. Mutating ones (draft/send email, create issue) require
      // approval and are queued.
      return intent.requiresApproval
        ? { type: 'queue-task', intent }
        : { type: 'review-task', intent };

    case 'task':
      // Agent tasks: approval-gated unless the body was clearly read-only.
      return intent.requiresApproval
        ? { type: 'queue-task', intent }
        : { type: 'review-task', intent };

    case 'unknown':
    default:
      return { type: 'fallback', transcript: intent.transcript };
  }
}

/** Human label for an action, shown in the action preview. */
export function actionLabel(action: VoiceAction): string {
  switch (action.type) {
    case 'navigate':
      return `Open ${action.route.label}`;
    case 'queue-task':
      return 'Queue task (needs approval)';
    case 'review-task':
      return 'Create review task';
    case 'fallback':
      return 'Open command palette';
  }
}
