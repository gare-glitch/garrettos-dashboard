# GarrettOS Central Orchestrator (M14A)

A single pipeline every input method flows through, so voice, the command
palette, dashboard buttons, and future inputs (mobile, Composio, automation) all
share one resolver, one safety policy, one executor, and one audit trail.

```
Input → Orchestrator → Intent Resolver → Policy/Safety → Action Planner/Executor → Result Envelope → UI feedback / task queue / navigation
```

## Why it exists

Before M14A, the voice layer resolved and executed intents on its own
(`parseVoiceIntent` → `routeVoiceIntent` → `onAction`), and the command palette
did its own thing. That meant safety rules, approval gating, and task creation
were scattered and easy to bypass. The orchestrator centralizes them so:

- **Safety is enforced once.** Dangerous verbs and Composio actions are always
  approval-gated, regardless of where the request came from.
- **Behavior is consistent.** "open memory" navigates the same way from voice,
  the palette, or a future dashboard button.
- **The AI router plugs in cleanly.** A future LLM intent resolver swaps in at
  one seam (`resolver.ts`) without touching input methods or executors.
- **Everything is observable.** Every request/result is recorded in a client-side
  audit log (no secrets).

## Input sources

| Source | Where it enters | Today |
| --- | --- | --- |
| `voice` | `useVoiceRecognition` → `OrchestratorProvider.orchestrate` | wired (M14A) |
| `command_palette` | `CommandPalette` "Run as command" item → `orchestrate` | wired (M14A) |
| `dashboard` | future New Task button / page actions | not wired yet |
| `api` | future server-side automation | not wired yet |
| `automation` | future scheduled / Composio-triggered flows | not wired yet |

## Request / Intent / Result

**OrchestratorRequest** — `id`, `source`, `transcript`, `currentPage`,
`userConfirmed`, `metadata`, `createdAt`.

**OrchestratorIntent** — `type` (`navigation | task | composio | memory | system | question | unknown`),
`confidence`, `target`, `action`, `requiresApproval`, `suggestedAgent`,
`composioTools`, `payload`, plus the original deterministic `rawIntent` for UI
compatibility.

**OrchestratorResult** — `status` (`completed | queued | needs_approval | failed | unsupported`),
`message`, `route?`, `taskId?`, `warning?`, `suggestions?`, `pendingIntent?`,
`debug?`.

## Resolver

`lib/garrettos/orchestrator/resolver.ts`

The **deterministic parser is the default and the fallback.** `resolveIntent`
reuses the M13 `parseVoiceIntent` (rule-based, local, no network) and maps its
`VoiceIntent` onto the richer `OrchestratorIntent` (e.g. navigation to `/memory`
becomes type `memory`). When `GARRETTOS_VOICE_AI_MODE !== 'off'`, an AI resolver
is tried first via `ai-intent-router.ts`; for now it returns `null` for every
mode, so the deterministic parser stays the source of truth. Existing voice
parsing behavior is unchanged.

## Safety policy

`lib/garrettos/orchestrator/policies.ts`

Runs after the resolver, before the executor. It never executes — it only
adjusts `requiresApproval` and emits a `PolicyDecision`.

- **Dangerous verbs** (`delete`, `wipe`, `drop`, `shutdown`, `force push`, `sudo`, …)
  → always `requiresApproval: true` and `blocked: true`. If the resolver returned
  `unknown`/`question`, the intent is **upgraded to a `task`** so it can be
  queued as approval-required (never auto-run). e.g. "delete server files".
- **Composio** → always `requiresApproval: true` (never executes directly).
- **Mutating tasks** → keep approval; **read-only tasks** (`research`, `review`,
  `look up`, `summarize`, …) auto-queue without approval.
- **Navigation** → not approval-gated by policy (the executor honors a confidence
  threshold instead).

## Executor adapters

`lib/garrettos/orchestrator/adapters/`

| Adapter | Behavior |
| --- | --- |
| `navigation.ts` | Auto-executes `services.navigate(href)` when `confidence >= 0.9` (default) and not approval-gated; otherwise `needs_approval`. |
| `memory.ts` / `system.ts` | v1: route to `/memory` / `/system` (same logic as navigation). Future: inline read-only queries. |
| `task.ts` | Read-only tasks auto-queue via `services.createTask`; mutating tasks return `needs_approval` until the user confirms, then queue. Never executes the task — only records it (the Hetzner loop daemon runs it). |
| `composio.ts` | **Never executes directly.** Always `needs_approval`; on approval, queues a task carrying `composio_tools`. The actual Composio call happens later inside a supervised tmux agent run on the VPS. |
| `fallback.ts` | Unknown/question → opens the command palette prefilled (`services.fallback`) and returns `unsupported` with suggestions. UI stays stable. |

