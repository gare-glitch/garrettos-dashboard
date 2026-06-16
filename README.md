# GarrettOS

GarrettOS is a private, mobile-first Next.js dashboard for Garrett's life operations and OpenClaw system. Phase 2 adds Supabase-authenticated, database-backed scaffolding while keeping mock fallbacks until integrations are fully implemented.

## Current structure

- `app/(dashboard)/*` — auth-gated dashboard routes for Home, Health, Gym, Water/Supplements, AI Mentor, OpenClaw Control, Memory, System Health, and Projects/Revenue.
- `app/api/*` — Phase 2 scaffolds for Garmin imports, Obsidian sync, OpenClaw status, and VPS metrics.
- `app/auth/callback` — Supabase auth code exchange route for magic links.
- `components/*` — shared shell, cards, and lightweight chart components.
- `data/mock.ts` — typed fallback data while Supabase tables are empty.
- `lib/dashboard-data.ts` — server-side data loaders that prefer Supabase and fall back to mock data.
- `lib/integrations/*` — integration scaffolding without full provider implementations.
- `supabase/migrations/0001_phase1_schema.sql` — typed, user-scoped Supabase schema draft with RLS policies.
- `docs/architecture.md` — security and integration architecture notes.
- `docs/phase-2-todo.md` — remaining Phase 2 implementation steps.

## Environment

Copy `.env.example` and fill in deployed values. Client-safe variables only:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Keep Supabase service-role keys, Anthropic keys, OpenClaw bridge credentials, GitHub tokens, and VPS credentials in server-only Vercel environment variables.

## Deployment

The app is designed for Vercel and includes a GitHub Actions workflow in `.github/workflows/vercel.yml`. Run the migration draft in Supabase after reviewing the generated owner-only RLS policy block.
