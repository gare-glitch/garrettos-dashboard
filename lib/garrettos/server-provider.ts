/**
 * Server data provider (M7).
 *
 * Attempts to read live data from configured upstreams (OpenClaw VPS bridge,
 * LiteLLM, Qdrant, Valkey, Obsidian memory API, Garmin import URL). Every call
 * is wrapped so any failure (network, auth, timeout, parse) returns the mock
 * provider's data with `source: 'mock'`/`'stale'` and a human `warning`.
 *
 * Guarantees:
 *  - Never throws. A route handler calling this always gets a ProviderResult.
 *  - Never exposes secrets. Tokens are sent as Authorization headers only; they
 *    are never echoed into responses or warnings.
 *  - Never performs mutations — read-only GETs only.
 *  - Falls back to mock provider data on any error so the UI keeps rendering.
 */

import { mockProvider } from './mock-provider';
import type { GarrettOSDataProvider } from './providers';
import { ok, isServerBridgeConfigured } from './providers';
import type { ProviderResult, HealthPayload, AgentsPayload, TasksPayload, MemoryPayload, IntegrationsPayload, EventsPayload, ModelsPayload } from './types';

/** Fetch helper with a short timeout so a slow upstream can't hang a request. */
async function safeFetch(url: string, token?: string, timeoutMs = 2500): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}

/** Try a live upstream; on any failure, fall back to the mock result. */
async function withFallback<T>(
  live: () => Promise<ProviderResult<T> | null>,
  mock: () => Promise<ProviderResult<T>>,
  warningMsg: string,
): Promise<ProviderResult<T>> {
  try {
    const liveResult = await live();
    if (liveResult) return liveResult;
  } catch {
    /* fall through to mock */
  }
  const mockResult = await mock();
  return { ...mockResult, source: mockResult.source === 'server' ? 'stale' : mockResult.source, warning: warningMsg };
}

export const serverProvider: GarrettOSDataProvider = {
  async getHealth(): Promise<ProviderResult<HealthPayload>> {
    const bridgeUrl = process.env.OPENCLAW_VPS_BRIDGE_URL;
    const bridgeToken = process.env.OPENCLAW_VPS_BRIDGE_TOKEN;
    if (!bridgeUrl) {
      return withFallback(async () => null, () => mockProvider.getHealth(), 'VPS bridge URL not configured');
    }
    return withFallback(
      async () => {
        const res = await safeFetch(`${bridgeUrl}/health`, bridgeToken);
        if (!res) return null;
        const data = (await res.json()) as HealthPayload;
        return ok(data, 'server');
      },
      () => mockProvider.getHealth(),
      'VPS bridge unreachable — showing mock health',
    );
  },

  async getAgents(): Promise<ProviderResult<AgentsPayload>> {
    const bridgeUrl = process.env.OPENCLAW_VPS_BRIDGE_URL;
    const bridgeToken = process.env.OPENCLAW_VPS_BRIDGE_TOKEN;
    if (!bridgeUrl) {
      return withFallback(async () => null, () => mockProvider.getAgents(), 'VPS bridge URL not configured');
    }
    return withFallback(
      async () => {
        const res = await safeFetch(`${bridgeUrl}/agents`, bridgeToken);
        if (!res) return null;
        const data = (await res.json()) as AgentsPayload;
        return ok(data, 'server');
      },
      () => mockProvider.getAgents(),
      'VPS bridge unreachable — showing mock agents',
    );
  },

  async getTasks(): Promise<ProviderResult<TasksPayload>> {
    const bridgeUrl = process.env.OPENCLAW_VPS_BRIDGE_URL;
    const bridgeToken = process.env.OPENCLAW_VPS_BRIDGE_TOKEN;
    if (!bridgeUrl) {
      return withFallback(async () => null, () => mockProvider.getTasks(), 'VPS bridge URL not configured');
    }
    return withFallback(
      async () => {
        const res = await safeFetch(`${bridgeUrl}/tasks`, bridgeToken);
        if (!res) return null;
        const data = (await res.json()) as TasksPayload;
        return ok(data, 'server');
      },
      () => mockProvider.getTasks(),
      'VPS bridge unreachable — showing mock tasks',
    );
  },

  async getMemory(): Promise<ProviderResult<MemoryPayload>> {
    const memoryUrl = process.env.OBSIDIAN_MEMORY_API_URL;
    if (!memoryUrl) {
      return withFallback(async () => null, () => mockProvider.getMemory(), 'Obsidian memory API URL not configured');
    }
    return withFallback(
      async () => {
        const res = await safeFetch(`${memoryUrl}/memory`);
        if (!res) return null;
        const data = (await res.json()) as MemoryPayload;
        return ok(data, 'server');
      },
      () => mockProvider.getMemory(),
      'Obsidian memory API unreachable — showing mock memory',
    );
  },

  async getIntegrations(): Promise<ProviderResult<IntegrationsPayload>> {
    // Integrations status is derived from env presence, not an upstream call.
    // Delegate to mock provider, which reads process.env via getIntegrationStatus.
    return mockProvider.getIntegrations();
  },

  async getEvents(): Promise<ProviderResult<EventsPayload>> {
    const bridgeUrl = process.env.OPENCLAW_VPS_BRIDGE_URL;
    const bridgeToken = process.env.OPENCLAW_VPS_BRIDGE_TOKEN;
    if (!bridgeUrl) {
      return withFallback(async () => null, () => mockProvider.getEvents(), 'VPS bridge URL not configured');
    }
    return withFallback(
      async () => {
        const res = await safeFetch(`${bridgeUrl}/events`, bridgeToken);
        if (!res) return null;
        const data = (await res.json()) as EventsPayload;
        return ok(data, 'server');
      },
      () => mockProvider.getEvents(),
      'VPS bridge unreachable — showing mock events',
    );
  },

  async getModels(): Promise<ProviderResult<ModelsPayload>> {
    const litellmUrl = process.env.LITELLM_BASE_URL;
    if (!litellmUrl) {
      return withFallback(async () => null, () => mockProvider.getModels(), 'LiteLLM base URL not configured');
    }
    return withFallback(
      async () => {
        const res = await safeFetch(`${litellmUrl}/v1/routes`);
        if (!res) return null;
        const data = (await res.json()) as ModelsPayload;
        return ok(data, 'server');
      },
      () => mockProvider.getModels(),
      'LiteLLM gateway unreachable — showing mock model routes',
    );
  },
};

/** True if any live upstream env is set (used by routes to decide upstream vs mock). */
export const serverBridgeConfigured = isServerBridgeConfigured();
