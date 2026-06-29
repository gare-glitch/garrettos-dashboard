/**
 * AI intent mode (M14B).
 *
 * Kept in its own module with NO provider imports, so the client bundle can
 * import `getAIIntentMode` / `AIIntentMode` without pulling the server-side
 * provider implementations (litellm/openrouter/ollama) into the browser.
 */
/** AI intent mode. `off` keeps the deterministic parser as the only resolver. */
export type AIIntentMode = 'off' | 'mock' | 'litellm' | 'openrouter' | 'ollama';

export const AI_INTENT_MODES: readonly AIIntentMode[] = [
  'off',
  'mock',
  'litellm',
  'openrouter',
  'ollama',
] as const;

/**
 * Resolve the configured AI intent mode from the environment.
 *
 * Reads `NEXT_PUBLIC_GARRETTOS_AI_INTENT_MODE` first (Next inlines NEXT_PUBLIC_*
 * into the client bundle, so the browser can decide whether to POST to the AI
 * route at all — keeping the deterministic fast path zero-latency when AI is
 * off), then the server-only `GARRETTOS_AI_INTENT_MODE`, then the legacy
 * `GARRETTOS_VOICE_AI_MODE` from M13/M14A. Unknown/unset → `off`.
 *
 * Provider API keys are NEVER read here — only the mode name is public.
 */
export function getAIIntentMode(
  env: NodeJS.ProcessEnv = process.env,
): AIIntentMode {
  const raw = (
    env.NEXT_PUBLIC_GARRETTOS_AI_INTENT_MODE ??
    env.GARRETTOS_AI_INTENT_MODE ??
    env.GARRETTOS_VOICE_AI_MODE ??
    ''
  )
    .toString()
    .trim()
    .toLowerCase();
  if ((AI_INTENT_MODES as readonly string[]).includes(raw)) {
    return raw as AIIntentMode;
  }
  // Legacy `nemotron` (M13) has no provider now — treat as off.
  return 'off';
}
