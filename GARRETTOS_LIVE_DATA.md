# GarrettOS Live Data Foundation (M7)

This document describes the data-provider architecture that lets GarrettOS swap
mock data for live sources (Hetzner VPS, OpenClaw, LiteLLM, Ollama, Valkey,
Qdrant, Obsidian/OpenClawMemory, Garmin, GitHub/Vercel, task queue, agent
sessions) **without breaking the mock UI**.

Everything here is read-only, secret-safe, and falls back to mock data on any
failure. No secrets are required to run the app.

## 1. Provider architecture

```
                ┌─────────────────────────────────────────────┐
   UI page  ──▶ │ useGarrettOSData('/api/garrettos/<route>')  │
                │   - fetches the route                         │
                │   - on any failure, imports mock data inline │
                │   - exposes source ('server'|'mock'|'stale')│
                └─────────────────┬───────────────────────────┘
                                  │ fetch
                                  ▼
                ┌─────────────────────────────────────────────┐
                │ app/api/garrettos/<route>/route.ts          │
                │   - never throws                              │
                │   - returns { data, source, warning, fetchedAt } │
                └─────────────────┬───────────────────────────┘
                                  │ getProvider()
                                  ▼
                ┌─────────────────────────────────────────────┐
                │ resolveDataMode() reads GARRETTOS_DATA_MODE │
                │   'mock' (default) → mockProvider           │
                │   'server'         → serverProvider          │
                └─────────────────┬───────────────────────────┘
                          ┌───────┴────────┐
                          ▼                ▼
                ┌──────────────┐  ┌────────────────────────────┐
                │ mockProvider │  │ serverProvider             │
                │ (os-mock.ts) │  │  - tries upstream once     │
                │              │  │  - 2.5s timeout            │
                │ always works │  │  - any failure → mock      │
                └──────────────┘  │  - never exposes secrets   │
                                  └────────────────────────────┘
```

### Contracts

All shapes live in `lib/garrettos/types.ts` and are the single source of truth
for what "live data" looks like. Every provider method returns a
`ProviderResult<T>` envelope:

```ts
type ProviderResult<T> = {
  data: T;
  source: 'mock' | 'server' | 'stale';
  warning?: string;     // present only when we fell back
  fetchedAt: string;    // ISO timestamp
};
```

Contracts implemented:

| Contract | Route | What it carries |
|----------|-------|-----------------|
| `SystemHealth` / `HealthPayload` | `/api/garrettos/health` | health rows + telemetry |
| `AgentSession` / `AgentsPayload` | `/api/garrettos/agents` | sessions, fleet, graph, approvals |
| `TaskRun` / `TasksPayload` | `/api/garrettos/tasks` | OpenClaw task queue |
| `MemoryStats` / `MemoryEvent` / `MemoryPayload` | `/api/garrettos/memory` | stats, neural index, decisions, todos, projects |
| `IntegrationStatus` / `IntegrationsPayload` | `/api/garrettos/integrations` | readiness rows + stats |
| `ModelRoute` / `ApiUsage` / `ModelsPayload` | `/api/garrettos/models` | routing matrix + usage |
| `EventStreamItem` / `EventsPayload` | `/api/garrettos/events` | recent event stream |
| `GarminSummary` | (future) | daily health scores |
| `RevenueSignal` / `OpenClawOpportunity` | (future) | opportunities |

### Files

- `lib/garrettos/types.ts` — typed contracts (the source of truth)
- `lib/garrettos/providers.ts` — `GarrettOSDataProvider` interface, `resolveDataMode`, `ok`
- `lib/garrettos/mock-provider.ts` — wraps `data/os-mock.ts` + `data/integrations-mock.ts`
- `lib/garrettos/server-provider.ts` — calls upstreams, always falls back to mock
- `lib/garrettos/get-provider.ts` — picks provider by mode for route handlers
- `lib/garrettos/use-garrettos-data.ts` — client hook with inline mock fallback
- `app/api/garrettos/*/route.ts` — 7 read-only routes

## 2. Environment variables

All optional. The app defaults to mock mode and renders fully without any of
these set.

| Env | Purpose | Required? |
|-----|---------|-----------|
| `GARRETTOS_DATA_MODE` | `mock` (default) or `server` — switches the provider layer | no |
| `OPENCLAW_VPS_BRIDGE_URL` | Base URL of the Hetzner bridge daemon (health/agents/tasks/events) | no |
| `OPENCLAW_VPS_BRIDGE_TOKEN` | Bearer token — sent as `Authorization: Bearer …` only, never echoed | no |
| `GARMIN_IMPORT_URL` | Endpoint that ingests Garmin CSV/JSON exports | no |
| `OBSIDIAN_MEMORY_API_URL` | Obsidian/OpenClawMemory API base for memory chunks | no |
| `LITELLM_BASE_URL` | LiteLLM gateway base URL for model routing + usage | no |
| `QDRANT_URL` | Qdrant collection endpoint for vector search | no |
| `VALKEY_URL` | Valkey/Redis connection URL for queues + cache | no |

