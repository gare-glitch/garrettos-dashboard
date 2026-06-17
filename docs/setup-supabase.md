# Supabase setup

1. Create a Supabase project for GarrettOS.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never expose it to browser code.
4. Configure Supabase Auth redirect URLs for local development and the Vercel production URL:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>/auth/callback`
5. Run the SQL migrations in `supabase/migrations`.
6. Confirm Row Level Security is enabled before entering real health, memory, or agent data.
