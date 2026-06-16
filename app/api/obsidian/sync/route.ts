import { NextResponse, type NextRequest } from 'next/server';
import { createObsidianSyncEvent } from '@/lib/integrations/obsidian/scaffold';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { vault?: string; paths?: string[] };
  const event = createObsidianSyncEvent({ userId: user.id, vault: body.vault ?? 'default', paths: body.paths ?? [] });
  await supabase.from('dashboard_events').insert({ user_id: user.id, ...event });
  return NextResponse.json({ status: 'queued', chunking: 'scaffold' });
}
