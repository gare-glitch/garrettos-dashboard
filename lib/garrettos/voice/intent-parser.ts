/**
 * GarrettOS Voice Intent Parser — v1 (M13).
 *
 * Deterministic, local, rule-based. No network, no paid API. Browser speech
 * recognition is noisy, so matching is forgiving (lowercased substring) and
 * ordered most-specific → least-specific so ambiguous phrases resolve correctly
 * (e.g. "show my github repos" is a Composio read, not navigation).
 *
 * Safety: the parser only ever *proposes* an intent. It never executes. Any
 * intent that mutates external state is flagged `requiresApproval: true` and
 * the action router turns it into a queued task, never a direct side-effect.
 */
import type { TaskAgent } from '@/lib/garrettos/types';
import type { VoiceIntent, VoiceRoute } from './voice-types';

/** Toolkits the task-create API + bridge actually accept (M12B allow-list). */
export const VOICE_COMPOSIO_ALLOWED = new Set([
  'gmail',
  'google_calendar',
  'github',
  'slack',
  'notion',
]);

/** Read-only verbs — a task body starting with these does not require approval. */
const READ_ONLY_VERBS = [
  'research',
  'review',
  'read',
  'look up',
  'lookup',
  'show',
  'list',
  'find',
  'search',
  'summarize',
  'summarise',
  'analyze',
  'analyse',
  'explain',
  'inspect',
  'audit',
  'describe',
  'check',
  'monitor',
  'investigate',
  'survey',
  'outline',
  'compare',
];

type NavRule = { phrases: string[]; route: VoiceRoute; id: string };

const NAV_RULES: NavRule[] = [
  { phrases: ['open memory', 'show memory', 'memory module', 'neural index', 'open the memory'], route: { href: '/memory', label: 'Memory' }, id: 'navigate.memory' },
  { phrases: ['open system', 'go to system', 'show system', 'system health', 'open health', 'show health', 'open the system'], route: { href: '/system', label: 'System' }, id: 'navigate.system' },
  { phrases: ['show openclaw', 'open openclaw', 'open claw', 'open open claw', 'agent ops', 'launch agent', 'open agent', 'agent operations'], route: { href: '/openclaw', label: 'OpenClaw' }, id: 'navigate.openclaw' },
  { phrases: ['show tasks', 'task queue', 'show my tasks', 'task board', 'open tasks'], route: { href: '/openclaw', label: 'Task Board' }, id: 'navigate.tasks' },
  { phrases: ['open projects', 'show projects', 'go to projects', 'open the projects'], route: { href: '/projects', label: 'Projects' }, id: 'navigate.projects' },
  { phrases: ['show settings', 'open settings', 'go to settings', 'open the settings'], route: { href: '/settings', label: 'Settings' }, id: 'navigate.settings' },
  { phrases: ['ask garrett', 'ask garrett os', 'open mentor', 'ask the mentor', 'go to mentor'], route: { href: '/mentor', label: 'Mentor' }, id: 'navigate.mentor' },
  { phrases: ['go home', 'open home', 'go to home', 'command workspace'], route: { href: '/', label: 'Home' }, id: 'navigate.home' },
];

type ComposioRule = {
  phrases: string[];
  id: string;
  label: string;
  toolkit: string | null; // null when the toolkit isn't allow-listed yet
  agent: TaskAgent;
  mutating: boolean;
  /** Build the task title from the transcript. */
  title: (transcript: string) => string;
  /** Build the task description/body. */
  description: (transcript: string) => string;
};

