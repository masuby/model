-- 0007: disaster-management committee roles with an area scope, and committee records with a review
-- chain by level (decision D8; issues GOV-01, GOV-02, GOV-03, GOV-04, RC-04, RC-05).
--
-- Roles: ddrrc (district committee: one council), rdrrc (regional committee: one region and its
-- councils), ndrrc (national committee). profiles.scope_unit_id names the council ('C001') or region
-- ('R-dodoma') a committee member acts for; only an administrator sets it.
--
-- Committee records carry the content the committees own, on the chain of the Risk Action Guide Book:
--   kind 'drr'      DRR capacity arrangements (EPRP, AA, ERT, RVCA, EOCC)
--   kind 'guidance' "Know your risk" statements (where the danger lies, what helps; English and Kiswahili)
--   kind 'event'    hazard event reports (date, impacts, source)
--   kind 'warning'  official warnings transcribed from TMA bulletins (level, areas, validity, issuer)
-- A council record is submitted by its DDRRC (or the RDRRC, NDRRC, PMO-DMD) and approved by the RDRRC
-- of its region; a region record by the RDRRC, approved by the NDRRC; a national record by the NDRRC,
-- approved by PMO-DMD (national vulnerability-and-coping guidance: PMO-DMD drafts, the NDRRC reviews).
-- PMO-DMD and administrators may submit and approve anything; nobody approves their own report.
-- Warnings are recorded by the NDRRC or PMO-DMD and published at once; they may be withdrawn.
-- Approved records are public and feed the area profiles.

alter type public.app_role add value if not exists 'ddrrc';
alter type public.app_role add value if not exists 'rdrrc';
alter type public.app_role add value if not exists 'ndrrc';

alter table public.profiles
  add column if not exists scope_unit_id text check (scope_unit_id is null or scope_unit_id ~ '^(R-[a-z0-9]{2,40}|C[0-9]{3})$');
grant update (scope_unit_id) on public.profiles to authenticated;

create or replace function app.current_scope()
returns text
language sql stable security definer set search_path = public
as $$ select scope_unit_id from public.profiles where id = auth.uid() $$;
revoke all on function app.current_scope() from public;
grant execute on function app.current_scope() to anon, authenticated;

-- Non-admins may edit their own name, but neither their role, institution nor area scope.
drop policy if exists "profiles: update own details or admin" on public.profiles;
create policy "profiles: update own details or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select app.current_app_role()) = 'admin')
  with check (
    (select app.current_app_role()) = 'admin'
    or (id = (select auth.uid())
        and role = (select app.current_app_role())
        and institution_key is not distinct from (select app.current_institution())
        and scope_unit_id is not distinct from (select app.current_scope()))
  );

-- ---------------------------------------------------------------------------------------------------
create table if not exists public.committee_records (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('drr', 'guidance', 'event', 'warning')),
  unit_id       text not null check (unit_id ~ '^(TZ|R-[a-z0-9]{2,40}|C[0-9]{3})$'),
  level         text not null check (level in ('council', 'region', 'national')),
  unit_name     text not null check (length(unit_name) between 2 and 120),
  region        text not null default '',
  region_id     text check (region_id is null or region_id ~ '^R-[a-z0-9]{2,40}$'),
  hazard        text check (hazard is null or hazard ~ '^[A-Za-z]{2,40}$'),
  payload       jsonb not null check (jsonb_typeof(payload) = 'object'),
  source        text not null check (length(source) between 3 and 500),
  note          text check (note is null or length(note) <= 2000),
  valid_from    date,
  valid_to      date,
  author_id     uuid not null default auth.uid() references auth.users (id),
  author_name   text not null,
  author_role   text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewer_id   uuid references auth.users (id),
  reviewer_name text,
  review_note   text check (review_note is null or length(review_note) <= 2000),
  check ((level = 'region') = (unit_id like 'R-%')),
  check ((level = 'national') = (unit_id = 'TZ')),
  check (level = 'national' or region_id is not null),
  check (valid_from is null or valid_to is null or valid_from <= valid_to)
);
create index if not exists committee_records_unit_idx on public.committee_records (kind, unit_id, status, created_at desc);
create index if not exists committee_records_status_idx on public.committee_records (status, created_at desc);
create index if not exists committee_records_author_idx on public.committee_records (author_id, created_at desc);
create index if not exists committee_records_reviewer_idx on public.committee_records (reviewer_id);

alter table public.committee_records enable row level security;
revoke all on public.committee_records from public, anon, authenticated;
grant select on public.committee_records to anon, authenticated;

-- Approved records are public; pending and rejected ones are seen by their author, by reviewers and
-- by committee members (whose scope is enforced when they decide).
drop policy if exists "committee records: approved are public" on public.committee_records;
create policy "committee records: approved are public" on public.committee_records
  for select to anon, authenticated using (status = 'approved');
drop policy if exists "committee records: author, committees and reviewers" on public.committee_records;
create policy "committee records: author, committees and reviewers" on public.committee_records
  for select to authenticated
  using (author_id = (select auth.uid()) or (select app.is_reviewer()) or (select app.current_app_role())::text in ('ddrrc', 'rdrrc', 'ndrrc'));

