/**
 * LiteLLM provider (M14B).
 *
 * Targets a self-hosted LiteLLM proxy (OpenAI-compatible /chat/completions).
 * Keys are read from env on the server; the browser never sees them.
 *
 * Config (read from env via getAIProviderConfig):
 *   LITELLM_BASE_URL  e.g. http://localhost:4000
 *   LITELLM_API_KEY    (optional if the proxy is unauthenticated)
 *   LITELLM_MODEL      e.g. gpt-4o-mini
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

export const litellmProvider: AIProvider = {
  id: 'litellm',
  async interpret(transcript, config: AIProviderConfig) {
    const endpoint = config.endpoint;
    const model = config.model;
    if (!endpoint || !model) {
      throw new Error('litellm provider missing endpoint or model');
    }
    const key = readKey(config.apiKeyEnv);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers.Authorization = `Bearer ${key}`;

    const res = await fetchWithTimeout(
      `${endpoint.replace(/\/$/, '')}/chat/completions`,
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