const COMPOSIO_RULES: ComposioRule[] = [
  {
    phrases: ['send an email to', 'send email to', 'send a message to', 'email to'],
    id: 'composio.send_email',
    label: 'Send email (Gmail)',
    toolkit: 'gmail',
    agent: 'opencode',
    mutating: true,
    title: (t) => `Send email — ${afterPhrase(t, ['send an email to', 'send email to', 'send a message to', 'email to'])}`,
    description: (t) =>
      `Use Composio Gmail tools to SEND an email. Sending is a mutating external action — requires explicit human approval before executing.\n\nTranscript: "${t}"`,
  },
  {
    phrases: ['draft an email to', 'draft an email', 'write an email to', 'compose an email to', 'draft email to'],
    id: 'composio.draft_email',
    label: 'Draft email (Gmail)',
    toolkit: 'gmail',
    agent: 'opencode',
    mutating: true,
    title: (t) => `Draft email — ${afterPhrase(t, ['draft an email to', 'write an email to', 'compose an email to', 'draft email to', 'draft an email'])}`,
    description: (t) =>
      `Use Composio Gmail tools to DRAFT (not send) an email. Do not send without explicit human approval.\n\nTranscript: "${t}"`,
  },
  {
    phrases: ['look up my latest emails', 'show my latest emails', 'read my emails', 'check my inbox', 'show my emails', 'latest emails', 'check my email'],
    id: 'composio.read_emails',
    label: 'Read latest emails (Gmail)',
    toolkit: 'gmail',
    agent: 'opencode',
    mutating: false,
    title: () => 'Look up latest emails',
    description: (t) =>
      `Use Composio Gmail tools to read/list the latest emails (read-only). Summarize senders, subjects, and any action items.\n\nTranscript: "${t}"`,
  },
  {
    phrases: ['show my github repos', 'list my github repos', 'show my repositories', 'list my repositories', 'github repos'],
    id: 'composio.github_repos',
    label: 'List GitHub repos',
    toolkit: 'github',
    agent: 'opencode',
    mutating: false,
    title: () => 'Show my GitHub repositories',
    description: (t) =>
      `Use Composio GitHub tools to list the authenticated user's repositories (read-only). Summarize names, stars, and recent activity.\n\nTranscript: "${t}"`,
  },
  {
    phrases: ['create a github issue', 'file a github issue', 'open a github issue', 'create github issue', 'file github issue'],
    id: 'composio.github_issue',
    label: 'Create GitHub issue',
    toolkit: 'github',
    agent: 'opencode',
    mutating: true,
    title: (t) => `Create GitHub issue — ${afterPhrase(t, ['create a github issue', 'file a github issue', 'open a github issue', 'create github issue', 'file github issue'])}`,
    description: (t) =>
      `Use Composio GitHub tools to create an issue. Requires approval before creating. Include a clear title and body from the request.\n\nTranscript: "${t}"`,
  },
  {
    phrases: ['search my google drive for', 'search google drive for', 'find in my google drive', 'search my drive for', 'search drive for'],
    id: 'composio.drive_search',
    label: 'Search Google Drive',
    // googledrive is not in the task allow-list yet — leave toolkit null so the
    // created task doesn't silently drop a tool; the body carries the intent.
    toolkit: null,
    agent: 'opencode',
    mutating: false,
    title: (t) => `Search Google Drive — ${afterPhrase(t, ['search my google drive for', 'search google drive for', 'find in my google drive', 'search my drive for', 'search drive for'])}`,
    description: (t) =>
      `Use Composio CLI (googledrive toolkit, if connected) to search Google Drive for the requested term (read-only). Summarize matching files with links.\n\nTranscript: "${t}"`,
  },
];

type TaskRule = {
  phrases: string[];
  id: string;
  agent: TaskAgent;
  /** When true, the task is always read-only (no approval) — e.g. research/review. */
  readOnly?: boolean;
  /** Extract the task body from the transcript. */
  body: (transcript: string) => string;
};

const TASK_RULES: TaskRule[] = [
  { phrases: ['ask opencode to', 'have opencode', 'tell opencode to'], id: 'task.create.opencode', agent: 'opencode', body: (t) => afterPhrase(t, ['ask opencode to', 'have opencode', 'tell opencode to']) },
  { phrases: ['have claude', 'ask claude to', 'tell claude to'], id: 'task.create.claude', agent: 'claude', body: (t) => afterPhrase(t, ['have claude', 'ask claude to', 'tell claude to']) },
  { phrases: ['start an agent to', 'launch an agent to', 'have openclaw', 'ask openclaw to'], id: 'task.create.openclaw', agent: 'openclaw', body: (t) => afterPhrase(t, ['start an agent to', 'launch an agent to', 'have openclaw', 'ask openclaw to']) },
  { phrases: ['create a task to', 'create a task for', 'create task to', 'queue a task to', 'add a task to'], id: 'task.create', agent: 'openclaw', body: (t) => afterPhrase(t, ['create a task to', 'create a task for', 'create task to', 'queue a task to', 'add a task to']) },
  { phrases: ['research'], id: 'task.research', agent: 'opencode', readOnly: true, body: (t) => afterPhrase(t, ['research']) },
  { phrases: ['review'], id: 'task.review', agent: 'opencode', readOnly: true, body: (t) => afterPhrase(t, ['review']) },
];

