# GarrettOS Mock vs. Live Data Audit

Status snapshot as of the M13 voice-execution bugfix. This documents which
dashboard surfaces are already wired to the live data provider (`useGarrettOSData`
→ `/api/garrettos/*` → server provider → Hetzner bridge) and which are still
rendering hardcoded/mock data. **No mocks were wired in this commit** — the goal
here is a prioritized backlog.

Legend:
- **LIVE** — rendered from `useGarrettOSData` with real bridge data (mock on failure).
- **MOCK** — imports from `@/data/os-mock` or `@/data/mock` directly; no provider.
- **STALE/HARDCODED** — inline constants in the page, no data source at all.
- **Endpoint** — the existing or intended `/api/garrettos/*` route that should drive it.
- **Priority** — P0 (operational truth, wire next) · P1 (valuable) · P2 (nice-to-have / future upstream).

## `/` Home — `CommandWorkspace.tsx`

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| HomeHero | `osSystemHealth`, `osWeather`, `osCurrentProject` | MOCK | `/api/garrettos/health` + `/api/garrettos/memory` (active projects) | P1 |
| Event stream | `useGarrettOSData('/api/garrettos/events')` | LIVE | `/api/garrettos/events` | — |
| AssistantPanel | `osAssistantMessages` | MOCK | future `/api/garrettos/mentor` (LLM) | P2 |
| Task queue | `osTasks` | MOCK | `/api/garrettos/tasks` | P0 |
| Memory timeline | `osMemory` | MOCK | `/api/garrettos/memory` | P1 |
| Revenue / opportunities | `osRevenue`, `osOpportunities` | MOCK | future `/api/garrettos/projects` (Stripe) | P2 |
| Priorities / agenda / active notes | `osPriorities`, `osAgenda`, `osActiveNotes` | STALE | future `/api/garrettos/agenda` | P2 |
| Pinned projects | `osPinnedProjects` | MOCK | `/api/garrettos/memory` (active projects) | P1 |
| Supplements | `supplements` (`@/data/mock`) | MOCK | future `/api/garrettos/water` | P2 |

## `/openclaw` — Agent Operations Center

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| AgentHealthGrid | `useGarrettOSData('/api/garrettos/health')` | LIVE | `/api/garrettos/health` | — |
| SessionMonitor + AgentGraph + fleet table + approvals + tmux cards | `useGarrettOSData('/api/garrettos/agents')` | LIVE | `/api/garrettos/agents` | — |
| TaskBoard + compact queue | `useGarrettOSData('/api/garrettos/tasks')` | LIVE | `/api/garrettos/tasks` | — |
| BlockedRescue | derived from `tasks` (live) | LIVE | `/api/garrettos/tasks` | — |
| LogConsole (event stream) | `useGarrettOSData('/api/garrettos/events')` | LIVE | `/api/garrettos/events` | — |
| ComposioStatusCard | `useGarrettOSData('/api/garrettos/integrations')` | LIVE | `/api/garrettos/integrations` | — |
| Guardrails panel | `osGuardrails` | MOCK | config-driven, not a live probe (acceptable) | P2 |
| Pending approvals list | `osApprovals` (mock fallback constant) | MOCK | `/api/garrettos/agents` already returns approvals — wire the live field | P1 |
| AgentDrawer config (model/system prompt/temp) | local component state | STALE | future `/api/garrettos/agents/config` | P2 |

## `/memory` — Neural Index

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| Stats / neural index / decisions / todos / active projects / timeline | `useGarrettOSData('/api/garrettos/memory')` | LIVE | `/api/garrettos/memory` | — |
| Detail preview pane | inline "Preview not available in mock" | STALE | extend `/api/garrettos/memory` to return chunk text + source link | P1 |

