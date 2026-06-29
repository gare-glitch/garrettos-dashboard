/**
 * GarrettOS Central Orchestrator — core types (M14A).
 *
 * One pipeline every input method flows through:
 *   Input → Orchestrator → Resolver → Policy → Executor adapter → Result → UI
 *
 * The orchestrator is intentionally pure (no React, no DOM): it takes a typed
 * request plus a set of injected services and returns a typed result. React
 * wiring lives in components/garrettos/orchestrator.
 */
import type { TaskAgent, TaskCreateInput } from '@/lib/garrettos/types';
import type { VoiceIntent } from '@/lib/garrettos/voice/voice-types';

/** Where a request originated. */
export type OrchestratorSource =
  | 'voice'
  | 'command_palette'
  | 'dashboard'
  | 'api'
  | 'automation';

/** Broad category of a resolved intent. */
export type OrchestratorIntentType =
  | 'navigation'
  | 'task'
  | 'composio'
  | 'memory'
  | 'system'
  | 'question'
  | 'unknown';

/** Terminal status of an orchestrated request. */
export type OrchestratorStatus =
  | 'completed'
  | 'queued'
  | 'needs_approval'
  | 'failed'
  | 'unsupported';

/** A single inbound request from any input method. */
export interface OrchestratorRequest {
  id: string;
  source: OrchestratorSource;
  /** The raw user input (spoken or typed). */
  transcript: string;
  /** Current route path, used for context-aware resolution. */
  currentPage?: string;
  /** True when the user has explicitly confirmed a mutating action. */
  userConfirmed: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/** A resolved intent, ready for policy + execution. */
export interface OrchestratorIntent {
  type: OrchestratorIntentType;
  /** 0..1 — resolver confidence. Drives the navigation auto-execute threshold. */
  confidence: number;
  /** Route href, agent name, toolkit, etc. — depends on type. */
  target?: string;
  /** Human description of the intended action. */
  action?: string;
  requiresApproval: boolean;
  suggestedAgent?: TaskAgent;
  composioTools?: string[];
  /** Adapter-specific data (href/label, taskTitle/taskDescription, …). */
  payload: Record<string, unknown>;
  /** The original deterministic intent, kept for UI/legacy compatibility. */
  rawIntent?: VoiceIntent;
}

/** The outcome of executing (or gating) an intent. */
export interface OrchestratorResult {
  status: OrchestratorStatus;
  message: string;
  route?: { href: string; label: string };
  taskId?: string;
  taskTitle?: string;
  warning?: string;
  suggestions?: string[];
  /** Present when status === 'needs_approval' — re-execute with userConfirmed. */
  pendingIntent?: OrchestratorIntent;
  debug?: Record<string, unknown>;
}

/** The full orchestrator output for a request. */
export interface OrchestratorOutcome {
  id: string;
  intent: OrchestratorIntent;
  result: OrchestratorResult;
  auditId: string;
}

/** Result of the safety/policy check. */
export interface PolicyDecision {
  /** True when the intent may proceed (not hard-blocked). */
  allowed: boolean;
  requiresApproval: boolean;
  /** True when the intent was flagged dangerous and must not auto-execute. */
  blocked: boolean;
  reason?: string;
}

/** Injected execution services. The React layer builds these; the core stays pure. */
export interface OrchestratorServices {
  navigate(href: string): void;
  createTask(
    input: TaskCreateInput,
  ): Promise<{
    ok: boolean;
    taskId?: string;
    taskTitle?: string;
    source?: 'server' | 'mock';
    warning?: string;
    error?: string;
  }>;
  /** Open the command palette prefilled (used by the fallback adapter). */
  fallback(transcript: string): void;
}

/** Orchestrator runtime options. */
export interface OrchestratorOptions {
  /** AI interpretation mode (off by default; deterministic parser is fallback). */
  aiMode?: 'off' | 'litellm' | 'openrouter' | 'nemotron';
  /** Confidence required to auto-execute navigation (default 0.9). */
  navigationConfidenceThreshold?: number;
}

/** Build a request from a partial input, stamping id + timestamp. */
export function createRequest(
  partial: Pick<OrchestratorRequest, 'source' | 'transcript'> &
    Partial<Omit<OrchestratorRequest, 'id' | 'createdAt' | 'source' | 'transcript'>>,
): OrchestratorRequest {
  return {
    id: `orb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    userConfirmed: false,
    ...partial,
  };
}
