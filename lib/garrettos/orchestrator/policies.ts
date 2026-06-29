/**
 * Safety policy (M14A).
 *
 * Runs after the resolver and before the executor. It never executes anything —
 * it only adjusts an intent's `requiresApproval` flag and emits a PolicyDecision
 * describing whether the intent may proceed, must be approved, or is blocked.
 *
 * Rules:
 *  - Dangerous verbs (delete/wipe/drop/shutdown/…) ALWAYS require approval and
 *    are flagged `blocked`. If the resolver returned `unknown`, the intent is
 *    upgraded to a `task` so it can be queued as approval-required (never run).
 *  - Composio intents NEVER execute directly — always `requiresApproval: true`.
 *  - Mutating tasks keep `requiresApproval: true`; read-only tasks stay false.
 *  - Navigation/unknown are not approval-gated by the policy itself (the
 *    executor still honors the navigation confidence threshold).
 */
import type { OrchestratorIntent, OrchestratorRequest, PolicyDecision } from './types';

/** Verbs/phrases that indicate a destructive or high-blast-radius action. */
export const DANGEROUS_VERBS = [
  'delete',
  'remove',
  'rm ',
  'rm -',
  'drop',
  'wipe',
  'destroy',
  'shutdown',
  'reboot',
  'restart',
  'format',
  'overwrite',
  'truncate',
  'force push',
  'sudo ',
  'chmod -r',
  'kill -9',
  'drop database',
  'drop table',
  'factory reset',
] as const;

/** Read-only verbs — a task body starting with these does not require approval. */
export const READ_ONLY_TASK_VERBS = [
  'research',
  'review',
  'read',
  'look up',
  'lookup',
  'show',
  'list',
  'find',
  'search',
  'summarize',
  'summarise',
  'analyze',
  'analyse',
  'explain',
  'inspect',
  'audit',
  'describe',
  'check',
  'monitor',
  'investigate',
  'survey',
  'outline',
  'compare',
] as const;

export function isDangerous(transcript: string): boolean {
  const t = ` ${transcript.toLowerCase().trim()} `;
  return DANGEROUS_VERBS.some((v) => t.includes(v));
}

export function isReadOnlyTaskBody(body: string): boolean {
  const b = body.toLowerCase().trim();
  if (!b) return false;
  return READ_ONLY_TASK_VERBS.some((v) => b.startsWith(v));
}

/**
 * Apply the safety policy to an intent. Returns the (possibly amended) intent
 * and a decision. Never mutates the input intent.
 */
export function applyPolicy(
  intentIn: OrchestratorIntent,
  request: OrchestratorRequest,
): { intent: OrchestratorIntent; decision: PolicyDecision } {
  let intent = intentIn;
  let requiresApproval = intent.requiresApproval;
  let blocked = false;
  let reason: string | undefined;

  const dangerous = isDangerous(request.transcript);

  if (dangerous) {
    blocked = true;
    requiresApproval = true;
    reason = 'Dangerous action detected — requires explicit approval before execution.';
    // Upgrade an unrecognized dangerous request to an approval-required task so
    // it can be queued (never auto-run). e.g. "delete server files".
    if (intent.type === 'unknown' || intent.type === 'question') {
      const transcript = request.transcript;
      intent = {
        ...intent,
        type: 'task',
        action: intent.action ?? 'Dangerous task (approval required)',
        suggestedAgent: intent.suggestedAgent ?? 'openclaw',
        requiresApproval: true,
        payload: {
          ...intent.payload,
          taskTitle: transcript.slice(0, 80) || 'Dangerous task',
          taskDescription: `Dangerous action requested:\n"${transcript}"\n\nThis task was flagged by the safety policy and REQUIRES human approval before any execution. Do not run destructive operations without explicit confirmation.`,
          agent: intent.suggestedAgent ?? 'openclaw',
          transcript,
        },
      };
    }
  }

  // Composio never executes directly from the orchestrator.
  if (intent.type === 'composio') {
    requiresApproval = true;
    if (!reason) reason = 'Composio actions are external mutations — approval required.';
  }

  const decision: PolicyDecision = {
    allowed: !blocked || requiresApproval, // blocked-but-approval-gated is "allowed to ask"
    requiresApproval,
    blocked,
    reason,
  };

  return { intent: { ...intent, requiresApproval }, decision };
}
