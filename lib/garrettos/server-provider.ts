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
 *  - Normalizes the bridge envelope so the route returns a SINGLE
 *    ProviderResult, never a double-nested one. The bridge already returns
 *    { data, source, fetchedAt }; we unwrap `.data` and re-stamp our own
 *    envelope so callers always see exactly one layer.
 */

import { mockProvider } from './mock-provider';
import type { GarrettOSDataProvider } from './providers';
import { ok, isServerBridgeConfigured } from './providers';
import type { ProviderResult, HealthPayload, AgentsPayload, TasksPayload, MemoryPayload, IntegrationsPayload, EventsPayload, ModelsPayload, LogsPayload } from './types';

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

/**
 * Unwrap a bridge response into the inner payload, defending against any level
 * of accidental envelope nesting.
 *
 * A bridge ProviderResult envelope is `{ data, source, fetchedAt, warning? }`.
 * We detect an envelope STRICTLY by the presence of `data` AND `source` AND
 * `fetchedAt` (a real payload never has all three), then recurse into `.data`
 * up to a small depth so a double- or triple-nested envelope collapses to the
 * real payload. If no envelope is detected, the value is returned as-is.
 */
function unwrapBridge<T>(json: unknown, depth = 0): T | null {
  if (json === null || json === undefined) return null;
  if (typeof json !== 'object') return null;

  const obj = json as Record<string, unknown>;
  const isEnvelope =
    'data' in obj &&
    'source' in obj &&
    'fetchedAt' in obj &&
    typeof obj.fetchedAt === 'string';

  if (isEnvelope && depth < 3) {
    return unwrapBridge<T>(obj.data, depth + 1);
  }

  // No envelope detected → this is the payload (or a bare upstream payload).
  if (typeof json === 'object') return json as T;
  return null;
}

/** Try a live upstream; on any failure, fall back to the mock result. */
async function withFallback<T>(
  live: () => Promise<T | null>,
  mock: () => Promise<ProviderResult<T>>,
  warningMsg: string,
): Promise<ProviderResult<T>> {
  try {
    const liveData = await live();
    if (liveData !== null && liveData !== undefined) {
      return ok(liveData, 'server');
    }
  } catch {
    /* fall through to mock */
  }
  const mockResult = await mock();
  return {
    ...mockResult,
    source: mockResult.source === 'server' ? 'stale' : mockResult.source,
    warning: warningMsg,
  };
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
        const json = await res.json();
        return unwrapBridge<HealthPayload>(json);
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
        const json = await res.json();
        return unwrapBridge<AgentsPayload>(json);
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
        const json = await res.json();
        return unwrapBridge<TasksPayload>(json);
      },
      () => mockProvider.getTasks(),
      'VPS bridge unreachable — showing mock tasks',
    );
  },

  async getMemory(): Promise<ProviderResult<MemoryPayload>> {
    // Prefer the dedicated Obsidian memory API if set; otherwise fall back to
    // the VPS bridge's /memory endpoint if the bridge is configured.
    const memoryUrl = process.env.OBSIDIAN_MEMORY_API_URL;
    const bridgeUrl = process.env.OPENCLAW_VPS_BRIDGE_URL;
    const bridgeToken = process.env.OPENCLAW_VPS_BRIDGE_TOKEN;
    if (memoryUrl) {
      return withFallback(
        async () => {
          const res = await safeFetch(`${memoryUrl}/memory`);
          if (!res) return null;
          const json = await res.json();
          return unwrapBridge<MemoryPayload>(json);
        },
        () => mockProvider.getMemory(),
        'Obsidian memory API unreachable — showing mock memory',
      );
    }
    if (bridgeUrl) {
      return withFallback(
        async () => {
          const res = await safeFetch(`${bridgeUrl}/memory`, bridgeToken);
          if (!res) return null;
          const json = await res.json();
          return unwrapBridge<MemoryPayload>(json);
        },
        () => mockProvider.getMemory(),
        'VPS bridge memory unreachable — showing mock memory',
      );
    }
    return withFallback(async () => null, () => mockProvider.getMemory(), 'No memory source configured');
  },

  async getIntegrations(): Promise<ProviderResult<IntegrationsPayload>> {
    // Prefer the bridge's /integrations reachability probes when configured;
    // otherwise derive from env presence via the mock provider.
    const bridgeUrl = process.env.OPENCLAW_VPS_BRIDGE_URL;
    const bridgeToken = process.env.OPENCLAW_VPS_BRIDGE_TOKEN;
    if (!bridgeUrl) {
      return mockProvider.getIntegrations();
    }
    return withFallback(
      async () => {
        const res = await safeFetch(`${bridgeUrl}/integrations`, bridgeToken);
        if (!res) return null;
        const json = await res.json();
        return unwrapBridge<IntegrationsPayload>(json);
      },
      () => mockProvider.getIntegrations(),
      'VPS bridge integrations unreachable — showing env-derived status',
    );
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
        const json = await res.json();
        return unwrapBridge<EventsPayload>(json);
      },
      () => mockProvider.getEvents(),
      'VPS bridge unreachable — showing mock events',
    );
  },

  async getModels(): Promise<ProviderResult<ModelsPayload>> {
    const litellmUrl = process.env.LITELLM_BASE_URL;
    const bridgeUrl = process.env.OPENCLAW_VPS_BRIDGE_URL;
    const bridgeToken = process.env.OPENCLAW_VPS_BRIDGE_TOKEN;
    if (litellmUrl) {
      return withFallback(
        async () => {
          const res = await safeFetch(`${litellmUrl}/v1/routes`);
          if (!res) return null;
          const json = await res.json();
          return unwrapBridge<ModelsPayload>(json);
        },
        () => mockProvider.getModels(),
        'LiteLLM gateway unreachable — showing mock model routes',
      );
    }
    if (bridgeUrl) {
      return withFallback(
        async () => {
          const res = await safeFetch(`${bridgeUrl}/models`, bridgeToken);
          if (!res) return null;
          const json = await res.json();
          return unwrapBridge<ModelsPayload>(json);
        },
        () => mockProvider.getModels(),
        'VPS bridge models unreachable — showing mock model routes',
      );
    }
    return withFallback(async () => null, () => mockProvider.getModels(), 'No model source configured');
  },

  async getLogs(scope: 'litellm' | 'bridge' | 'tmux' | 'all' = 'bridge'): Promise<ProviderResult<LogsPayload>> {
    const bridgeUrl = process.env.OPENCLAW_VPS_BRIDGE_URL;
    const bridgeToken = process.env.OPENCLAW_VPS_BRIDGE_TOKEN;
    if (!bridgeUrl) {
      return withFallback(async () => null, () => mockProvider.getLogs(scope), 'VPS bridge URL not configured');
    }
    return withFallback(
      async () => {
        const res = await safeFetch(`${bridgeUrl}/logs?scope=${encodeURIComponent(scope)}`, bridgeToken);
        if (!res) return null;
        const json = await res.json();
        return unwrapBridge<LogsPayload>(json);
      },
      () => mockProvider.getLogs(scope),
      'VPS bridge logs unreachable — showing mock logs',
    );
  },
};

/** True if any live upstream env is set (used by routes to decide upstream vs mock). */
export const serverBridgeConfigured = isServerBridgeConfigured();
