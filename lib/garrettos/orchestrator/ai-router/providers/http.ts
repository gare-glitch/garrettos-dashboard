/**
 * Shared HTTP helpers for AI providers (M14B).
 *
 * Server-side only. The browser never calls an upstream LLM directly — the
 * client resolver POSTs to /api/garrettos/ai-intent, which calls these.
 */
import { AI_SYSTEM_PROMPT, type AIProviderConfig } from './types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Build the standard two-message chat payload (system + user transcript). */
export function buildMessages(transcript: string): ChatMessage[] {
  return [
    { role: 'system', content: AI_SYSTEM_PROMPT },
    { role: 'user', content: transcript.slice(0, 1000) },
  ];
}

/** Read an API key from the named env var. Returns undefined if unset. */
export function readKey(envVar: string | undefined, env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (!envVar) return undefined;
  const v = env[envVar];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/** fetch with an AbortController timeout. Throws on timeout/non-OK. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`upstream ${res.status} ${res.statusText}`);
    }
    return res;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`upstream timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Parse a chat completion response body and extract the message content. */
export async function readChatContent(res: Response): Promise<string> {
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('upstream returned empty content');
  }
  return content;
}

/** Best-effort JSON parse of an LLM content string (strips code fences). */
export function parseContentJSON(content: string): unknown {
  let s = content.trim();
  // Strip accidental ```json ... ``` fences if a model ignored the prompt.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) s = fence[1].trim();
  // If there's surrounding text, try to locate the first {...} block.
  if (!s.startsWith('{')) {
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start >= 0 && end > start) s = s.slice(start, end + 1);
  }
  return JSON.parse(s);
}

export const DEFAULT_TIMEOUT_MS = 8000;

export function timeoutFrom(config: AIProviderConfig): number {
  return config.timeoutMs && config.timeoutMs > 0 ? config.timeoutMs : DEFAULT_TIMEOUT_MS;
}
