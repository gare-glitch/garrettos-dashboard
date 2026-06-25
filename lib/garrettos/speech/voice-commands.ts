import type { VoiceCommand, VoiceCommandId, VoiceMatchResult } from './types';

/**
 * Mock voice commands recognized by GarrettOS. Matched as case-insensitive
 * substrings against the recognized transcript, so "open the memory module"
 * still maps to `open-memory`.
 */
export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: 'open-memory',
    label: 'Open Memory',
    href: '/memory',
    phrases: ['open memory', 'memory', 'neural index', 'open the memory'],
  },
  {
    id: 'open-system',
    label: 'Open System',
    href: '/system',
    phrases: ['open system', 'system', 'system health', 'open the system'],
  },
  {
    id: 'launch-agent',
    label: 'Launch Agent',
    href: '/openclaw',
    phrases: ['launch agent', 'open agent', 'agent ops', 'openclaw', 'open claw'],
  },
  {
    id: 'show-tasks',
    label: 'Show Tasks',
    href: '/openclaw',
    phrases: ['show tasks', 'task queue', 'tasks', 'show my tasks', 'task board'],
  },
  {
    id: 'ask-garrett',
    label: 'Ask Garrett',
    href: '/mentor',
    phrases: ['ask garrett', 'ask garrett os', 'mentor', 'ask the mentor'],
  },
  {
    id: 'sync-memory',
    label: 'Sync Memory',
    action: 'sync-memory',
    phrases: ['sync memory', 'index memory', 'reindex', 'sync the memory'],
  },
];

export const VOICE_COMMAND_IDS: VoiceCommandId[] = VOICE_COMMANDS.map((c) => c.id);

/**
 * Match a transcript against the known commands. Returns the first match.
 * Matching is intentionally forgiving (substring, lowercased) because browser
 * recognition is noisy.
 */
export function matchVoiceCommand(transcript: string): VoiceMatchResult | null {
  const t = transcript.toLowerCase().trim();
  if (!t) return null;
  for (const command of VOICE_COMMANDS) {
    for (const phrase of command.phrases) {
      if (t.includes(phrase)) {
        return { command, transcript };
      }
    }
  }
  return null;
}
