/**
 * GarrettOS data contracts (M7).
 *
 * These are the typed shapes every provider (mock + server) and every API route
 * must return. They intentionally reuse the existing UI types from
 * components/garrettos/types.ts so panels can consume provider data with zero
 * visual changes.
 *
 * The single source of truth for what "live data" looks like lives here.
 */

import type {
  StatusTone,
  OsEvent,
  OsTask,
  OsAgentNode,
  OsAgentEdge,
  OsSystemNode,
  OsModelRoute,
  OsApiUsage,
  OsApproval,
  OsOpportunity,
} from '@/components/garrettos/types';
import type { AgentFleetRow } from '@/data/os-mock';

export type {
  StatusTone,
  OsEvent,
  OsTask,
  OsAgentNode,
  OsAgentEdge,
  OsSystemNode,
  OsModelRoute,
  OsApiUsage,
  OsApproval,
  OsOpportunity,
};

/** Where a payload came from — surfaced in the API `source` field and UI badges. */
export type DataSource = 'mock' | 'server' | 'stale';

/**
 * ProviderResult — the envelope every provider method returns and every API
 * route emits. `source` lets the UI label data as live/mock/stale; `warning`
 * is a human note when a live source failed and we fell back.
 */
export type ProviderResult<T> = {
  data: T;
  source: DataSource;
  /** Present only when live data was unavailable and mock/stale was returned. */
  warning?: string;
  /** ISO timestamp of when the payload was assembled. */
  fetchedAt: string;
};

// ---------------------------------------------------------------------------
// Entity contracts
// ---------------------------------------------------------------------------

/** A single health row (CPU, mem, model routing %, token usage, …). */
export type SystemHealth = {
  label: string;
  /** Display value, e.g. "12ms" / "GPT-4o (94%)". */
  value: string;
  tone: StatusTone;
};

/** A running agent session in the swarm. */
export type AgentSession = {
  id: string;
  name: string;
  model: string;
  status: 'active' | 'idle' | 'error' | 'wait';
  latency: string;
  uptime: string;
};

/** A queued/running/done task in the OpenClaw task queue. */
export type TaskRun = OsTask;

/** Aggregate memory index stats. */
export type MemoryStats = {
  totalChunks: number;
  newToday: number;
  sources: number;
  lastSync: string;
  decisions: number;
  todos: number;
  activeProjects: number;
};

/** A single memory chunk/event surfaced in the neural index timeline. */
export type MemoryEvent = {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  tags: string[];
  /** Optional richer fields used by the neural index table. */
  chunks?: number;
  relevance?: number;
};

/** Integration readiness row for the Settings page. */
export type IntegrationStatus = {
  name: string;
  env: string[];
  status: 'connected' | 'mocked' | 'missing env' | 'error';
  tone: StatusTone;
  /** Optional masked key preview — never the raw secret. */
  maskedKey?: string;
  lastUsed?: string;
};

/** A model routing row (provider/model/usage/latency/status). */
export type ModelRoute = OsModelRoute;

/** Per-service API usage with a 7-point trend. */
export type ApiUsage = OsApiUsage;

/** Garmin daily summary scores. */
export type GarminSummary = {
  bodyBattery: number;
  sleep: number;
  hrv: number;
  recovery: number;
  stress: number;
  trend: number[];
};

/** A revenue signal / opportunity. */
export type RevenueSignal = OsOpportunity & {
  /** Numeric confidence 0–100. */
  confidence: number;
};

/** Event stream item — reused 1:1 from the UI OsEvent. */
export type EventStreamItem = OsEvent;

/** OpenClaw opportunity — same as RevenueSignal under a domain name. */
export type OpenClawOpportunity = RevenueSignal;

// ---------------------------------------------------------------------------
// Aggregated page payloads (what each API route returns as `data`)
// ---------------------------------------------------------------------------

export type HealthPayload = {
  health: SystemHealth[];
  telemetry: {
    cpu: string;
    mem: string;
    lat: string;
    api: string;
    activeModel: string;
    agentStatus: string;
    activeAgents: number;
  };
};

export type AgentsPayload = {
  sessions: AgentSession[];
  fleet: AgentFleetRow[];
  graph: { nodes: OsAgentNode[]; edges: OsAgentEdge[] };
  approvals: OsApproval[];
};

export type TasksPayload = {
  tasks: TaskRun[];
};

export type MemoryPayload = {
  stats: MemoryStats;
  events: MemoryEvent[];
  decisions: { id: string; title: string; decided: string; rationale: string }[];
  todos: { id: string; title: string; due: string; priority: 'low' | 'medium' | 'high' }[];
  activeProjects: { id: string; title: string; chunks: number; updated: string }[];
};

export type IntegrationsPayload = {
  integrations: IntegrationStatus[];
  stats: { connected: number; mocked: number; missingEnv: number; total: number };
};

export type EventsPayload = {
  events: EventStreamItem[];
};

export type ModelsPayload = {
  routes: ModelRoute[];
  usage: ApiUsage[];
};