> For the Settings page readiness list, expose the **mode** to the client by
> also setting `NEXT_PUBLIC_GARRETTOS_DATA_MODE`. The bridge URLs/tokens
> themselves are server-only and must NOT be `NEXT_PUBLIC_` prefixed.

## 3. Mock fallback behavior

Mock fallback is **universal and automatic**. No panel ever goes blank.

1. **Route layer:** every `/api/garrettos/*` route is wrapped in try/catch and
   returns `{ data: null, source: 'mock', warning: '<route> failed' }` on any
   error — HTTP 200, never 500.
2. **Server provider:** every method tries the upstream once with a 2.5s
   timeout. On any failure (network, auth, parse, non-2xx) it delegates to the
   matching mock-provider method and stamps `source: 'mock'` (or `'stale'` when
   the provider was in server mode but the upstream was down) with a human
   `warning`.
3. **Client hook:** `useGarrettOSData` calls the route; if the fetch itself
   fails (network, 5xx, JSON parse) it imports the mock dataset directly and
   sets `source: 'mock'`, `warning: 'Live data unavailable — showing mock data'`.
4. **UI:** pages read `data ?? mockConstant` so even a null payload renders the
   mock visuals unchanged. A small `Live`/`Mock`/`Stale` chip + warning line
   labels the data source on wired pages.

## 4. What is live vs mock today

| Surface | Live when | Mock otherwise |
|---------|-----------|----------------|
| Home event stream | `GARRETTOS_DATA_MODE=server` + `OPENCLAW_VPS_BRIDGE_URL` | `osEvents` |
| System model routing matrix | `server` + `LITELLM_BASE_URL` | `osModelRoutes` |
| OpenClaw agent fleet / approvals | `server` + `OPENCLAW_VPS_BRIDGE_URL` | `osAgentFleet`, `osApprovals` |
| OpenClaw task board | `server` + `OPENCLAW_VPS_BRIDGE_URL` | `osTasks` |
| OpenClaw session monitor (tmux) | `server` + `OPENCLAW_VPS_BRIDGE_URL` (`/agents.tmux_sessions`) | `osTmuxSessions` |
| OpenClaw agent health grid | `server` + `OPENCLAW_VPS_BRIDGE_URL` (`/health.agent_health`) | idle/unknown per service |
| OpenClaw event/log stream (filtered) | `server` + `OPENCLAW_VPS_BRIDGE_URL` (`/events` with `scope`) | `osEvents` |
| Scoped logs (`/api/garrettos/logs`) | `server` + `OPENCLAW_VPS_BRIDGE_URL` (`/logs?scope=`) | synthetic mock lines |
| Memory neural index / stats | `server` + `OBSIDIAN_MEMORY_API_URL` | `osNeuralIndex`, `osMemoryStats` |
| Settings live-data readiness | derived from env presence | `liveDataEnvs` |
| System containers / logs / terminal / topology | (not yet provider-backed) | mock |
| Health / Gym / Water / Projects / Mentor | (not yet provider-backed) | mock |

## 5. Future bridge design

### How the Hetzner daemon should write data

The VPS runs a small read-only HTTP daemon ("the bridge") that the Vercel
frontend calls. It must:

1. Expose read-only JSON endpoints under `OPENCLAW_VPS_BRIDGE_URL`:
   - `GET /health`  → `HealthPayload` (includes `agent_health` for the ops grid)
   - `GET /agents`  → `AgentsPayload` (includes `tmux_sessions` + `detected_processes`)
   - `GET /tasks`   → `TasksPayload` (each task carries `updated`, `log_path`, `next_action`)
   - `GET /events`  → `EventsPayload` (each event carries a `scope` of `errors`/`agents`/`system`)
   - `GET /logs?scope=litellm|bridge|tmux|all` → `LogsPayload` (sanitized log lines)
2. Authenticate via a single bearer token (`OPENCLAW_VPS_BRIDGE_TOKEN`), checked
   as `Authorization: Bearer <token>`. Reject 401 on mismatch.
3. Never accept mutations. POST/PUT/DELETE return 405.
4. Never log or echo the token.
5. Pull its data from local sources on the VPS:
   - system health → `node_exporter` / `/proc` / container stats
   - agents → OpenClaw session state / `tmux` / Valkey queue depth
   - tasks → Valkey queue or OpenClaw task store
   - events → tail of the OpenClaw / LiteLLM / Qdrant logs
6. Keep responses small and cacheable for a few seconds to stay within Vercel's
   limits. The frontend already sets `cache: 'no-store'`, but the daemon may
   memoize for ~2s.

### How the Vercel frontend reads data safely

1. Set `GARRETTOS_DATA_MODE=server` plus the bridge URL/token in Vercel env vars
   (server-only, not `NEXT_PUBLIC_`).
2. The frontend calls `/api/garrettos/<route>`; the route handler calls the
   bridge via `serverProvider`. Tokens never reach the browser.
3. Every call is read-only, has a 2.5s timeout, and falls back to mock — so a
   Vercel cold start or a VPS hiccup never breaks the dashboard.
