# Phase 2 TODO

## Completed scaffolding in this PR

- Add typed Supabase clients for browser and server usage.
- Add auth callback route for Supabase magic-link sessions.
- Add `.env.example` for public and server-only configuration.
- Convert dashboard pages to server-side data loaders with Supabase-backed reads and mock fallbacks.
- Add Garmin, Obsidian, OpenClaw, and VPS API route scaffolds.
- Add generated owner-only RLS policy pattern for all schema tables.

## Remaining Phase 2 work

- Generate Supabase types from the deployed database instead of maintaining handwritten draft types.
- Add seed data scripts for the live Supabase project.
- Implement Garmin CSV parsing, then FIT/TCX parsing in server-only workers.
- Implement private Supabase Storage buckets and upload flows for Garmin files, Obsidian exports, and progress photos.
- Implement Obsidian markdown ingestion, chunking, and vector indexing.
- Connect OpenClaw API with signed server-side requests and approval enforcement.
- Connect real VPS metrics collectors for Ollama, LiteLLM, Qdrant, Valkey, Docker, CPU, RAM, and disk.
- Add automated tests and CI once package registry access is available.
