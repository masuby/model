-- 0002 — hardening after the Supabase security/performance advisors.
--
-- • Role helpers move to a private `app` schema that PostgREST does not expose, so they can no longer be
--   called as /rest/v1/rpc/* (they are only needed inside RLS policies and functions).
-- • review_submission / revert_value intentionally stay callable by signed-in users: they ARE the
--   approval API and re-check the caller's role server-side.
-- • Covering indexes for foreign keys; a single UPDATE policy on profiles.

create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to anon, authenticated;

create or replace function app.current_app_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select coalesce((select role from public.profiles where id = auth.uid()), 'viewer'::public.app_role) $$;

create or replace function app.is_reviewer()
returns boolean
language sql stable security definer set search_path = public
as $$ select app.current_app_role() in ('pmo', 'admin') $$;

revoke all on function app.current_app_role() from public;
revoke all on function app.is_reviewer() from public;
grant execute on function app.current_app_role() to anon, authenticated;
grant execute on function app.is_reviewer() to anon, authenticated;

-- Functions that used the public helpers.
create or replace function public.review_submission(p_id uuid, p_decision text, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  s        public.submissions;
  c        jsonb;
  reviewer text;
begin
  if not app.is_reviewer() then
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

create or replace function public.revert_value(p_unit_id text, p_ref text, p_unit_name text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare reviewer text;
begin
  if not app.is_reviewer() then
    raise exception 'Only PMO reviewers or administrators can revert values' using errcode = '42501';
  end if;
  select coalesce(nullif(full_name, ''), 'Reviewer') into reviewer from public.profiles where id = auth.uid();
  delete from public.indicator_values where unit_id = p_unit_id and ref = p_ref;
  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), reviewer, 'reverted', p_unit_id, p_unit_name, p_ref);
end $$;

-- Policies → app helpers.
drop policy if exists "profiles: read own or reviewer" on public.profiles;
create policy "profiles: read own or reviewer" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select app.is_reviewer()));

drop policy if exists "profiles: update own name" on public.profiles;
drop policy if exists "profiles: admin manages roles" on public.profiles;
create policy "profiles: update own details or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select app.current_app_role()) = 'admin')
  with check (
    (select app.current_app_role()) = 'admin'
    or (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())))
  );

drop policy if exists "submissions: contributors insert as themselves" on public.submissions;
create policy "submissions: contributors insert as themselves" on public.submissions
  for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'pending' and (select app.current_app_role()) in ('sector', 'pmo', 'admin'));

drop policy if exists "submissions: read own or reviewer" on public.submissions;
create policy "submissions: read own or reviewer" on public.submissions
  for select to authenticated using (author_id = (select auth.uid()) or (select app.is_reviewer()));

drop policy if exists "audit: reviewers read" on public.audit_log;
create policy "audit: reviewers read" on public.audit_log for select to authenticated using ((select app.is_reviewer()));

drop function if exists public.is_reviewer();
drop function if exists public.current_app_role();

-- Covering indexes for foreign keys.
create index if not exists indicator_values_submission_idx on public.indicator_values (submission_id);
create index if not exists indicator_values_updated_by_idx on public.indicator_values (updated_by);
create index if not exists submissions_reviewer_idx on public.submissions (reviewer_id);
