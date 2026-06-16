import { NextResponse } from 'next/server';
import { vpsMetrics } from '@/data/mock';
import { normalizeVpsSnapshot } from '@/lib/integrations/vps/scaffold';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase.from('vps_metrics').select('cpu_percent,ram_percent,disk_percent,service_status,model_list').order('captured_at', { ascending: false }).limit(10);
  const snapshots = data?.length
    ? data.map((row) => normalizeVpsSnapshot({ host: 'database-host', cpuPercent: row.cpu_percent ?? 0, ramPercent: row.ram_percent ?? 0, diskPercent: row.disk_percent ?? 0, serviceStatus: row.service_status as Record<string, string>, modelList: row.model_list }))
    : vpsMetrics.map((row) => normalizeVpsSnapshot({ host: row.host, cpuPercent: row.cpu, ramPercent: row.ram, diskPercent: row.disk, serviceStatus: { services: row.services }, modelList: [] }));
  return NextResponse.json({ snapshots });
}
