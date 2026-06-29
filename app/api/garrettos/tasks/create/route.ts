import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/garrettos/get-provider';
import type { TaskCreateInput } from '@/lib/garrettos/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_AGENTS = new Set(['opencode', 'claude', 'openclaw', 'manual']);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);
const ALLOWED_COMPOSIO_TOOLKITS = new Set(['gmail', 'google_calendar', 'github', 'slack', 'notion']);
const MAX_TITLE = 160;
const MAX_DESCRIPTION = 4000;
const MAX_TARGET_REPO = 240;

/**
 * POST /api/garrettos/tasks/create — create a queued task record only.
 *
 * This does NOT execute anything, spawn tmux, or run shell commands. It writes
 * a single queued markdown task file via the bridge when in server mode, or
 * records it locally as mock otherwise. See GARRETTOS_LIVE_DATA.md §9.
 *
 * Validation is strict: unknown agents/priorities, oversized fields, or shell
 * metacharacters in the target repo are rejected with 400 (not 500).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, source: 'mock', warning: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const validation = validateCreateInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { data: null, source: 'mock', warning: validation.error },
      { status: 400 },
    );
  }

  try {
    const provider = getProvider();
    const result = await provider.createTask(validation.input);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        source: 'mock',
        warning: 'task create route failed',
        error: err instanceof Error ? err.message : 'unknown',
      },
      { status: 200 },
    );
  }
}

type ValidationResult =
  | { ok: true; input: TaskCreateInput }
  | { ok: false; error: string };

function validateCreateInput(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be an object' };
  }
  const b = body as Record<string, unknown>;

  const title = typeof b.title === 'string' ? b.title.trim() : '';
  if (!title) return { ok: false, error: 'title is required' };
  if (title.length > MAX_TITLE) return { ok: false, error: `title must be ≤ ${MAX_TITLE} chars` };

  const agent = typeof b.agent === 'string' ? b.agent.toLowerCase() : '';
  if (!ALLOWED_AGENTS.has(agent)) {
    return { ok: false, error: 'agent must be one of opencode / claude / openclaw / manual' };
  }

  const priority = typeof b.priority === 'string' ? b.priority.toLowerCase() : '';
  if (!ALLOWED_PRIORITIES.has(priority)) {
    return { ok: false, error: 'priority must be low / medium / high' };
  }

  const requiresApproval = b.requiresApproval === true;

  const description =
    typeof b.description === 'string' ? b.description.trim() : undefined;
  if (description && description.length > MAX_DESCRIPTION) {
    return { ok: false, error: `description must be ≤ ${MAX_DESCRIPTION} chars` };
  }

  const targetRepo =
    typeof b.targetRepo === 'string' ? b.targetRepo.trim() : undefined;
  if (targetRepo) {
    if (targetRepo.length > MAX_TARGET_REPO) {
      return { ok: false, error: `targetRepo must be ≤ ${MAX_TARGET_REPO} chars` };
    }
    // Reject shell metacharacters / command separators in the repo path.
    if (/[;|&`$<>\\\n\r]/.test(targetRepo)) {
      return { ok: false, error: 'targetRepo contains disallowed characters' };
    }
  }

  // composioTools (M12B): optional array of allowed Composio toolkit slugs.
  const composioTools: string[] = [];
  const rawTools = b.composioTools;
  if (Array.isArray(rawTools)) {
    for (const t of rawTools) {
      const slug = typeof t === 'string' ? t.trim().toLowerCase() : '';
      if (slug && ALLOWED_COMPOSIO_TOOLKITS.has(slug) && !composioTools.includes(slug)) {
        composioTools.push(slug);
      }
    }
  }

  return {
    ok: true,
    input: {
      title,
      description: description || undefined,
      agent: agent as TaskCreateInput['agent'],
      priority: priority as TaskCreateInput['priority'],
      requiresApproval,
      targetRepo: targetRepo || undefined,
      composioTools: composioTools.length > 0 ? composioTools : undefined,
    },
  };
}