Side-effects happen only through injected `OrchestratorServices`
(`navigate`, `createTask`, `fallback`). The core is pure and SSR-safe.

## Approval handling

- An intent that needs approval returns `OrchestratorResult { status: 'needs_approval', pendingIntent }`.
- `OrchestratorProvider` stashes the `pendingIntent`; `approvePending()`
  re-executes it through the same executor with `userConfirmed: true`.
- Voice: the action preview's **Approve** button calls `approvePending()`; the
  result maps onto the voice state machine (`queued` / `error`).
- Command palette: a `needs_approval` result opens the **Task Composer**
  prefilled with the pending intent's task details, so the user reviews before
  submitting (the palette itself has no inline approval UI).
- Nothing dangerous ever auto-executes. Approval only ever *queues* an
  approval-required task record; execution remains the loop daemon's job.

## Audit log

`lib/garrettos/orchestrator/audit-log.ts` — a localStorage ring buffer of the
last **10** outcomes. **No secrets**: only `source`, `transcript`, `intentType`,
`status`, `message`, `requiresApproval`, `target`, `taskId`, `createdAt`. View
it in **Settings → Integrations → Orchestrator audit** (developer panel).

## Future AI router integration

The AI router seam is `resolver.ts` + `ai-intent-router.ts`. To wire a real
backend:

1. Implement `aiInterpretIntent` for a mode (`litellm` / `openrouter` /
   `nemotron`) with a strict `VoiceIntent` JSON schema.
2. Clamp `requiresApproval: true` for any mutating/ambiguous AI output.
3. Return `null` on any parse/transport error so the deterministic parser runs.

No input method, executor, or UI needs to change — the orchestrator already
calls the AI resolver first when `GARRETTOS_VOICE_AI_MODE` is set.

## What still uses the legacy parser

- `lib/garrettos/voice/action-router.ts` (`routeVoiceIntent`) is no longer called
  by voice — the orchestrator replaces it. The file is kept as a utility; nothing
  imports it now. Removal is a future cleanup.
- `parseVoiceIntent` (the deterministic parser) is **not** legacy — it is the
  orchestrator's default resolver and remains the fallback under AI modes.
- The M13 voice UI (`VoiceIntentCard`, `VoiceActionPreview`) still renders; the
  hook derives `VoiceIntent`/`VoiceAction` from the orchestrator outcome for
  compatibility.

## Deterministic examples table

Verified by `scripts/garrettos_orchestrator_verify.ts`
(`npx tsx scripts/garrettos_orchestrator_verify.ts` → **10 passed, 0 failed**).

| Input | Intent type | Result status | Approval |
| --- | --- | --- | --- |
| `open memory` | memory | completed | no |
| `open system` | system | completed | no |
| `show OpenClaw` | navigation | completed | no |
| `open settings` | navigation | completed | no |
| `open projects` | navigation | completed | no |
| `ask opencode to fix login` | task | needs_approval | yes |
| `research competitor pricing` | task | queued | no (read-only auto-queue) |
| `send email to professor` | composio | needs_approval | yes |
| `delete server files` | task | needs_approval | yes (dangerous → blocked from auto-run) |
| `xyzzy florp` | unknown | unsupported | no (opens command palette) |

## Files

```
lib/garrettos/orchestrator/
  types.ts              # Request/Intent/Result/Services/Options + createRequest
  resolver.ts           # request → intent (deterministic default; AI hook)
  policies.ts           # safety policy (dangerous verbs, Composio, read-only)
  executor.ts           # intent → adapter dispatch
  orchestrator.ts       # runOrchestrator: resolver → policy → executor
  audit-log.ts          # localStorage ring buffer (last 10, no secrets)
  adapters/
    navigation.ts memory.ts system.ts task.ts composio.ts fallback.ts

components/garrettos/orchestrator/
  OrchestratorProvider.tsx  # React binding: services + orchestrate + approvePending + audit
  OrchestratorAuditPanel.tsx# dev panel (Settings)
  index.ts

scripts/garrettos_orchestrator_verify.ts  # deterministic examples harness
```
