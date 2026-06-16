import { NextResponse } from 'next/server';
import { agentRuns } from '@/data/mock';
import { normalizeOpenClawStatus } from '@/lib/integrations/openclaw/scaffold';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase.from('agent_runs').select('provider,title,repo,status').order('created_at', { ascending: false }).limit(20);
  const runs = (data?.length ? data : agentRuns.map((run) => ({ provider: 'openclaw', title: run.title, repo: null, status: run.status }))) as Array<{ provider: string; title: string; repo: string | null; status: string }>;
  return NextResponse.json({ runs: runs.map((run: { provider: string; title: string; repo: string | null; status: string }) => normalizeOpenClawStatus({ provider: 'openclaw', title: run.title, repo: run.repo ?? undefined, status: run.status as 'queued' | 'running' | 'blocked' | 'review_needed' | 'approved' | 'completed' | 'failed' })) });
}
