/**
 * GarrettOS Orchestrator — deterministic verification (M14A).
 *
 * Runs the resolver → policy → executor pipeline against a fixed examples table
 * and asserts the expected intent type + result status. Pure logic, no React.
 *
 * Run with:
 *   npx tsx scripts/garrettos_orchestrator_verify.ts
 *
 * (tsx resolves the `@/` tsconfig paths. If tsx is unavailable, the examples
 * table in GARRETTOS_ORCHESTRATOR.md is the canonical spec.)
 */
import { resolveIntent } from '@/lib/garrettos/orchestrator/resolver';
import { applyPolicy } from '@/lib/garrettos/orchestrator/policies';
import { executeIntent } from '@/lib/garrettos/orchestrator/executor';
import { createRequest, type OrchestratorOptions, type OrchestratorServices } from '@/lib/garrettos/orchestrator/types';
import { interpretWithAI } from '@/lib/garrettos/orchestrator/ai-router';

type Expect = {
  input: string;
  expectType: string;
  expectStatus: string;
  expectApproval?: boolean;
};

const EXAMPLES: Expect[] = [
  { input: 'open memory', expectType: 'memory', expectStatus: 'completed' },
  { input: 'open system', expectType: 'system', expectStatus: 'completed' },
  { input: 'show OpenClaw', expectType: 'navigation', expectStatus: 'completed' },
  { input: 'open settings', expectType: 'navigation', expectStatus: 'completed' },
  { input: 'open projects', expectType: 'navigation', expectStatus: 'completed' },
  { input: 'ask opencode to fix login', expectType: 'task', expectStatus: 'needs_approval', expectApproval: true },
  { input: 'research competitor pricing', expectType: 'task', expectStatus: 'queued', expectApproval: false },
  { input: 'send email to professor', expectType: 'composio', expectStatus: 'needs_approval', expectApproval: true },
  { input: 'delete server files', expectType: 'task', expectStatus: 'needs_approval', expectApproval: true },
  { input: 'xyzzy florp', expectType: 'unknown', expectStatus: 'unsupported' },
];

/**
 * M14B — AI intent router (mock provider) examples.
 *
 * These run the FULL AI path: the resolver is given an `aiResolve` that calls
 * the mock provider via `interpretWithAI`. The mock has canned intents for the
 * first six; the last ("xyzzy florp") is a mock-miss, so the resolver must fall
 * back to the deterministic parser and produce `unknown` / `unsupported`.
 *
 * This proves: AI produces only OrchestratorIntent JSON, schema validation
 * passes, the safety policy STILL re-gates dangerous/Composio intents after the
 * AI, and the deterministic parser remains the fallback.
 */
const AI_EXAMPLES: Expect[] = [
  { input: 'open memory', expectType: 'memory', expectStatus: 'completed' },
  { input: 'open system', expectType: 'system', expectStatus: 'completed' },
  { input: 'open openclaw', expectType: 'navigation', expectStatus: 'completed' },
  { input: 'research trends on the gpu market', expectType: 'task', expectStatus: 'queued', expectApproval: false },
  { input: 'send email to professor', expectType: 'composio', expectStatus: 'needs_approval', expectApproval: true },
  { input: 'delete the old logs', expectType: 'task', expectStatus: 'needs_approval', expectApproval: true },
  { input: 'xyzzy florp', expectType: 'unknown', expectStatus: 'unsupported' },
];

const services: OrchestratorServices = {
  navigate: (href) => console.log(`    → navigate ${href}`),
  fallback: (t) => console.log(`    → fallback "${t}"`),
  createTask: async (input) => {
    console.log(`    → createTask "${input.title}" (approval=${input.requiresApproval})`);
    return { ok: true, taskId: `mock_${Date.now()}`, taskTitle: input.title, source: 'mock' };
  },
};

// AI resolver injection mirroring the React layer's wiring to the server route.
// Here it calls the mock provider directly (no network), so CI can run it.
const mockAiResolve = async (transcript: string) => (await interpretWithAI(transcript, 'mock', {})).intent;
const aiOptions: OrchestratorOptions = {
  aiMode: 'mock',
  aiResolve: mockAiResolve,
  navigationConfidenceThreshold: 0.9,
};

async function runBlock(label: string, examples: Expect[], options: OrchestratorOptions) {
  let pass = 0;
  let fail = 0;
  console.log(`\n=== ${label} ===`);
  for (const ex of examples) {
    const req = createRequest({ source: 'voice', transcript: ex.input, userConfirmed: false });
    const intent = await resolveIntent(req, options);
    const { intent: gated } = applyPolicy(intent, req);
    const result = await executeIntent(gated, req, services, options);
    const typeOk = gated.type === ex.expectType;
    const statusOk = result.status === ex.expectStatus;
    const approvalOk = ex.expectApproval === undefined || gated.requiresApproval === ex.expectApproval;
    const ok = typeOk && statusOk && approvalOk;
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  "${ex.input}"  type=${gated.type}/${ex.expectType}  status=${result.status}/${ex.expectStatus}` +
        (ex.expectApproval !== undefined ? `  approval=${gated.requiresApproval}/${ex.expectApproval}` : ''),
    );
    if (ok) pass++;
    else fail++;
  }
  return { pass, fail };
}

async function main() {
  const det = await runBlock('Deterministic resolver (default / fallback)', EXAMPLES, {});
  const ai = await runBlock('AI resolver — mock provider', AI_EXAMPLES, aiOptions);
  const pass = det.pass + ai.pass;
  const fail = det.fail + ai.fail;
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