-- Who may record what: warnings only the NDRRC, PMO-DMD and administrators; otherwise PMO-DMD,
-- administrators and the NDRRC anywhere, an RDRRC within its region (the region and its councils), a
-- DDRRC for its council only; national content never by a DDRRC or RDRRC.
create or replace function app.can_record_committee(p_kind text, p_unit_id text, p_level text, p_region_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when p_kind = 'warning' then app.is_reviewer() or app.current_app_role()::text = 'ndrrc'
    when app.is_reviewer() or app.current_app_role()::text = 'ndrrc' then true
    when p_level = 'national' then false
    when app.current_app_role()::text = 'rdrrc' then app.current_scope() is not null and app.current_scope() = p_region_id
    when app.current_app_role()::text = 'ddrrc' then p_level = 'council' and app.current_scope() is not null and app.current_scope() = p_unit_id
    else false
  end
$$;
revoke all on function app.can_record_committee(text, text, text, text) from public;
grant execute on function app.can_record_committee(text, text, text, text) to anon, authenticated;

create or replace function public.submit_committee_record(
  p_kind text, p_unit_id text, p_level text, p_unit_name text, p_region text, p_region_id text, p_hazard text, p_payload jsonb, p_source text,
  p_note text default null, p_valid_from date default null, p_valid_to date default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  new_id uuid;
  who    text := app.actor_name();
  role   text := app.current_app_role()::text;
begin
  if p_kind not in ('drr', 'guidance', 'event', 'warning') then raise exception 'Invalid kind %', p_kind; end if;
  if p_level not in ('council', 'region', 'national') then raise exception 'Invalid level %', p_level; end if;
  if not app.can_record_committee(p_kind, p_unit_id, p_level, p_region_id) then
    raise exception 'Your role cannot record this for this area' using errcode = '42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'Nothing recorded'; end if;
  if length(coalesce(btrim(p_source), '')) < 3 then raise exception 'Say what the record rests on'; end if;
  if p_kind = 'warning' and (p_hazard is null or jsonb_typeof(p_payload -> 'areas') <> 'array' or (p_payload ->> 'alertLevel') not in ('1', '2', '3')) then
    raise exception 'A warning needs a hazard, a level and its areas';
  end if;

  -- Warnings are published at once (the NDRRC records them from the bulletin; PMO-DMD is accountable).
  insert into public.committee_records (kind, unit_id, level, unit_name, region, region_id, hazard, payload, source, note, valid_from, valid_to, author_name, author_role,
                                        status, reviewed_at, reviewer_id, reviewer_name)
  values (p_kind, p_unit_id, p_level, btrim(p_unit_name), coalesce(btrim(p_region), ''), p_region_id, p_hazard, p_payload, btrim(p_source), nullif(btrim(p_note), ''),
          p_valid_from, p_valid_to, who, role,
          case when p_kind = 'warning' then 'approved' else 'pending' end,
          case when p_kind = 'warning' then now() else null end,
          case when p_kind = 'warning' then auth.uid() else null end,
          case when p_kind = 'warning' then who else null end)
  returning id into new_id;

  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), who, 'submitted', p_unit_id, btrim(p_unit_name), 'Committee record (' || p_kind || ') · ' || btrim(p_source));
  return new_id;
end $$;
revoke all on function public.submit_committee_record(text, text, text, text, text, text, text, jsonb, text, text, date, date) from public, anon;
grant execute on function public.submit_committee_record(text, text, text, text, text, text, text, jsonb, text, text, date, date) to authenticated;

-- Approve or reject a record on the chain; withdraw a warning (reject it while approved).
create or replace function public.review_committee_record(p_id uuid, p_decision text, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r    public.committee_records;
  who  text := app.actor_name();
  role text := app.current_app_role()::text;
  ok   boolean;
begin
  if p_decision not in ('approved', 'rejected') then raise exception 'Invalid decision %', p_decision; end if;
  select * into r from public.committee_records where id = p_id for update;
  if not found then raise exception 'Record not found'; end if;
  if r.kind = 'warning' then
    if not (r.status = 'approved' and p_decision = 'rejected') then raise exception 'A warning can only be withdrawn'; end if;
    ok := app.is_reviewer() or role = 'ndrrc';
  else
    if r.status <> 'pending' then raise exception 'Record already reviewed'; end if;
    ok := app.is_reviewer()
       or (r.author_id <> auth.uid()
           and ((r.level = 'council' and role = 'rdrrc' and app.current_scope() is not null and app.current_scope() = r.region_id)
                or (r.level = 'region' and role = 'ndrrc')
                or (r.level = 'national' and r.kind = 'guidance' and (r.payload ->> 'topic') = 'vc' and role = 'ndrrc')));
  end if;
  if not ok then
    raise exception 'This record is decided by the next level of the committee chain' using errcode = '42501';
  end if;

  update public.committee_records
     set status = p_decision, reviewed_at = now(), reviewer_id = auth.uid(), reviewer_name = who, review_note = nullif(btrim(p_note), '')
   where id = p_id;

  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), who, p_decision, r.unit_id, r.unit_name, 'Committee record (' || r.kind || ')' || coalesce(' · ' || nullif(btrim(p_note), ''), ''));
end $$;
revoke all on function public.review_committee_record(uuid, text, text) from public, anon;
grant execute on function public.review_committee_record(uuid, text, text) to authenticated;
