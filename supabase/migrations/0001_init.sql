-- INFORM Tanzania — shared data backend (Supabase / Postgres)
--
-- Model
--   profiles          one row per auth user; role drives permissions (viewer < sector < pmo < admin)
--   submissions       proposed indicator changes for one unit (council or INFORM source unit)
--   indicator_values  the APPROVED values the public map reads (one row per unit × indicator)
--   audit_log         append-only trail of submissions, approvals, rejections and reverts
--
-- Security
--   • Everyone (anon included) may READ approved indicator_values — the public map shows them.
--   • Sector officers may INSERT submissions (as themselves) and read their own.
--   • PMO / admin read every submission and approve or reject via review_submission(), a
--     SECURITY DEFINER function that re-checks the caller's role server-side.
--   • Nobody writes indicator_values or audit_log directly; only the functions do.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('viewer', 'sector', 'pmo', 'admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  institution text,
  role        public.app_role not null default 'viewer',
  created_at  timestamptz not null default now()
);

create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  unit_id       text not null check (length(unit_id) between 2 and 32),
  unit_name     text not null,
  region        text not null default '',
  changes       jsonb not null check (jsonb_typeof(changes) = 'array' and jsonb_array_length(changes) between 1 and 64),
  authority     text not null,
  dataset       text,
  note          text check (note is null or length(note) <= 2000),
  author_id     uuid not null default auth.uid() references auth.users (id),
  author_name   text not null,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewer_id   uuid references auth.users (id),
  reviewer_name text,
  review_note   text
);
create index if not exists submissions_status_idx on public.submissions (status, created_at desc);
create index if not exists submissions_author_idx on public.submissions (author_id, created_at desc);

create table if not exists public.indicator_values (
  unit_id       text not null,
  ref           text not null check (ref ~ '^(hazard|vulnerability|coping):[A-Za-z]+$'),
  value         numeric(4, 1) check (value is null or value between 0 and 10),
  authority     text,
  dataset       text,
  note          text,
  submission_id uuid references public.submissions (id) on delete set null,
  author_name   text,
  updated_by    uuid references auth.users (id),
  updated_at    timestamptz not null default now(),
  primary key (unit_id, ref)
);

create table if not exists public.audit_log (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  actor_id   uuid,
  actor_name text,
  action     text not null check (action in ('submitted', 'approved', 'rejected', 'reverted', 'imported', 'reset')),
  unit_id    text,
  unit_name  text,
  detail     text
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);

-- ---------------------------------------------------------------------------------------------------
-- Helpers
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select coalesce((select role from public.profiles where id = auth.uid()), 'viewer'::public.app_role) $$;

create or replace function public.is_reviewer()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.current_app_role() in ('pmo', 'admin') $$;

-- New auth users get a viewer profile; an admin promotes them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Log every new submission.
create or replace function public.log_submission()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (new.author_id, new.author_name, 'submitted', new.unit_id, new.unit_name,
          jsonb_array_length(new.changes) || ' change(s) · ' || new.authority);
  return new;
end $$;

drop trigger if exists on_submission_created on public.submissions;
create trigger on_submission_created after insert on public.submissions
for each row execute function public.log_submission();

-- ---------------------------------------------------------------------------------------------------
-- Review (approve / reject). Approval writes every change into indicator_values atomically.
create or replace function public.review_submission(p_id uuid, p_decision text, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  s        public.submissions;
  c        jsonb;
  reviewer text;
begin
  if not public.is_reviewer() then
    raise exception 'Only PMO reviewers or administrators can review submissions' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision %', p_decision;
  end if;

  select * into s from public.submissions where id = p_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.status <> 'pending' then raise exception 'Submission already reviewed'; end if;

  select coalesce(nullif(full_name, ''), 'Reviewer') into reviewer from public.profiles where id = auth.uid();

  if p_decision = 'approved' then
    for c in select * from jsonb_array_elements(s.changes) loop
      insert into public.indicator_values (unit_id, ref, value, authority, dataset, note, submission_id, author_name, updated_by, updated_at)
      values (
        s.unit_id,
        c ->> 'ref',
        case when c -> 'value' is null or jsonb_typeof(c -> 'value') = 'null' then null else round((c ->> 'value')::numeric, 1) end,
        s.authority, s.dataset, s.note, s.id,
        s.author_name || case when s.author_id <> auth.uid() then ' · approved by ' || reviewer else '' end,
        auth.uid(), now()
      )
      on conflict (unit_id, ref) do update set
        value = excluded.value, authority = excluded.authority, dataset = excluded.dataset, note = excluded.note,
        submission_id = excluded.submission_id, author_name = excluded.author_name,
        updated_by = excluded.updated_by, updated_at = excluded.updated_at;
    end loop;
  end if;

  update public.submissions
     set status = p_decision, reviewed_at = now(), reviewer_id = auth.uid(), reviewer_name = reviewer, review_note = p_note
   where id = p_id;

  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), reviewer, p_decision, s.unit_id, s.unit_name, p_note);
end $$;

-- Revert one approved value back to the shipped baseline.
create or replace function public.revert_value(p_unit_id text, p_ref text)
returns void
language plpgsql security definer set search_path = public
as $$
declare reviewer text;
begin
  if not public.is_reviewer() then
    raise exception 'Only PMO reviewers or administrators can revert values' using errcode = '42501';
  end if;
  select coalesce(nullif(full_name, ''), 'Reviewer') into reviewer from public.profiles where id = auth.uid();
  delete from public.indicator_values where unit_id = p_unit_id and ref = p_ref;
  insert into public.audit_log (actor_id, actor_name, action, unit_id, detail)
  values (auth.uid(), reviewer, 'reverted', p_unit_id, p_ref);
end $$;

revoke all on function public.review_submission(uuid, text, text) from public, anon;
revoke all on function public.revert_value(text, text) from public, anon;
grant execute on function public.review_submission(uuid, text, text) to authenticated;
grant execute on function public.revert_value(text, text) to authenticated;

-- ---------------------------------------------------------------------------------------------------
-- Row-level security
alter table public.profiles         enable row level security;
alter table public.submissions      enable row level security;
alter table public.indicator_values enable row level security;
alter table public.audit_log        enable row level security;

drop policy if exists "profiles: read own or reviewer" on public.profiles;
create policy "profiles: read own or reviewer" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_reviewer()));

drop policy if exists "profiles: update own name" on public.profiles;
create policy "profiles: update own name" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())));

drop policy if exists "profiles: admin manages roles" on public.profiles;
create policy "profiles: admin manages roles" on public.profiles
  for update to authenticated using ((select public.current_app_role()) = 'admin');

drop policy if exists "values: public read" on public.indicator_values;
create policy "values: public read" on public.indicator_values for select to anon, authenticated using (true);

drop policy if exists "submissions: contributors insert as themselves" on public.submissions;
create policy "submissions: contributors insert as themselves" on public.submissions
  for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'pending' and (select public.current_app_role()) in ('sector', 'pmo', 'admin'));

drop policy if exists "submissions: read own or reviewer" on public.submissions;
create policy "submissions: read own or reviewer" on public.submissions
  for select to authenticated using (author_id = (select auth.uid()) or (select public.is_reviewer()));

drop policy if exists "audit: reviewers read" on public.audit_log;
create policy "audit: reviewers read" on public.audit_log for select to authenticated using ((select public.is_reviewer()));

grant select on public.indicator_values to anon, authenticated;
grant select, insert on public.submissions to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.audit_log to authenticated;
