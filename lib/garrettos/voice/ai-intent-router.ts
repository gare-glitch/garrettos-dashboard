/**
 * GarrettOS AI Voice Intent Router — placeholder (M13 bugfix).
 *
 * The deterministic parser (`intent-parser.ts`) remains the DEFAULT and is always
 * available. This module defines the clean interface for a future AI-backed
 * interpretation layer (LiteLLM / OpenRouter / Nemotron) so voice can handle
 * natural, free-form commands that the rule-based parser misses.
 *
 * Mode is selected with the `GARRETTOS_VOICE_AI_MODE` env var:
 *   - `off` (default)        → deterministic parser only
 *   - `litellm` / `openrouter` / `nemotron` → AI router (not yet wired)
 *
 * For now every non-`off` mode returns `null` from `aiInterpretIntent` so the
 * caller falls back to the deterministic parser. When a backend is wired, the
 * implementation goes inside `aiInterpretIntent` — the public surface stays the
 * same, so `useVoiceRecognition` does not change.
 */
import type { VoiceIntent } from './voice-types';

export type AIVoiceMode = 'off' | 'litellm' | 'openrouter' | 'nemotron';

export const AI_VOICE_MODES: readonly AIVoiceMode[] = ['off', 'litellm', 'openrouter', 'nemotron'] as const;

export type AIIntentRouterOptions = {
  mode: AIVoiceMode;
  /** Optional endpoint override (future). */
  endpoint?: string;
  /** Optional model id (future). */
  model?: string;
};

/**
 * Resolve the configured AI voice mode from the environment. Unknown / unset
 * values default to `off` (deterministic parser). Server-side safe.
 */
export function getVoiceAIMode(env: string | undefined = process?.env?.GARRETTOS_VOICE_AI_MODE): AIVoiceMode {
  const v = (env ?? '').toString().trim().toLowerCase();
  return (AI_VOICE_MODES as readonly string[]).includes(v) ? (v as AIVoiceMode) : 'off';
}

/**
 * Interpret a transcript using the AI router.
 *
 * NOT YET WIRED. Returns `null` for every mode so the deterministic parser
 * stays the source of truth. Future wiring:
 *   - build a strict system prompt that constrains output to a VoiceIntent JSON
 *     shape (no free-form fields, no secrets),
 *   - call the selected backend (LiteLLM local / OpenRouter / Nemotron),
 *   - validate the response against `VoiceIntent` and clamp `requiresApproval`
 *     to `true` for any mutating/ambiguous action,
 *   - fall back to `null` on any parse/transport error so the deterministic
 *     parser can still run.
 */
export async function aiInterpretIntent(
  _transcript: string,
  _options: AIIntentRouterOptions,
): Promise<VoiceIntent | null> {
  return null;
}

/**
 * Factory for a typed AI intent router. Kept symmetrical with the deterministic
 * parser so a future provider can swap them without touching the hook.
 */
export function createAIIntentRouter(options: AIIntentRouterOptions): {
  mode: AIVoiceMode;
  interpret: (transcript: string) => Promise<VoiceIntent | null>;
} {
  return {
    mode: options.mode,
    interpret: (transcript: string) => aiInterpretIntent(transcript, options),
  };
}
