/**
 * Provider interface + mode resolution (M7).
 *
 * `GarrettOSDataProvider` is the contract both mock and server providers
 * implement. Every method returns a ProviderResult envelope so callers always
 * know whether data is live, mock, or stale.
 *
 * Mode is selected via the `GARRETTOS_DATA_MODE` env var:
 *   - "mock"   (default when env missing) → mock provider
 *   - "server" → server provider, which calls upstreams when configured and
 *                falls back to mock on any failure
 */

import type {
  ProviderResult,
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
} from './types';

export type GarrettOSDataProvider = {
  getHealth(): Promise<ProviderResult<HealthPayload>>;
  getAgents(): Promise<ProviderResult<AgentsPayload>>;
  getTasks(): Promise<ProviderResult<TasksPayload>>;
  getMemory(): Promise<ProviderResult<MemoryPayload>>;
  getIntegrations(): Promise<ProviderResult<IntegrationsPayload>>;
  getEvents(): Promise<ProviderResult<EventsPayload>>;
  getModels(): Promise<ProviderResult<ModelsPayload>>;
  getLogs(scope?: 'litellm' | 'bridge' | 'tmux' | 'all'): Promise<ProviderResult<LogsPayload>>;
  /**
   * Create a queued task record (M10). Does NOT execute anything. Writes to
   * the bridge when in server mode, otherwise records locally as mock.
   */
  createTask(input: TaskCreateInput): Promise<ProviderResult<TaskCreateResult>>;
};

export type DataMode = 'mock' | 'server';

/** Resolve the active data mode from the environment (default: mock). */
export function resolveDataMode(env: NodeJS.ProcessEnv = process.env): DataMode {
  const raw = (env.GARRETTOS_DATA_MODE ?? '').trim().toLowerCase();
  return raw === 'server' ? 'server' : 'mock';
}

/** Whether any server-mode bridge env is configured (used by server provider). */
export function isServerBridgeConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.OPENCLAW_VPS_BRIDGE_URL ||
      env.LITELLM_BASE_URL ||
      env.QDRANT_URL ||
      env.VALKEY_URL ||
      env.OBSIDIAN_MEMORY_API_URL ||
      env.GARMIN_IMPORT_URL,
  );
}

/** Stamp a ProviderResult with the current ISO time. */
export function ok<T>(data: T, source: 'mock' | 'server', warning?: string): ProviderResult<T> {
  return { data, source, warning, fetchedAt: new Date().toISOString() };
}
