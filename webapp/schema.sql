-- LUKO Twin HQ — Supabase schema
-- Run this once in your Supabase project's SQL editor (Project → SQL Editor → New query → paste → Run).

create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text,
  status text not null default 'active' check (status in ('active', 'waiting', 'parked', 'done')),
  next text,
  start_date date,
  end_date date,
  budget numeric,
  size text check (size in ('S', 'M', 'L', 'XL')),
  progress int not null default 0 check (progress between 0 and 100),
  tasks jsonb not null default '[]'::jsonb,
  mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  org text,
  relation text,
  channel text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text,
  amount numeric,
  status text not null default 'draft' check (status in ('draft', 'sent', 'discussing', 'won', 'lost')),
  sent date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  client text,
  item text,
  amount numeric,
  due date,
  status text not null default 'pending' check (status in ('pending', 'invoiced', 'overdue', 'paid')),
  created_at timestamptz not null default now()
);

create table if not exists signals (
  id uuid primary key default gen_random_uuid(),
  source text,
  title text not null,
  detail text,
  severity text not null default 'info' check (severity in ('info', 'warn', 'high', 'critical')),
  url text,
  seen boolean not null default false,
  ts timestamptz not null default now()
);

create table if not exists now_tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  done boolean not null default false,
  due date,
  created_at timestamptz not null default now()
);

-- updated_at auto-touch on projects
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- Row Level Security: locked down. The app talks to Supabase using the
-- service_role key from the server only, which bypasses RLS — so these
-- tables stay inaccessible to the public anon key / browser entirely.
alter table projects enable row level security;
alter table people enable row level security;
alter table proposals enable row level security;
alter table payments enable row level security;
alter table signals enable row level security;
alter table now_tasks enable row level security;
