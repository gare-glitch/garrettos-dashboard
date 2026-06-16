import { agentRuns, garminDaily, gymSets, notes, projects, supplements, vpsMetrics } from '@/data/mock';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getHealthData() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return garminDaily;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return garminDaily;
  const { data } = await supabase.from('garmin_daily_summaries').select('*').order('summary_date', { ascending: true }).limit(14);
  if (!data?.length) return garminDaily;
  return data.map((row) => ({
    date: new Date(row.summary_date).toLocaleDateString('en-US', { weekday: 'short' }),
    sleepScore: 0,
    hrv: 0,
    restingHr: row.resting_hr ?? 0,
    stress: row.stress_avg ?? 0,
    bodyBattery: row.body_battery ?? 0,
    steps: row.steps ?? 0,
    calories: row.calories ?? 0,
  }));
}

export async function getGymData() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return gymSets;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return gymSets;
  const { data } = await supabase.from('gym_sets').select('reps, weight, set_number').order('set_number').limit(12);
  if (!data?.length) return gymSets;
  return data.map((set) => ({ exercise: `Database lift ${set.set_number}`, sets: `${set.reps ?? 0} reps`, weight: `${set.weight ?? 0} lb`, trend: 'tracked', location: 'Supabase' }));
}

export async function getSupplementData() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return supplements;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return supplements;
  const { data } = await supabase.from('supplements').select('name, schedule_slot, inventory_count, low_threshold').eq('active', true).order('schedule_slot');
  if (!data?.length) return supplements;
  return data.map((item) => ({ name: item.name, slot: item.schedule_slot, inventory: item.inventory_count ?? 0, status: (item.inventory_count ?? 0) <= item.low_threshold ? 'low' : 'scheduled' }));
}

export async function getAgentRuns() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return agentRuns;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return agentRuns;
  const { data } = await supabase.from('agent_runs').select('title, status').order('created_at', { ascending: false }).limit(8);
  if (!data?.length) return agentRuns;
  return data.map((run) => ({ title: run.title, status: run.status, approval: run.status === 'review_needed' ? 'waiting' : 'tracked' }));
}

export async function getMemoryNotes() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return notes;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return notes;
  const { data } = await supabase.from('obsidian_notes').select('title, vault, tags').order('updated_at', { ascending: false }).limit(10);
  if (!data?.length) return notes;
  return data.map((note) => ({ title: note.title, source: note.vault, tags: note.tags }));
}

export async function getVpsMetrics() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return vpsMetrics;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return vpsMetrics;
  const { data } = await supabase.from('vps_metrics').select('cpu_percent, ram_percent, disk_percent, service_status, host_id').order('captured_at', { ascending: false }).limit(6);
  if (!data?.length) return vpsMetrics;
  return data.map((metric) => ({ host: `Host ${metric.host_id.slice(0, 8)}`, cpu: metric.cpu_percent ?? 0, ram: metric.ram_percent ?? 0, disk: metric.disk_percent ?? 0, services: JSON.stringify(metric.service_status) }));
}

export async function getProjectData() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return projects;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return projects;
  const { data } = await supabase.from('projects').select('name, status, revenue_target, metadata').order('created_at', { ascending: false }).limit(8);
  if (!data?.length) return projects;
  return data.map((project) => ({ name: project.name, revenue: `$${project.revenue_target ?? 0}`, status: project.status, next: 'Database-backed task' }));
}
