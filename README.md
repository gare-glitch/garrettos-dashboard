# GarrettOS

GarrettOS is a private, mobile-first Next.js dashboard for Garrett's life operations and OpenClaw system. Phase 1 ships a maintainable dashboard shell with mock Garmin, OpenClaw, Obsidian, VPS, and revenue data so the app works visually before integrations are wired.

## Current structure

- `app/(dashboard)/*` — auth-gated dashboard routes for Home, Health, Gym, Water/Supplements, AI Mentor, OpenClaw Control, Memory, System Health, and Projects/Revenue.
- `components/*` — shared shell, cards, and lightweight chart components.
- `data/mock.ts` — typed mock data for Phase 1 UI.
- `supabase/migrations/0001_phase1_schema.sql` — Supabase schema draft for typed, user-scoped tables.
- `docs/architecture.md` — security and integration architecture notes.
- `docs/phase-2-todo.md` — next implementation steps.

## Environment

Client-safe variables only:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Keep Supabase service-role keys, Anthropic keys, OpenClaw bridge credentials, GitHub tokens, and VPS credentials in server-only Vercel environment variables.

## Deployment

The app is designed for Vercel and includes a GitHub Actions workflow in `.github/workflows/vercel.yml`. Run the migration draft in Supabase after reviewing and expanding the RLS policies for every table.
