# GarrettOS Phase 1 Architecture

## Boundaries

GarrettOS is a private dashboard. The browser can receive only public configuration that is safe to expose, such as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The Supabase anon key is not a trust boundary; Row Level Security must scope every query to the signed-in user.

Server-only secrets stay in Vercel environment variables and must never be imported by client components. This includes Supabase service-role keys, Anthropic keys, OpenClaw bridge tokens, GitHub tokens, and VPS credentials.

## Data access

- Client components may read/write user-scoped rows through Supabase anon auth once RLS policies are complete.
- Server routes or server actions will own privileged operations: AI provider calls, service-role maintenance jobs, VPS bridge requests, and GitHub automation.
- Health, memory, project, revenue, and agent data must include `user_id` and enforce `auth.uid() = user_id` policies.
- Supabase Storage buckets for progress photos and imports should use private buckets with user-prefixed paths and storage policies.

## Agent safety

OpenClaw actions that can mutate code, deploy infrastructure, spend money, or contact external systems are represented as `agent_actions`. Privileged actions require an `agent_approvals` record before a Phase 2 server worker can execute them.

## AI providers

The AI Mentor page is intentionally UI-only in Phase 1. Phase 2 should add server endpoints that select Anthropic, LiteLLM, Ollama, or the OpenClaw VPS bridge without exposing provider keys to the browser.

## Phase 2 scaffolding

Phase 2 introduces database-backed read paths with mock fallbacks. Dashboard pages call server-side data loaders that read Supabase through the authenticated session when environment variables and cookies are available. If the database has no rows yet, the UI falls back to Phase 1 mock data so deployment stays reviewable.

API route scaffolds are intentionally thin:

- `POST /api/garmin/import` validates CSV/FIT/TCX filenames and records a dashboard event for future parsers.
- `POST /api/obsidian/sync` records an Obsidian sync event for future note ingestion and chunking.
- `GET /api/openclaw/status` reads agent runs and annotates which statuses require approval.
- `GET /api/vps/metrics` reads VPS snapshots and normalizes health status.

These routes require a Supabase-authenticated user. Future server workers may use service-role credentials, but those keys must remain server-only.
