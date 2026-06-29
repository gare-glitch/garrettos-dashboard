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
import { createRequest, type OrchestratorServices } from '@/lib/garrettos/orchestrator/types';

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

const services: OrchestratorServices = {
  navigate: (href) => console.log(`    → navigate ${href}`),
  fallback: (t) => console.log(`    → fallback "${t}"`),
  createTask: async (input) => {
    console.log(`    → createTask "${input.title}" (approval=${input.requiresApproval})`);
    return { ok: true, taskId: `mock_${Date.now()}`, taskTitle: input.title, source: 'mock' };
  },
};

async function main() {
  let pass = 0;
  let fail = 0;
  for (const ex of EXAMPLES) {
    const req = createRequest({ source: 'voice', transcript: ex.input, userConfirmed: false });
    const intent = await resolveIntent(req);
    const { intent: gated } = applyPolicy(intent, req);
    const result = await executeIntent(gated, req, services, {});
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
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
