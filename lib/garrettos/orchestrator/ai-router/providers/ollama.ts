/**
 * Ollama provider — "ready" wiring (M14B).
 *
 * Targets a local Ollama /api/chat endpoint and forces JSON output via
 * `format: 'json'`. No API key required (local model). Marked "ready" because
 * the provider is fully implemented; it only does something useful when an
 * Ollama server + model are present locally, otherwise it throws and the
 * router falls back to deterministic.
 *
 * Config (read from env via getAIProviderConfig):
 *   OLLAMA_BASE_URL  default http://localhost:11434
 *   OLLAMA_MODEL     e.g. llama3.1
 */
import type { AIProvider, AIProviderConfig } from './types';
import { buildMessages, fetchWithTimeout, parseContentJSON, timeoutFrom } from './http';

const DEFAULT_ENDPOINT = 'http://localhost:11434';

export const ollamaProvider: AIProvider = {
  id: 'ollama',
  async interpret(transcript, config: AIProviderConfig) {
    const endpoint = (config.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, '');
    const model = config.model;
    if (!model) {
      throw new Error('ollama provider missing model');
    }

    const res = await fetchWithTimeout(
      `${endpoint}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: buildMessages(transcript),
          stream: false,
          format: 'json',
          options: { temperature: 0 },
        }),
      },
      timeoutFrom(config),
    );
    const body = (await res.json()) as { message?: { content?: string } };
    const content = body?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('ollama returned empty content');
    }
    return parseContentJSON(content);
  },
};
