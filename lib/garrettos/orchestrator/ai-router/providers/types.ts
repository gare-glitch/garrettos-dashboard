/**
 * AI provider interface + shared prompt (M14B).
 *
 * A provider ONLY turns a transcript into raw JSON (the `AIIntentJSON` shape).
 * It never executes, never reads memory, never returns prose. Validation +
 * safety policy + execution all happen AFTER this, in the orchestrator core.
 */
export type AIProviderId = 'mock' | 'litellm' | 'openrouter' | 'ollama';

export interface AIProviderConfig {
  /** Base URL of the upstream API (no trailing slash). */
  endpoint?: string;
  /** Model id to request. */
  model?: string;
  /** Name of the env var holding the API key (never the key itself). */
  apiKeyEnv?: string;
  /** Request timeout in ms. */
  timeoutMs?: number;
  /** Optional extra headers (e.g. OpenRouter HTTP-Referer). */
  extraHeaders?: Record<string, string>;
}

export interface AIProvider {
  id: AIProviderId;
  /**
   * Interpret a transcript. Returns the raw parsed JSON (validated later).
   * MUST throw on any transport/parse failure — the caller falls back to
   * deterministic on throw, so providers never need to return null.
   */
  interpret(transcript: string, config: AIProviderConfig): Promise<unknown>;
}

/**
 * The strict system prompt sent to every LLM provider. It pins the model to the
 * AIIntentJSON schema, forbids prose/markdown, and tells it the safety rules.
 * The model is instructed it is an intent *descriptor*, not an executor.
 */
export const AI_SYSTEM_PROMPT = `You are the GarrettOS intent resolver. You ONLY describe the user's intent as a single JSON object. You NEVER execute anything, NEVER run commands, NEVER call tools, NEVER include prose or markdown.

Output exactly ONE JSON object matching this schema and nothing else:
{
  "type": "navigation" | "task" | "composio" | "memory" | "system" | "question" | "unknown",
  "confidence": number between 0 and 1,
  "target": string (optional; route href, agent, or toolkit),
  "action": string (optional; short human description),
  "requiresApproval": boolean,
  "suggestedAgent": "opencode" | "claude" | "openclaw" | "manual" (optional),
  "composioTools": string[] (optional; allowed: gmail, google_calendar, github, slack, notion),
  "payload": { "href": string, "label": string, "taskTitle": string, "taskDescription": string, "agent": string, "transcript": string } (optional; only the relevant fields)
}

Rules:
- type "memory" routes to /memory; type "system" routes to /system; other page jumps are type "navigation" with payload.href and payload.label.
- type "task" is queued background AI work (opencode/claude/openclaw). type "composio" is an external action via a connected app (gmail/github/etc).
- Set requiresApproval=true for ANY mutating, external, destructive, or send/create/delete action. When unsure, set requiresApproval=true.
- For navigation, requiresApproval is usually false.
- If you cannot confidently classify, return {"type":"unknown","confidence":0,"requiresApproval":false}.
- Never include keys outside the schema. Never wrap the JSON in backticks or text.`;
