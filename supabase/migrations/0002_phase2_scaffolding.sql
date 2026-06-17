-- GarrettOS Phase 2 clean scaffolding migration.
-- This file adds integration-facing tables without changing the Phase 1 UI.

create extension if not exists pgcrypto;

do $$ begin
  create type phase2_agent_status as enum ('queued','running','blocked','review_needed','approved','completed','failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type phase2_approval_status as enum ('pending','approved','rejected','expired');
exception when duplicate_object then null;
end $$;

create table if not exists garmin_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text,
  file_type text not null check (file_type in ('csv','fit','tcx')),
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists obsidian_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vault text not null,
  paths text[] not null default '{}',
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  title text not null,
  repo text,
  status phase2_agent_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null references agent_runs(id) on delete cascade,
  status phase2_approval_status not null default 'pending',
  notes text,
  decided_at timestamptz
);

create table if not exists vps_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  host text not null,
  cpu_percent numeric(5,2),
  ram_percent numeric(5,2),
  disk_percent numeric(5,2),
  service_status jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

alter table garmin_imports enable row level security;
alter table obsidian_sync_jobs enable row level security;
alter table agent_runs enable row level security;
alter table agent_approvals enable row level security;
alter table vps_metric_snapshots enable row level security;

drop policy if exists "garmin imports owner access" on garmin_imports;
create policy "garmin imports owner access" on garmin_imports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "obsidian sync jobs owner access" on obsidian_sync_jobs;
create policy "obsidian sync jobs owner access" on obsidian_sync_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "agent runs owner access" on agent_runs;
create policy "agent runs owner access" on agent_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "agent approvals owner access" on agent_approvals;
create policy "agent approvals owner access" on agent_approvals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "vps metric snapshots owner access" on vps_metric_snapshots;
create policy "vps metric snapshots owner access" on vps_metric_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
