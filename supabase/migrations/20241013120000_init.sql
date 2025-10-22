create extension if not exists "pgcrypto" with schema public;
create extension if not exists "pg_cron" with schema extensions;

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  group_label text,
  host_name text not null,
  cut_off_utc timestamptz not null,
  options_slots timestamptz[] not null,
  options_venues text[] not null,
  currency text default 'GBP',
  status text check (status in ('open','confirmed')) default 'open',
  created_at timestamptz default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.plans(id) on delete cascade,
  display_name text not null,
  choice_slots timestamptz[] not null,
  choice_venue text,
  attendance text check (attendance in ('in','maybe','out')) default 'in',
  pledge_amount numeric(8,2),
  notes text,
  ip_hash text,
  created_at timestamptz default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.plans(id) on delete cascade unique,
  slot timestamptz not null,
  venue text not null,
  per_person_estimate numeric(8,2),
  map_url text,
  confirmed_at timestamptz default now()
);

create table if not exists public.host_tokens (
  token text primary key,
  plan_id uuid references public.plans(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.plans enable row level security;
alter table public.responses enable row level security;
alter table public.decisions enable row level security;
alter table public.host_tokens enable row level security;

create policy if not exists "plans_public_read" on public.plans for select using (true);
create policy if not exists "responses_public_read" on public.responses for select using (true);
create policy if not exists "responses_public_insert" on public.responses for insert with check (true);
create policy if not exists "decisions_public_read" on public.decisions for select using (true);
create policy if not exists "host_tokens_public_read" on public.host_tokens for select using (false);

create or replace function public.prevent_closed_responses()
returns trigger
language plpgsql
as $$
declare
  plan_record public.plans;
begin
  select * into plan_record from public.plans where id = new.plan_id;
  if plan_record is null then
    raise exception 'Plan missing';
  end if;
  if plan_record.status = 'confirmed' then
    raise exception 'Plan already confirmed';
  end if;
  if now() > plan_record.cut_off_utc then
    raise exception 'Cut-off passed';
  end if;
  return new;
end;
$$;

create trigger responses_prevent_closed
before insert or update on public.responses
for each row execute function public.prevent_closed_responses();

create or replace function public.purge_stale_plans()
returns void
language plpgsql
as $$
begin
  delete from public.plans p
  where (
    p.status = 'confirmed' and exists (
      select 1 from public.decisions d where d.plan_id = p.id and d.confirmed_at < now() - interval '30 days'
    )
  )
  or (
    p.status = 'open' and p.cut_off_utc < now() - interval '30 days'
  );
end;
$$;

do $$
begin
  perform cron.unschedule('purge_stale_plans_daily');
exception
  when others then null;
end$$;

select cron.schedule(
  'purge_stale_plans_daily',
  '0 3 * * *',
  $$select public.purge_stale_plans();$$
);