4. The Settings page shows which bridge envs are configured (via
   `NEXT_PUBLIC_GARRETTOS_DATA_MODE` + the public readiness list), so you can
   see at a glance what is live.

## 6. Adding a new live source

1. Add the typed contract to `lib/garrettos/types.ts` (and a `*Payload` if it's
   an aggregated page).
2. Add a method to `GarrettOSDataProvider` in `lib/garrettos/providers.ts`.
3. Implement it in `mockProvider` (wrap the existing mock) and `serverProvider`
   (call the upstream via `safeFetch`, fall back to the mock method on failure).
4. Add a read-only route under `app/api/garrettos/<name>/route.ts` using
   `getProvider()`; wrap in try/catch returning the mock envelope on error.
5. Wire the page with `useGarrettOSData('/api/garrettos/<name>', () => mockData)`.
6. Document the env var in §2 and the surface in §4.

## 7. Safety guarantees

- **Read-only:** every route is `GET` only. No mutations, no dangerous actions.
- **Secret-safe:** bridge tokens are server-only and sent as Authorization
  headers; they are never serialized into responses, warnings, or logs.
- **Crash-proof:** every route returns HTTP 200 with a mock envelope on any
  error. No 500s. No unhandled rejections.
- **Timeout-bounded:** upstream calls abort after 2.5s so a slow VPS can't hang
  a Vercel request.
- **Mock-first:** the app is fully functional with zero env vars configured.

## 8. Agent Operations Center (`/openclaw`)

`/openclaw` is the first truly live operations page. It is the command center
for background AI work and is built entirely on the provider + bridge layer.
**Read-only by design — no mutating actions are wired yet.**

### Panels and their data sources

| Panel | Component | Route | Live field |
|-------|-----------|-------|------------|
| Session monitor | `SessionMonitor` | `/api/garrettos/agents` | `tmux_sessions[]` (name, attached, command, windows, last_seen) |
| Task board (by status) | `TaskBoard` | `/api/garrettos/tasks` | `tasks[]` (status, priority, agent, updated, log_path) |
| Event / log stream | `LogConsole` | `/api/garrettos/events` | `events[]` with `scope` (all/errors/agents/system) |
| Blocked-task rescue | `BlockedRescue` | `/api/garrettos/tasks` | `tasks[]` where `status === 'blocked'` + `next_action` |
| Agent health grid | `AgentHealthGrid` | `/api/garrettos/health` | `agent_health` (9 service booleans) |
| Agent fleet (graph/table) | `AgentGraph` / `AgentFleetTable` | `/api/garrettos/agents` | `fleet[]`, `graph` |
| Pending approvals | inline | `/api/garrettos/agents` | `approvals[]` (mock until bridge can derive them) |
| Compact task queue | `TaskQueue` | `/api/garrettos/tasks` | `tasks[]` |

### Source diagnostics

Every panel renders a `SourceTag` / `StatusChip` showing whether its data is
**Live** (`source: 'server'`), **Stale** (`source: 'stale'`), or **Mock**
(`source: 'mock'`). When the server provider falls back to mock, the panel
also surfaces the `warning` string returned by the hook (e.g. "VPS bridge
agents unreachable — showing mock agent fleet"). This makes fallback
observable instead of silent.

### Scoped logs endpoint

`GET /api/garrettos/logs?scope=litellm|bridge|tmux|all` proxies the bridge
`/logs` endpoint and returns `LogsPayload` (`{ scope, lines[] }`). Lines are
sanitized by the bridge's `scrub()` (tokens/keys redacted) and capped. The
endpoint is read-only, token-protected at the bridge, and falls back to a
synthetic mock log set when no bridge is configured.

### Bridge contract additions (M9)

The Hetzner bridge (`bridge/garrettos_bridge.py`) was hardened to expose the
data the ops center needs, without compromising the read-only contract:

- `/health` now returns `agent_health` — booleans for OpenCode, Claude Code,
  OpenClaw, LiteLLM, Ollama, Valkey, Qdrant, tmux, and Docker, probed via
  `pgrep`, `systemctl is-active`, and local HTTP pings (no remote calls).
- `/agents` now returns `tmux_sessions` enriched with each pane's current
  command (`tmux list-panes -a -F`, read-only) and window count, plus
  `detected_processes` for `opencode`/`claude`/`openclaw`/`codex`/`litellm`/`ollama`.
- `/tasks` now surfaces `updated`, `log_path`, and `next_action` parsed from
  each task markdown file's frontmatter.
- `/events` now tags every event with a `scope` (`errors`/`agents`/`system`)
  so the console filter works against live data, and adds an OpenClaw
  journal source.
- New `/logs?scope=litellm|bridge|tmux|all` endpoint — sanitized, capped,
  token-protected log lines. No command execution from HTTP; only reads
  `journalctl`, `tmux ls`, and a synthetic bridge uptime line.

### Rules honored

- No mutating actions (no approve/deny/restart/deploy buttons do anything).
- No secrets exposed (bridge scrubs all output; tokens are server-only).
- Build stays green; mock fallback is universal.

