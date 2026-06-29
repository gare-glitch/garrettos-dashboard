import { NextResponse } from 'next/server';
import {
  AI_INTENT_MODES,
  getAIIntentMode,
  getAIProviderConfig,
  interpretWithAI,
  type AIIntentMode,
} from '@/lib/garrettos/orchestrator/ai-router';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

/**
 * POST /api/garrettos/ai-intent — server-side AI intent resolution.
 *
 * The browser never calls an upstream LLM directly (no keys leak, no CORS
 * issues). The client orchestrator resolver POSTs a transcript here; this route
 * runs the selected AI provider, validates the JSON against the strict schema,
 * and returns a pure `OrchestratorIntent` (or null so the caller falls back to
 * the deterministic parser).
 *
 * The AI NEVER executes anything here — it only describes an intent. Execution
 * + safety policy happen back in the orchestrator core (client-side), which
 * re-applies the policy regardless of what the AI said.
 *
 * Body: { transcript: string, mode?: AIIntentMode }
 * Mode resolution: body.mode (if valid) → GARRETTOS_AI_INTENT_MODE →
 *   legacy GARRETTOS_VOICE_AI_MODE → 'off'.
 */
export async function POST(request: Request) {
  let body: { transcript?: unknown; mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: { intent: null }, source: 'mock', warning: 'Invalid JSON body' },
      { status: 200 },
    );
  }

  const transcript =
    typeof body.transcript === 'string' ? body.transcript.trim().slice(0, 1000) : '';
  if (!transcript) {
    return NextResponse.json(
      { data: { intent: null }, source: 'mock', warning: 'Empty transcript' },
      { status: 200 },
    );
  }

  // Body mode wins if it is a known value; otherwise read the env.
  const bodyMode = typeof body.mode === 'string' ? body.mode.toLowerCase() : '';
  const mode: AIIntentMode = (AI_INTENT_MODES as readonly string[]).includes(bodyMode)
    ? (bodyMode as AIIntentMode)
    : getAIIntentMode();

  if (mode === 'off') {
    return NextResponse.json(
      {
        data: { intent: null },
        source: 'off',
        warning: 'AI intent mode is off — using deterministic resolver',
      },
      { status: 200 },
    );
  }

  const config = getAIProviderConfig(mode);
  const { intent, source, warning } = await interpretWithAI(transcript, mode, config);

  return NextResponse.json(
    { data: { intent }, source, warning },
    { status: 200 },
  );
}
