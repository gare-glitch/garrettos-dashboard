import { agentRuns, garminDaily, gymSets, notes, projects, supplements, vpsMetrics } from '@/data/mock';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type GarminSummaryRow = { summary_date: string; resting_hr: number | null; stress_avg: number | null; body_battery: number | null; steps: number | null; calories: number | null };
type GymSetRow = { reps: number | null; weight: number | null; set_number: number };
type SupplementRow = { name: string; schedule_slot: string; inventory_count: number | null; low_threshold: number };
type AgentRunRow = { title: string; status: string };
type NoteRow = { title: string; vault: string; tags: string[] };
type VpsMetricRow = { host_id: string; cpu_percent: number | null; ram_percent: number | null; disk_percent: number | null; service_status: unknown };
type ProjectRow = { name: string; status: string; revenue_target: number | null };

export async function getHealthData() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return garminDaily;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return garminDaily;
  const { data } = await supabase.from('garmin_daily_summaries').select('*').order('summary_date', { ascending: true }).limit(14);
  const rows = (data ?? []) as GarminSummaryRow[];
  if (!rows.length) return garminDaily;
  return rows.map((row: GarminSummaryRow) => ({
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
  const rows = (data ?? []) as GymSetRow[];
  if (!rows.length) return gymSets;
  return rows.map((set: GymSetRow) => ({ exercise: `Database lift ${set.set_number}`, sets: `${set.reps ?? 0} reps`, weight: `${set.weight ?? 0} lb`, trend: 'tracked', location: 'Supabase' }));
}

export async function getSupplementData() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return supplements;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return supplements;
  const { data } = await supabase.from('supplements').select('name, schedule_slot, inventory_count, low_threshold').eq('active', true).order('schedule_slot');
  const rows = (data ?? []) as SupplementRow[];
  if (!rows.length) return supplements;
  return rows.map((item: SupplementRow) => ({ name: item.name, slot: item.schedule_slot, inventory: item.inventory_count ?? 0, status: (item.inventory_count ?? 0) <= item.low_threshold ? 'low' : 'scheduled' }));
}

export async function getAgentRuns() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return agentRuns;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return agentRuns;
  const { data } = await supabase.from('agent_runs').select('title, status').order('created_at', { ascending: false }).limit(8);
  const rows = (data ?? []) as AgentRunRow[];
  if (!rows.length) return agentRuns;
  return rows.map((run: AgentRunRow) => ({ title: run.title, status: run.status, approval: run.status === 'review_needed' ? 'waiting' : 'tracked' }));
}

export async function getMemoryNotes() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return notes;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return notes;
  const { data } = await supabase.from('obsidian_notes').select('title, vault, tags').order('updated_at', { ascending: false }).limit(10);
  const rows = (data ?? []) as NoteRow[];
  if (!rows.length) return notes;
  return rows.map((note: NoteRow) => ({ title: note.title, source: note.vault, tags: note.tags }));
}

export async function getVpsMetrics() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return vpsMetrics;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return vpsMetrics;
  const { data } = await supabase.from('vps_metrics').select('cpu_percent, ram_percent, disk_percent, service_status, host_id').order('captured_at', { ascending: false }).limit(6);
  const rows = (data ?? []) as VpsMetricRow[];
  if (!rows.length) return vpsMetrics;
  return rows.map((metric: VpsMetricRow) => ({ host: `Host ${metric.host_id.slice(0, 8)}`, cpu: metric.cpu_percent ?? 0, ram: metric.ram_percent ?? 0, disk: metric.disk_percent ?? 0, services: JSON.stringify(metric.service_status) }));
}

export async function getProjectData() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return projects;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return projects;
  const { data } = await supabase.from('projects').select('name, status, revenue_target, metadata').order('created_at', { ascending: false }).limit(8);
  const rows = (data ?? []) as ProjectRow[];
  if (!rows.length) return projects;
  return rows.map((project: ProjectRow) => ({ name: project.name, revenue: `$${project.revenue_target ?? 0}`, status: project.status, next: 'Database-backed task' }));
}
