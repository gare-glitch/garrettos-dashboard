/**
 * Task adapter (M14A).
 *
 * Creates a queued task record via `services.createTask` (which POSTs to
 * /api/garrettos/tasks/create). Read-only tasks (research/review/etc.) auto-queue
 * without approval; mutating tasks return `needs_approval` until the user
 * confirms, at which point the adapter is re-invoked with `userConfirmed: true`.
 *
 * The adapter never executes the task itself — it only records it. Execution is
 * the job of the Hetzner loop daemon (M11).
 */
import type { TaskAgent, TaskCreateInput } from '@/lib/garrettos/types';
import type {
  OrchestratorIntent,
  OrchestratorRequest,
  OrchestratorResult,
  OrchestratorServices,
} from '../types';
import { isReadOnlyTaskBody } from '../policies';

/** Build a TaskCreateInput from a resolved intent + request. */
export function buildTaskInput(
  intent: OrchestratorIntent,
  request: OrchestratorRequest,
): TaskCreateInput {
  const agent = (intent.payload.agent as TaskAgent | undefined) ?? intent.suggestedAgent ?? 'openclaw';
  const title = (intent.payload.taskTitle as string | undefined) || request.transcript.slice(0, 80) || 'New task';
  const description =
    (intent.payload.taskDescription as string | undefined) ??
    `${request.transcript}\n\nSource: ${request.source}.`;
  const composioTools = intent.payload.composioTools as string[] | undefined;

  return {
    title,
    description,
    agent,
    priority: 'medium',
    requiresApproval: intent.requiresApproval,
    composioTools: composioTools && composioTools.length > 0 ? composioTools : undefined,
    source: request.source === 'voice' ? 'voice' : 'manual',
    transcript: request.transcript,
    intent: intent.action,
  };
}

export async function executeTask(
  intent: OrchestratorIntent,
  request: OrchestratorRequest,
  services: OrchestratorServices,
  _options?: unknown,
): Promise<OrchestratorResult> {
  // Read-only tasks (body starts with a read-only verb) can auto-queue.
  const body = (intent.payload.taskDescription as string | undefined) ?? '';
  const readOnly = isReadOnlyTaskBody(body) && !intent.requiresApproval;

  if (intent.requiresApproval && !request.userConfirmed && !readOnly) {
    return {
      status: 'needs_approval',
      message: intent.action
        ? `${intent.action} — approval required`
        : 'This task requires approval before it is queued.',
      pendingIntent: intent,
    };
  }

  const input = buildTaskInput(intent, request);
  const res = await services.createTask(input);
  if (res.ok) {
    return {
      status: 'queued',
      taskId: res.taskId,
      taskTitle: res.taskTitle,
      message: `Queued task: ${res.taskTitle ?? res.taskId ?? 'created'}`,
      warning: res.warning,
      debug: { source: res.source },
    };
  }
  return {
    status: 'failed',
    message: res.error ?? 'Task creation failed — try again or use the Task Composer.',
  };
}
