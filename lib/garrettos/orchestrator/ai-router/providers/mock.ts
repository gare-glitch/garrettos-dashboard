/**
 * Mock AI provider (M14B).
 *
 * Deterministic canned AIIntentJSON for a handful of phrases, so the full
 * AI path (provider → schema validation → safety policy → executor) can be
 * exercised with zero network. For any phrase it does not recognize it throws
 * `MockMiss`, which the router turns into a deterministic fallback — so mock
 * mode never degrades behavior below the deterministic parser.
 *
 * This is the only provider safe to run in tests / CI / the verify script.
 */
import type { AIProvider } from './types';

export class MockMiss extends Error {
  constructor() {
    super('mock provider has no canned intent for this transcript');
    this.name = 'MockMiss';
  }
}

type MockEntry = {
  match: RegExp;
  json: unknown;
};

// Keep these deliberately small and high-precision. They mirror the canonical
// examples in GARRETTOS_ORCHESTRATOR.md so the verify script stays in sync.
const MOCK_ENTRIES: MockEntry[] = [
  {
    match: /\b(memory|mem)\b/i,
    json: {
      type: 'memory',
      confidence: 0.95,
      target: '/memory',
      action: 'Open Memory',
      requiresApproval: false,
      payload: { href: '/memory', label: 'Memory' },
    },
  },
  {
    match: /\b(system)\b/i,
    json: {
      type: 'system',
      confidence: 0.95,
      target: '/system',
      action: 'Open System',
      requiresApproval: false,
      payload: { href: '/system', label: 'System' },
    },
  },
  {
    match: /\b(openclaw|agent ops|operations)\b/i,
    json: {
      type: 'navigation',
      confidence: 0.92,
      target: '/openclaw',
      action: 'Open OpenClaw',
      requiresApproval: false,
      payload: { href: '/openclaw', label: 'OpenClaw' },
    },
  },
  {
    match: /\bresearch\b.*\bon\b|\binvestigate\b/i,
    json: {
      type: 'task',
      confidence: 0.82,
      target: 'openclaw',
      action: 'Research task',
      requiresApproval: false,
      suggestedAgent: 'openclaw',
      payload: { taskTitle: 'Research request', agent: 'openclaw' },
    },
  },
  {
    match: /\bsend\b.*\bemail\b|\bemail\b.*\bprofessor\b/i,
    json: {
      type: 'composio',
      confidence: 0.8,
      target: 'gmail',
      action: 'Send email via Gmail',
      requiresApproval: true,
      suggestedAgent: 'opencode',
      composioTools: ['gmail'],
      payload: { taskTitle: 'Send email', agent: 'opencode' },
    },
  },
  {
    match: /\bdelete\b|\bwipe\b|\bdrop\b/i,
    json: {
      type: 'task',
      confidence: 0.6,
      target: 'openclaw',
      action: 'Dangerous task (approval required)',
      requiresApproval: true,
      suggestedAgent: 'openclaw',
      payload: { taskTitle: 'Dangerous action', agent: 'openclaw' },
    },
  },
];

export const mockProvider: AIProvider = {
  id: 'mock',
  async interpret(transcript: string) {
    for (const entry of MOCK_ENTRIES) {
      if (entry.match.test(transcript)) {
        // Return a fresh deep copy so callers can't mutate the canned fixtures.
        return JSON.parse(JSON.stringify(entry.json));
      }
    }
    throw new MockMiss();
  },
};
