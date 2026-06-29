/**
 * AI Intent Router — strict output schema (M14B).
 *
 * The AI is ONLY ever allowed to produce a JSON object matching `AIIntentJSON`.
 * It can never execute anything, never return prose, never return free-form
 * fields. `validateAIIntent` is the single chokepoint: anything that does not
 * pass validation is rejected and the deterministic resolver runs instead.
 *
 * This is the contract that keeps the AI layer safe:
 *   - AI output is a pure data description of intent.
 *   - The safety policy (`policies.ts`) re-runs AFTER the AI, so even a
 *     misbehaving model cannot bypass approval (dangerous verbs, Composio,
 *     mutating tasks all re-gated). The AI's `requiresApproval: false` is
 *     never trusted on its own.
 */
import type { TaskAgent } from '@/lib/garrettos/types';
import type { OrchestratorIntent, OrchestratorIntentType } from '../types';

/** Subset of OrchestratorIntentType the AI may emit. */
export type AIIntentType =
  | 'navigation'
  | 'task'
  | 'composio'
  | 'memory'
  | 'system'
  | 'question'
  | 'unknown';

/** The ONLY JSON shape an AI provider is allowed to return. */
export interface AIIntentJSON {
  type: AIIntentType;
  /** 0..1 confidence. Clamped during validation. */
  confidence: number;
  /** Route href, agent, or toolkit (depends on type). */
  target?: string;
  /** Short human description of the intended action. */
  action?: string;
  /** Whether the action is mutating/external/destructive. Re-checked by policy. */
  requiresApproval: boolean;
  suggestedAgent?: TaskAgent;
  /** Allowed toolkit slugs — never tokens/account ids. */
  composioTools?: string[];
  /** Constrained payload bag. Only these keys are honored. */
  payload?: {
    href?: string;
    label?: string;
    taskTitle?: string;
    taskDescription?: string;
    agent?: string;
    transcript?: string;
  };
}

/** Allowed toolkit slugs the AI may name. Anything else is dropped. */
export const ALLOWED_COMPOSIO_TOOLS = [
  'gmail',
  'google_calendar',
  'github',
  'slack',
  'notion',
] as const;

const ALLOWED_TYPES: readonly AIIntentType[] = [
  'navigation',
  'task',
  'composio',
  'memory',
  'system',
  'question',
  'unknown',
];

const ALLOWED_AGENTS: readonly TaskAgent[] = ['opencode', 'claude', 'openclaw', 'manual'];

export interface AIIntentValidation {
  ok: boolean;
  intent: AIIntentJSON | null;
  errors: string[];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asString(v: unknown, max = 280): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) : s;
}

function asNumber01(v: unknown): number | undefined {
  if (typeof v !== 'number' || Number.isNaN(v)) return undefined;
  return Math.max(0, Math.min(1, v));
}

function asTools(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== 'string') continue;
    const slug = item.trim().toLowerCase();
    if ((ALLOWED_COMPOSIO_TOOLS as readonly string[]).includes(slug) && !out.includes(slug)) {
      out.push(slug);
    }
  }
  return out.length ? out : undefined;
}

function asPayload(v: unknown): AIIntentJSON['payload'] | undefined {
  if (!isObject(v)) return undefined;
  const p: AIIntentJSON['payload'] = {};
  const href = asString(v.href);
  const label = asString(v.label, 120);
  const taskTitle = asString(v.taskTitle, 140);
  const taskDescription = asString(v.taskDescription, 4000);
  const agent = asString(v.agent, 40);
  const transcript = asString(v.transcript, 1000);
  if (href) p.href = href;
  if (label) p.label = label;
  if (taskTitle) p.taskTitle = taskTitle;
  if (taskDescription) p.taskDescription = taskDescription;
  if (agent) p.agent = agent;
  if (transcript) p.transcript = transcript;
  return Object.keys(p).length ? p : undefined;
}

/**
 * Validate and normalize raw AI output against the schema. Unknown keys are
 * dropped (not errors) so a chatty model can't smuggle extra fields through.
 * Type/confidence/requiresApproval are required and shape-checked strictly.
 */
export function validateAIIntent(raw: unknown): AIIntentValidation {
  const errors: string[] = [];

  if (!isObject(raw)) {
    return { ok: false, intent: null, errors: ['AI output is not a JSON object.'] };
  }

  const type = raw.type;
  if (typeof type !== 'string' || !(ALLOWED_TYPES as readonly string[]).includes(type)) {
    errors.push(`type must be one of ${ALLOWED_TYPES.join('|')}.`);
  }

  const confidence = asNumber01(raw.confidence);
  if (confidence === undefined) {
    errors.push('confidence must be a number 0..1.');
  }

  if (typeof raw.requiresApproval !== 'boolean') {
    errors.push('requiresApproval must be a boolean.');
  }

  if (errors.length) {
    return { ok: false, intent: null, errors };
  }

  const intent: AIIntentJSON = {
    type: type as AIIntentType,
    confidence: confidence as number,
    requiresApproval: raw.requiresApproval as boolean,
  };

  const target = asString(raw.target, 280);
  if (target) intent.target = target;

  const action = asString(raw.action, 140);
  if (action) intent.action = action;

  if (raw.suggestedAgent !== undefined && raw.suggestedAgent !== null) {
    const ag = typeof raw.suggestedAgent === 'string' ? raw.suggestedAgent.toLowerCase() : '';
    if ((ALLOWED_AGENTS as readonly string[]).includes(ag)) {
      intent.suggestedAgent = ag as TaskAgent;
    }
  }

  const tools = asTools(raw.composioTools);
  if (tools) intent.composioTools = tools;

  const payload = asPayload(raw.payload);
  if (payload) intent.payload = payload;

  return { ok: true, intent, errors: [] };
}

/**
 * Convert a validated AIIntentJSON into the orchestrator's OrchestratorIntent,
 * merging the original transcript into the payload for downstream adapters.
 * Navigation/memory/system intents get their href/label backfilled from
 * `target`/`action` so the navigation adapter works even if the model omitted
 * the payload keys.
 */
export function aiJSONToIntent(
  json: AIIntentJSON,
  transcript: string,
): OrchestratorIntent {
  const payload: Record<string, unknown> = { ...(json.payload ?? {}), transcript };

  // Backfill href/label for navigation-ish intents so adapters don't fail.
  if (
    (json.type === 'navigation' || json.type === 'memory' || json.type === 'system') &&
    json.target
  ) {
    if (!payload.href) payload.href = json.target;
    if (!payload.label) payload.label = json.action ?? json.target;
  }

  // Backfill task fields so the task/composio adapters have something to queue.
  if (json.type === 'task' || json.type === 'composio') {
    if (!payload.taskTitle) payload.taskTitle = transcript.slice(0, 80) || json.action || 'New task';
    if (!payload.taskDescription) {
      payload.taskDescription = `${transcript}\n\nSource: AI intent router (${json.type}).`;
    }
    if (!payload.agent && json.suggestedAgent) payload.agent = json.suggestedAgent;
    if (json.composioTools) payload.composioTools = json.composioTools;
  }

  return {
    type: json.type as OrchestratorIntentType,
    confidence: json.confidence,
    target: json.target,
    action: json.action,
    // The policy re-runs after this and will force approval for dangerous /
    // Composio / mutating intents — so this is a hint, not trusted.
    requiresApproval: json.requiresApproval,
    suggestedAgent: json.suggestedAgent,
    composioTools: json.composioTools,
    payload,
    // No rawIntent: AI intents are not derived from the deterministic parser.
  };
}
