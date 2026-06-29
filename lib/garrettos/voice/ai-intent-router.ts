/**
 * GarrettOS AI Voice Intent Router — compatibility shim (M13 → M14B).
 *
 * The real AI intent router now lives in `lib/garrettos/orchestrator/ai-router`
 * and is plugged into the central orchestrator. This file keeps the historical
 * public surface (`getVoiceAIMode`, `AIVoiceMode`) so the voice hook, debug
 * panel, and settings panel keep working unchanged. It re-exports ONLY the mode
 * helper from `./mode` — never the provider implementations — so importing it
 * from a client component does not pull server-side LLM code into the browser.
 *
 * Mode selection env (in priority order):
 *   - NEXT_PUBLIC_GARRETTOS_AI_INTENT_MODE  (client-readable; preferred)
 *   - GARRETTOS_AI_INTENT_MODE              (server-only)
 *   - GARRETTOS_VOICE_AI_MODE               (legacy M13/M14A)
 * Values: off (default) | mock | litellm | openrouter | ollama
 */
export { getAIIntentMode as getVoiceAIMode } from '@/lib/garrettos/orchestrator/ai-router/mode';
export type { AIIntentMode as AIVoiceMode } from '@/lib/garrettos/orchestrator/ai-router/mode';
export { AI_INTENT_MODES as AI_VOICE_MODES } from '@/lib/garrettos/orchestrator/ai-router/mode';
