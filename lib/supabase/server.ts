import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { env, hasSupabaseBrowserEnv } from '@/lib/env';

export async function createServerSupabaseClient() {
  if (!hasSupabaseBrowserEnv()) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot always write cookies; middleware refreshes sessions.
        }
      }),
    },
  });
}

export async function getUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
