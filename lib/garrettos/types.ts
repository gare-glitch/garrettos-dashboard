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
export type TaskRun = OsTask & {
  /** ISO/relative time the task was last updated (bridge frontmatter). */
  updated?: string;
  /** Path to the task's log file, if the bridge surfaced one. */
  logPath?: string;
  /** Suggested next action for a blocked task (bridge frontmatter). */
  nextAction?: string;
  /** Free-text description/body of the task (M10 composer). */
  description?: string;
  /** Whether the task requires human approval before execution (M10). */
  requiresApproval?: boolean;
  /** Target repo/project path the task operates on (M10). */
  targetRepo?: string;
  /** Composio toolkits the agent may use during the run (M12B). */
  composioTools?: string[];
  /** ISO timestamp the task was created (M10). */
  createdAt?: string;
  /** tmux session name the daemon launched the agent in (M11). */
  tmuxSession?: string;
  /** Last ~20 lines of the agent log, sanitized (M11 bridge). */
  lastLogTail?: string;
  /** True if the task currently holds a lock or has a live tmux session (M11). */
  locked?: boolean;
  /** ISO timestamp the daemon started the task (M11). */
  startedAt?: string;
  /** ISO timestamp the daemon marked the task finished (M11). */
  completedAt?: string;
  /** Path to the generated context bundle file (M12). */
  contextPath?: string;
  /** Size of the context bundle in bytes (M12). */
  contextBytes?: number;
  /** Labels of the memory/project sources injected into the prompt (M12). */
  contextSources?: string[];
  /** True if at least one non-task context source was injected (M12). */
  memoryInjected?: boolean;
  /** Short sanitized preview of the context bundle (M12 bridge). */
  contextPreview?: string;
};

/** Allowed agents for task creation. */
export type TaskAgent = 'opencode' | 'claude' | 'openclaw' | 'manual';

/** Input shape for creating a queued task record (M10). No execution. */
export type TaskCreateInput = {
  title: string;
  description?: string;
  agent: TaskAgent;
  priority: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  targetRepo?: string;
  /** Composio toolkits the agent may use during the run (M12B). */
  composioTools?: string[];
};

/** Result of creating a task — the persisted TaskRun plus its source. */
export type TaskCreateResult = {
  task: TaskRun;
  /** Where the record was written: 'server' (bridge) or 'mock' (local). */
  source: 'server' | 'mock';
};

/** Payload envelope for the create-task route. */
export type TaskCreatePayload = TaskCreateResult;

/** A tmux session surfaced by the bridge. */
export type TmuxSession = {
  name: string;
  attached: boolean;
  status: 'active' | 'idle';
  last_seen?: string;
  command?: string;
  windows?: string;
};

/** Per-service agent health booleans (M9 ops center). */
export type AgentHealth = {
  opencode: boolean;
  claude: boolean;
  openclaw: boolean;
  litellm: boolean;
  ollama: boolean;
  valkey: boolean;
  qdrant: boolean;
  tmux: boolean;
  docker: boolean;
};

/** A sanitized log line from the bridge /logs endpoint. */
export type LogLine = {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
};

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

/** Event stream item — reused 1:1 from the UI OsEvent, plus an optional
 * scope tag for the ops-center filter (all/errors/agents/system). */
export type EventStreamItem = OsEvent & {
  scope?: 'all' | 'errors' | 'agents' | 'system';
};

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
  /** Optional agent-health block surfaced by the bridge (M9). */
  agent_health?: AgentHealth;
};

export type AgentsPayload = {
  sessions: AgentSession[];
  fleet: AgentFleetRow[];
  graph: { nodes: OsAgentNode[]; edges: OsAgentEdge[] };
  approvals: OsApproval[];
  /** Optional tmux sessions surfaced by the bridge (M9). */
  tmux_sessions?: TmuxSession[];
  /** Optional detected processes surfaced by the bridge (M9). */
  detected_processes?: { name: string; status: string; pids: number; last_seen: string }[];
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
  /** Composio CLI readiness (M12B). Omitted in mock mode. */
  composio?: ComposioStatus;
};

/** Composio CLI readiness probe result (M12B). Read-only — never contains tokens. */
export type ComposioStatus = {
  installed: boolean;
  authenticated: boolean;
  version: string;
  /** CLI mode is the recommended/supported mode for agent runs. */
  cliMode: boolean;
  /** MCP mode is optional/dev-only. */
  mcpMode: boolean;
  connectedAccounts: string[];
  /** Richer per-connection objects with only safe fields (toolkit, status, wordId?). */
  connections?: ComposioConnection[];
  toolkits: string[];
  status: string;
  tone: StatusTone;
  note: string;
};

/** A single Composio connection — only safe fields are surfaced (M12B bugfix). */
export type ComposioConnection = {
  toolkit: string;
  status: string;
  wordId?: string;
  alias?: string;
};

export type EventsPayload = {
  events: EventStreamItem[];
};

export type ModelsPayload = {
  routes: ModelRoute[];
  usage: ApiUsage[];
};

/** Payload for GET /api/garrettos/logs (M9). */
export type LogsPayload = {
  scope: 'litellm' | 'bridge' | 'tmux' | 'all';
  lines: LogLine[];
};
