/**
 * Mock data provider (M7).
 *
 * Wraps the existing `data/os-mock.ts` and `data/integrations-mock.ts` datasets
 * into the typed provider contracts. This is the default provider and the
 * universal fallback — no UI ever loses its data because a live source is down.
 */

import {
  osShellTelemetry,
  osSystemHealth,
  osAgents,
  osAgentFleet,
  osApprovals,
  osTasks,
  osMemoryStats,
  osNeuralIndex,
  osMemoryDecisions,
  osMemoryTodos,
  osMemoryActiveProjects,
  osEvents,
  osModelRoutes,
  osApiUsage,
} from '@/data/os-mock';
import {
  integrationGroups,
  getIntegrationStatus,
} from '@/data/integrations-mock';
import { ok } from './providers';
import type { GarrettOSDataProvider } from './providers';
import type {
  HealthPayload,
  AgentsPayload,
  TasksPayload,
  MemoryPayload,
  IntegrationsPayload,
  EventsPayload,
  ModelsPayload,
  LogsPayload,
  TaskCreateInput,
  TaskCreateResult,
  AgentSession,
  SystemHealth,
  MemoryEvent,
  IntegrationStatus,
  TaskRun,
} from './types';

/**
 * In-memory store of tasks created via the mock provider (M10). These are
 * prepended to the seeded mock tasks so the queue reflects newly-created
 * work within a serverless request lifetime. The bridge is the durable
 * store when server mode is on; this is the mock fallback.
 */
const createdMockTasks: TaskRun[] = [];

let mockTaskSeq = 0;

function nextMockTaskId(): string {
  mockTaskSeq += 1;
  return `mock-task-${Date.now().toString(36)}-${mockTaskSeq}`;
}

export const mockProvider: GarrettOSDataProvider = {
  async getHealth() {
    const payload: HealthPayload = {
      health: osSystemHealth as SystemHealth[],
      telemetry: osShellTelemetry,
    };
    return ok(payload, 'mock');
  },

  async getAgents() {
    // Map the fleet rows into AgentSession rows (status widened to include 'wait').
    const sessions: AgentSession[] = osAgentFleet.map((f) => ({
      id: f.id,
      name: f.name,
      model: f.model,
      status: f.status,
      latency: f.latency,
      uptime: f.uptime,
    }));
    const payload: AgentsPayload = {
      sessions,
      fleet: osAgentFleet,
      graph: { nodes: osAgents.nodes, edges: osAgents.edges },
      approvals: osApprovals,
    };
    return ok(payload, 'mock');
  },

  async getTasks() {
    // Merge session-created mock tasks in front of the seeded mock tasks so
    // the queue reflects newly-created work (M10).
    const tasks: TaskRun[] = [...createdMockTasks, ...osTasks];
    return ok<TasksPayload>({ tasks }, 'mock');
  },

  async getMemory() {
    const events: MemoryEvent[] = osNeuralIndex.map((n) => ({
      id: n.id,
      title: n.title,
      source: n.source,
      timestamp: n.timestamp,
      tags: n.tags,
      chunks: n.chunks,
      relevance: n.relevance,
    }));
    const payload: MemoryPayload = {
      stats: osMemoryStats,
      events,
      decisions: osMemoryDecisions,
      todos: osMemoryTodos,
      activeProjects: osMemoryActiveProjects,
    };
    return ok(payload, 'mock');
  },

  async getIntegrations() {
    // Flatten the integration groups into IntegrationStatus rows.
    const flat: IntegrationStatus[] = integrationGroups.flatMap((g) =>
      g.integrations.map((i) => {
        const { status, tone } = getIntegrationStatus(i);
        return {
          name: i.name,
          env: i.env,
          status,
          tone,
          maskedKey: i.maskedKey ?? i.apiKey,
          lastUsed: i.lastUsed,
        };
      }),
    );
    let connected = 0,
      mocked = 0,
      missingEnv = 0;
    for (const i of flat) {
      if (i.status === 'connected') connected++;
      else if (i.status === 'mocked') mocked++;
      else if (i.status === 'missing env') missingEnv++;
    }
    const payload: IntegrationsPayload = {
      integrations: flat,
      stats: { connected, mocked, missingEnv, total: flat.length },
    };
    return ok(payload, 'mock');
  },

  async getEvents() {
    return ok<EventsPayload>({ events: osEvents }, 'mock');
  },

  async getModels() {
    return ok<ModelsPayload>({ routes: osModelRoutes, usage: osApiUsage }, 'mock');
  },

  async getLogs(scope: 'litellm' | 'bridge' | 'tmux' | 'all' = 'bridge') {
    // Synthetic mock log lines so the ops console renders without the bridge.
    const lines = [
      { id: 'm1', time: '14:24:02', level: 'INFO' as const, source: 'litellm', message: 'Routed request to claude-sonnet (1.2s)' },
      { id: 'm2', time: '14:23:58', level: 'INFO' as const, source: 'qdrant', message: 'Indexed 12 new vectors → collection: memory' },
      { id: 'm3', time: '14:23:41', level: 'WARN' as const, source: 'openclaw', message: 'Approval pending for VPS bridge deploy' },
      { id: 'm4', time: '14:23:12', level: 'INFO' as const, source: 'ollama', message: 'Loaded llama3.1:8b into VRAM (4.1 GB)' },
      { id: 'm5', time: '14:22:30', level: 'ERROR' as const, source: 'openclaw', message: 'Webhook timeout from GitHub (retrying)' },
    ];
    const filtered = scope === 'all' ? lines : lines.filter((l) => l.source === scope || (scope === 'bridge' && l.source !== 'litellm'));
    return ok<LogsPayload>({ scope, lines: filtered.length ? filtered : lines }, 'mock');
  },

  async createTask(input: TaskCreateInput) {
    // Sanitize the title into a safe id slug (no shell metacharacters).
    const slug = sanitizeTaskSlug(input.title);
    const id = `${slug}-${nextMockTaskId()}`;
    const now = new Date().toISOString();
    const task: TaskRun = {
      id,
      title: input.title.trim(),
      status: 'queued',
      agent: input.agent,
      priority: input.priority,
      description: input.description?.trim() || undefined,
      requiresApproval: input.requiresApproval,
      targetRepo: input.targetRepo?.trim() || undefined,
      createdAt: now,
      updated: now,
    };
    createdMockTasks.unshift(task);
    const result: TaskCreateResult = { task, source: 'mock' };
    return ok<TaskCreateResult>(result, 'mock');
  },
};

/** Reduce a free-text title to a safe filename-safe slug (used by mock + bridge). */
export function sanitizeTaskSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'task'
  );
}