## `/system` — System Health

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| Model routing matrix | `useGarrettOSData('/api/garrettos/models')` | LIVE | `/api/garrettos/models` | — |
| Telemetry chips (CPU/MEM/LAT/API) | inline constants | STALE | `/api/garrettos/health` (telemetry field) | P0 |
| Host metric cards | `vpsMetrics` (`@/data/mock`) | MOCK | `/api/garrettos/health` (host metrics) | P0 |
| Service topology | `osTopology` | MOCK | `/api/garrettos/health` (services) | P1 |
| Containers | `osSystemContainers` | MOCK | `/api/garrettos/health` (containers) — extend bridge | P1 |
| System logs | `osSystemLogs` | MOCK | `/api/garrettos/logs` (exists, unused here) | P0 |
| Terminal overlay | `osTerminalLines` | MOCK | future `/api/garrettos/logs?scope=tmux` | P2 |

## `/projects` — Projects / Revenue

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| Revenue MTD + chart + opportunities + projects table + events + leads | `osRevenue`, `projects`, `osProjectsOpportunities/Events/Leads` (page-local constants) | MOCK | future `/api/garrettos/projects` (Stripe / CRM) | P2 |

## `/health` — Garmin Recovery

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| All vitals + trends + daily summaries | `garminDaily` (`@/data/mock`), `osGarminSummary` | MOCK | future `/api/garrettos/health/garmin` (CSV/FIT import) | P1 |
| CSV/FIT/TCX upload | input placeholder, no handler | STALE | future upload + parse route | P1 |

## `/gym` — Progressive Overload

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| All metrics, lifts table, progression, body inputs | `gymSets`, `gymMetrics`, `gymProgression` (page-local) | MOCK | future `/api/garrettos/gym` (Strava/Garmin strength) | P2 |

## `/water` — Hydration / Supplements

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| Hydration + supplements + streak | `osWaterSummary`, `supplements` (`@/data/mock`) | MOCK | future `/api/garrettos/water` | P2 |
| Log intake | local `useState` only | STALE | future write route | P2 |

## `/mentor` — AI Mentor

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| AssistantPanel conversation | `setTimeout` mock reply | MOCK | future `/api/garrettos/mentor` (LLM provider routing) | P1 |
| Context cards | page-local constants | STALE | aggregate `/api/garrettos/{health,memory,projects,agents}` | P1 |
| Model routing list | `osModelRoutes` (mock) | MOCK | `/api/garrettos/models` (already live) — reuse it | P1 |

## `/settings` — Settings

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| VoiceSettingsPanel | `useVoice()` (browser speech + env AI mode) | LIVE (engine) | n/a (client) | — |
| Integrations section | `useGarrettOSData('/api/garrettos/integrations')` (Composio, etc.) | LIVE | `/api/garrettos/integrations` | — |

## Global chrome

| Component | Current source | Mock/Live/Stale | Endpoint | Priority |
|---|---|---|---|---|
| TopAppBar (status pip / quick stats) | `@/data/os-mock` | MOCK | `/api/garrettos/health` (single pip) | P1 |
| CommandPalette (command list) | `@/data/os-mock` (static nav + tasks) | MOCK | nav is config; task list should pull `/api/garrettos/tasks` | P2 |

## Wiring order recommendation (do not attempt all at once)

1. **P0 — operational truth on `/openclaw` and `/system`:** system logs →
   `/api/garrettos/logs`, telemetry/host metrics → extend `/api/garrettos/health`,
   home task queue → `/api/garrettos/tasks`. These make the dashboard reflect the
   real VPS instead of seeded data.
2. **P1 — memory/mentor/aggregation:** memory detail preview, mentor context
   cards (aggregate existing live endpoints), mentor model list reuse
   `/api/garrettos/models`, pending approvals wired to the live `agents.approvals`
   field, pinned projects from `/api/garrettos/memory`.
3. **P2 — new upstreams needing external integrations:** projects (Stripe),
   health (Garmin import), gym (Strava/Garmin), water, mentor LLM reply. Each
   needs a new bridge endpoint + provider method + types + route before the page
   can switch to `useGarrettOSData`.

## Notes
- Every `useGarrettOSData` call already degrades gracefully to mock with a
  visible `Mock`/`Stale` chip, so wiring a live endpoint is a low-risk swap.
- Hardcoded inline constants (telemetry chips, agenda, mentor context cards) are
  the worst offenders — they never show a mock badge, so they can mislead. Prefer
  moving them behind a provider even if the upstream is still mock.
