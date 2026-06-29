/**
 * AI Intent Router — entry point (M14B).
 *
 * Pipeline:
 *   transcript → provider.interpret → validateAIIntent → aiJSONToIntent
 *
 * The router NEVER executes anything. It returns an `OrchestratorIntent`
 * (pure data) or `null` on any failure, in which case the deterministic
 * resolver (`parseVoiceIntent`) runs as the fallback. Execution + safety
 * policy happen AFTER this in the orchestrator core.
 *
 * Providers:
 *   - mock         — canned intents, no network (tests / dev)
 *   - litellm      — self-hosted LiteLLM proxy
 *   - openrouter   — openrouter.ai (ready; runs when key is set)
 *   - ollama       — local Ollama (ready; runs when server is up)
 */
import type { OrchestratorIntent } from '../types';
import { aiJSONToIntent, validateAIIntent } from './schema';
import { mockProvider } from './providers/mock';
import { litellmProvider } from './providers/litellm';
import { openrouterProvider } from './providers/openrouter';
import { ollamaProvider } from './providers/ollama';
import type { AIProvider, AIProviderConfig, AIProviderId } from './providers/types';
import { getAIIntentMode, type AIIntentMode, AI_INTENT_MODES } from './mode';

export { getAIIntentMode, AI_INTENT_MODES };
export type { AIIntentMode };

/**
 * Build the provider config for a mode from environment variables. Server-side.
 * Never reads a key value into the returned object — only the *name* of the env
 * var (`apiKeyEnv`), so the actual key stays inside the provider at call time.
 */
export function getAIProviderConfig(
  mode: AIIntentMode,
  env: NodeJS.ProcessEnv = process.env,
): AIProviderConfig {
  switch (mode) {
    case 'litellm':
      return {
        endpoint: env.LITELLM_BASE_URL?.toString().trim() || undefined,
        model: env.LITELLM_MODEL?.toString().trim() || undefined,
        apiKeyEnv: env.LITELLM_API_KEY ? 'LITELLM_API_KEY' : undefined,
      };
    case 'openrouter':
      return {
        endpoint: env.OPENROUTER_BASE_URL?.toString().trim() || undefined,
        model: env.OPENROUTER_MODEL?.toString().trim() || undefined,
        apiKeyEnv: env.OPENROUTER_API_KEY ? 'OPENROUTER_API_KEY' : undefined,
        extraHeaders: env.OPENROUTER_SITE_URL
          ? { 'X-Title': 'GarrettOS Orchestrator' }
          : undefined,
      };
    case 'ollama':
      return {
        endpoint: env.OLLAMA_BASE_URL?.toString().trim() || undefined,
        model: env.OLLAMA_MODEL?.toString().trim() || undefined,
      };
    case 'mock':
    case 'off':
    default:
      return {};
  }
}

/** Instantiate a provider for a mode, or null when there is none (off). */
export function createAIProvider(mode: AIIntentMode): AIProvider | null {
  const map: Partial<Record<AIProviderId, AIProvider>> = {
    mock: mockProvider,
    litellm: litellmProvider,
    openrouter: openrouterProvider,
    ollama: ollamaProvider,
  };
  return map[mode as AIProviderId] ?? null;
}

/**
 * Interpret a transcript with the selected AI provider.
 *
 * Returns a validated `OrchestratorIntent` or `null` (never throws). On any
 * transport / parse / schema failure — or when the mode is `off` — the caller
 * must fall back to the deterministic resolver.
 *
 * `source` is included for audit/debug: it records which provider produced the
 * intent and whether validation passed.
 */
export async function interpretWithAI(
  transcript: string,
  mode: AIIntentMode,
  config: AIProviderConfig = {},
): Promise<{ intent: OrchestratorIntent | null; source: string; warning?: string }> {
  if (mode === 'off') {
    return { intent: null, source: 'off' };
  }
  const provider = createAIProvider(mode);
  if (!provider) {
    return { intent: null, source: mode, warning: `No provider for mode ${mode}` };
  }

  let raw: unknown;
  try {
    raw = await provider.interpret(transcript, config);
  } catch (err) {
    return {
      intent: null,
      source: mode,
      warning: err instanceof Error ? `${provider.id}: ${err.message}` : `${provider.id} failed`,
    };
  }

  const v = validateAIIntent(raw);
  if (!v.ok || !v.intent) {
    return {
      intent: null,
      source: mode,
      warning: `schema validation failed: ${v.errors.join('; ')}`,
    };
  }
  return { intent: aiJSONToIntent(v.intent, transcript), source: provider.id };
}

export { validateAIIntent, aiJSONToIntent } from './schema';
export type { AIIntentJSON, AIIntentType, AIIntentValidation } from './schema';
export type { AIProvider, AIProviderConfig, AIProviderId } from './providers/types';
export { AI_SYSTEM_PROMPT } from './providers/types';