function afterPhrase(transcript: string, phrases: string[]): string {
  const t = transcript.toLowerCase();
  for (const p of phrases) {
    const idx = t.indexOf(p);
    if (idx >= 0) {
      const rest = transcript.slice(idx + p.length).trim();
      return rest.replace(/^[:,\s]+/, '').trim();
    }
  }
  return transcript.trim();
}

function isReadOnlyBody(body: string): boolean {
  const b = body.toLowerCase().trim();
  if (!b) return false;
  return READ_ONLY_VERBS.some((v) => b.startsWith(v));
}

function titleCaseBody(body: string): string {
  const cleaned = body.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New voice task';
  const first = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return first.length > 80 ? first.slice(0, 77) + '…' : first;
}

/**
 * Parse a recognized transcript into a voice intent. Returns an `unknown`
 * intent when nothing matches — the action router turns that into a fallback
 * that opens the command palette with the transcript prefilled.
 */
export function parseVoiceIntent(transcript: string): VoiceIntent {
  const t = (transcript || '').toLowerCase().trim();
  const raw = (transcript || '').trim();

  if (!t) {
    return unknown(raw);
  }

  // 1. Composio actions (most specific — check before navigation/task).
  for (const rule of COMPOSIO_RULES) {
    if (rule.phrases.some((p) => t.includes(p))) {
      const composioTools = rule.toolkit && VOICE_COMPOSIO_ALLOWED.has(rule.toolkit) ? [rule.toolkit] : [];
      return {
        id: rule.id,
        kind: 'composio',
        label: rule.label,
        confidence: 0.9,
        requiresApproval: rule.mutating,
        composioTools: composioTools.length > 0 ? composioTools : undefined,
        agent: rule.agent,
        taskTitle: titleCaseBody(rule.title(raw)),
        taskDescription: rule.description(raw),
        transcript: raw,
      };
    }
  }

  // 2. Task creation.
  for (const rule of TASK_RULES) {
    if (rule.phrases.some((p) => t.includes(p))) {
      const body = rule.body(raw);
      // Read-only rules (research/review) never need approval. For generic
      // task creation, approval is gated unless the body starts with a
      // read-only verb (research/review/look-up/summarize/…).
      const requiresApproval = rule.readOnly ? false : !isReadOnlyBody(body);
      return {
        id: rule.id,
        kind: 'task',
        label: `Task · ${rule.agent}`,
        confidence: 0.85,
        requiresApproval,
        agent: rule.agent,
        taskTitle: titleCaseBody(body) || 'New voice task',
        taskDescription: `${body}\n\nSource: voice command.\nAgent: ${rule.agent}.`,
        transcript: raw,
      };
    }
  }

  // 3. Navigation.
  for (const rule of NAV_RULES) {
    if (rule.phrases.some((p) => t.includes(p))) {
      return {
        id: rule.id,
        kind: 'navigation',
        label: `Open ${rule.route.label}`,
        confidence: 0.95,
        requiresApproval: false,
        route: rule.route,
        transcript: raw,
      };
    }
  }

  return unknown(raw);
}

function unknown(transcript: string): VoiceIntent {
  return {
    id: 'unknown',
    kind: 'unknown',
    label: 'Not recognized',
    confidence: 0,
    requiresApproval: false,
    transcript,
  };
}

/** True when the intent implies a mutating/external action (for UI badges). */
export function intentIsMutating(intent: VoiceIntent): boolean {
  return intent.requiresApproval;
}
