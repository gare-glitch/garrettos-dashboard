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
becomes type `memory`).

When `aiMode !== 'off'` AND an `aiResolve` function is injected, the **AI
resolver runs first** (see "AI Intent Router" below). It returns a *validated*
`OrchestratorIntent` or `null`; on `null`/throw the deterministic parser runs,
so behavior never degrades below the rule-based parser. The React layer injects
`aiResolve` wired to `POST /api/garrettos/ai-intent` (keys stay server-side).

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

## AI Intent Router (M14B)

`lib/garrettos/orchestrator/ai-router/`

The AI is plugged into the orchestrator as the **first** resolver stage. It is
ONLY ever allowed to produce a JSON object matching the strict `AIIntentJSON`
schema — it never executes anything, never returns prose, never returns
free-form fields.

### Pipeline

```
voice/command text
  → orchestrator
  → AI resolver if enabled (aiResolve injected → POST /api/garrettos/ai-intent)
  → schema validation (validateAIIntent — strict; rejects/drops unknown fields)
  → safety policy (policies.ts — ALWAYS re-runs, even after the AI)
  → executor adapter
```

The deterministic resolver remains the fallback: if the AI mode is `off`, the
route returns `null`, schema validation fails, or the provider throws, the
deterministic parser runs and the pipeline is identical to M14A.

### Providers

`ai-router/providers/`

| Provider | Mode | Target | Notes |
| --- | --- | --- | --- |
| `mock.ts` | `mock` | — | Canned `AIIntentJSON` for a handful of phrases; no network. Mock-miss throws → deterministic fallback. Safe in tests/CI. |
| `litellm.ts` | `litellm` | `$LITELLM_BASE_URL/chat/completions` | Self-hosted OpenAI-compatible proxy. Key from `LITELLM_API_KEY`. |
| `openrouter.ts` | `openrouter` | `https://openrouter.ai/api/v1/chat/completions` | "ready" — implemented; runs only when `OPENROUTER_API_KEY` is set, else throws → fallback. |
| `ollama.ts` | `ollama` | `$OLLAMA_BASE_URL/api/chat` (default `localhost:11434`) | "ready" — local, no key; forces `format: 'json'`. Runs only when a local Ollama + model are present. |

All LLM providers send the same strict `AI_SYSTEM_PROMPT` that pins output to
the `AIIntentJSON` schema, forbids prose/markdown, and tells the model it is an
intent *descriptor*, not an executor. OpenAI-compatible providers request
`response_format: { type: 'json_object' }`; Ollama uses `format: 'json'`.

### Keys stay server-side

The browser **never** calls an upstream LLM. The client orchestrator POSTs the
transcript to `POST /api/garrettos/ai-intent`; the route runs the provider
server-side, validates the JSON, and returns a pure `OrchestratorIntent` (or
`null`). Provider API keys (`LITELLM_API_KEY`, `OPENROUTER_API_KEY`, …) are read
from env only inside the provider at call time and are never serialized.

### Mode selection

`getAIIntentMode()` reads, in priority order:

1. `NEXT_PUBLIC_GARRETTOS_AI_INTENT_MODE` — Next inlines `NEXT_PUBLIC_*` into the
   client bundle, so the browser knows the mode and can skip the network call
   entirely when AI is `off` (the deterministic fast path stays zero-latency).
2. `GARRETTOS_AI_INTENT_MODE` — server-only.
3. `GARRETTOS_VOICE_AI_MODE` — legacy M13/M14A name.

Values: `off` (default) | `mock` | `litellm` | `openrouter` | `ollama`.

Provider config env (server-only): `LITELLM_BASE_URL` / `LITELLM_MODEL` /
`LITELLM_API_KEY`; `OPENROUTER_BASE_URL` / `OPENROUTER_MODEL` / `OPENROUTER_API_KEY`;
`OLLAMA_BASE_URL` / `OLLAMA_MODEL`.

### Why this is safe

- The AI only **describes** an intent (`AIIntentJSON`); it has no execution path.
- `validateAIIntent` is a strict chokepoint — unknown keys are dropped, type/
  confidence/`requiresApproval` are shape-checked. Anything that fails is
  rejected → deterministic fallback.
- The **safety policy re-runs after the AI** on the original transcript:
  dangerous verbs, Composio, and mutating tasks are re-gated to
  `requiresApproval: true` regardless of what the model said. The AI's
  `requiresApproval: false` is never trusted on its own.
- So even a misbehaving or prompt-injected model cannot auto-execute a
  dangerous action — the worst it can do is produce a wrong intent that the
  policy still gates, or get rejected and fall back to deterministic.

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
(`npx tsx scripts/garrettos_orchestrator_verify.ts` → deterministic block:
**10 passed, 0 failed**).

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

## AI (mock provider) examples table

The same harness runs a second block with `aiMode: 'mock'` and an injected
`aiResolve` that calls the mock provider — exercising the full AI path
(provider → schema validation → safety policy → executor) including the
deterministic fallback on a mock-miss (**7 passed, 0 failed**).

| Input | Intent type | Result status | Approval | Source |
| --- | --- | --- | --- | --- |
| `open memory` | memory | completed | no | AI (mock) |
| `open system` | system | completed | no | AI (mock) |
| `open openclaw` | navigation | completed | no | AI (mock) |
| `research trends on the gpu market` | task | queued | no (read-only) | AI (mock) |
| `send email to professor` | composio | needs_approval | yes | AI (mock) |
| `delete the old logs` | task | needs_approval | yes (dangerous re-gated by policy) | AI (mock) |
| `xyzzy florp` | unknown | unsupported | no | deterministic fallback (mock-miss) |

## Files

```
lib/garrettos/orchestrator/
  types.ts              # Request/Intent/Result/Services/Options + createRequest
  resolver.ts           # request → intent (AI-first when enabled; deterministic fallback)
  policies.ts           # safety policy (dangerous verbs, Composio, read-only)
  executor.ts           # intent → adapter dispatch
  orchestrator.ts       # runOrchestrator: resolver → policy → executor
  audit-log.ts          # localStorage ring buffer (last 10, no secrets)
  ai-router/            # M14B — AI intent router
    mode.ts             # AIIntentMode + getAIIntentMode (client-safe, no provider imports)
    schema.ts           # AIIntentJSON + validateAIIntent + aiJSONToIntent
    index.ts            # createAIProvider, interpretWithAI, getAIProviderConfig
    providers/
      types.ts          # AIProvider interface + shared AI_SYSTEM_PROMPT
      http.ts           # fetchWithTimeout, content JSON parse, key read (server-only)
      mock.ts           # canned intents (no network; tests/CI)
      litellm.ts        # LiteLLM proxy (OpenAI-compatible)
      openrouter.ts     # OpenRouter (ready; key-gated)
      ollama.ts         # Ollama local (ready; format:json)
  adapters/
    navigation.ts memory.ts system.ts task.ts composio.ts fallback.ts

components/garrettos/orchestrator/
  OrchestratorProvider.tsx  # React binding: services + aiResolve (→ /api/garrettos/ai-intent) + audit
  OrchestratorAuditPanel.tsx# dev panel (Settings)
  index.ts

app/api/garrettos/ai-intent/route.ts  # server-side AI intent resolution (keys stay server-side)

scripts/garrettos_orchestrator_verify.ts  # deterministic + mock-AI examples harness
```
