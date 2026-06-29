/**
 * Composio adapter (M14A).
 *
 * Composio intents are NEVER executed directly from the dashboard. They always
 * return `needs_approval` so the user can review the proposed external action.
 * On approval (`userConfirmed: true`), the adapter queues a task carrying the
 * requested `composio_tools` — the actual Composio call happens later inside a
 * supervised tmux agent run on the Hetzner VPS, never from the browser.
 */
import type { TaskAgent, TaskCreateInput } from '@/lib/garrettos/types';
import type {
  OrchestratorIntent,
  OrchestratorRequest,
  OrchestratorResult,
  OrchestratorServices,
} from '../types';

export function buildComposioTaskInput(
  intent: OrchestratorIntent,
  request: OrchestratorRequest,
): TaskCreateInput {
  const agent = (intent.payload.agent as TaskAgent | undefined) ?? intent.suggestedAgent ?? 'opencode';
  const title = (intent.payload.taskTitle as string | undefined) || request.transcript.slice(0, 80) || 'Composio task';
  const description =
    (intent.payload.taskDescription as string | undefined) ??
    `${request.transcript}\n\nSource: ${request.source}. Use Composio CLI tools.`;
  const composioTools = intent.payload.composioTools as string[] | undefined;

  return {
    title,
    description,
    agent,
    priority: 'medium',
    requiresApproval: true,
    composioTools: composioTools && composioTools.length > 0 ? composioTools : undefined,
    source: request.source === 'voice' ? 'voice' : 'manual',
    transcript: request.transcript,
    intent: intent.action,
  };
}

export async function executeComposio(
  intent: OrchestratorIntent,
  request: OrchestratorRequest,
  services: OrchestratorServices,
  _options?: unknown,
): Promise<OrchestratorResult> {
  if (!request.userConfirmed) {
    return {
      status: 'needs_approval',
      message: `Composio action requires approval: ${intent.action ?? 'external action'}`,
      pendingIntent: intent,
      suggestions: ['Approve to queue a supervised Composio task', 'Edit in Task Composer to adjust'],
    };
  }

  const input = buildComposioTaskInput(intent, request);
  const res = await services.createTask(input);
  if (res.ok) {
    return {
      status: 'queued',
      taskId: res.taskId,
      taskTitle: res.taskTitle,
      message: `Queued Composio task: ${res.taskTitle ?? res.taskId ?? 'created'}`,
      warning: res.warning,
      debug: { source: res.source, composioTools: input.composioTools },
    };
  }
  return {
    status: 'failed',
    message: res.error ?? 'Composio task creation failed — try again or use the Task Composer.',
  };
}
