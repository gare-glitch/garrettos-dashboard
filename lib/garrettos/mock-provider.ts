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
import type { GarrettOSDataProvider } from './providers';
import { ok } from './providers';
import type {
  HealthPayload,
  AgentsPayload,
  TasksPayload,
  MemoryPayload,
  IntegrationsPayload,
  EventsPayload,
  ModelsPayload,
  AgentSession,
  SystemHealth,
  MemoryEvent,
  IntegrationStatus,
} from './types';

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
    return ok<TasksPayload>({ tasks: osTasks }, 'mock');
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
};
