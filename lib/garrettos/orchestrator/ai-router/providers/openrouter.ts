/**
 * OpenRouter provider — "ready" wiring (M14B).
 *
 * Targets https://openrouter.ai/api/v1 (OpenAI-compatible). Marked "ready"
 * because the provider is fully implemented; it only runs when
 * OPENROUTER_API_KEY is present in the server env. Without a key it throws and
 * the router falls back to deterministic — so it is safe to ship enabled-but-
 * unconfigured.
 *
 * Config (read from env via getAIProviderConfig):
 *   OPENROUTER_API_KEY   (required to actually call)
 *   OPENROUTER_MODEL     e.g. openai/gpt-4o-mini
 *   OPENROUTER_BASE_URL  (optional override)
 */
import type { AIProvider, AIProviderConfig } from './types';
import {
  buildMessages,
  fetchWithTimeout,
  parseContentJSON,
  readChatContent,
  readKey,
  timeoutFrom,
} from './http';

const DEFAULT_ENDPOINT = 'https://openrouter.ai/api/v1';

export const openrouterProvider: AIProvider = {
  id: 'openrouter',
  async interpret(transcript, config: AIProviderConfig) {
    const endpoint = (config.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, '');
    const model = config.model;
    if (!model) {
      throw new Error('openrouter provider missing model');
    }
    const key = readKey(config.apiKeyEnv);
    if (!key) {
      throw new Error('openrouter provider missing API key');
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...(config.extraHeaders ?? {}),
    };

    const res = await fetchWithTimeout(
      `${endpoint}/chat/completions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: buildMessages(transcript),
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      },
      timeoutFrom(config),
    );
    const content = await readChatContent(res);
    return parseContentJSON(content);
  },
};
