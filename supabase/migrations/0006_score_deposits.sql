-- 0006: deposits of 0-10 scores computed by institutions (entry path B of the data-management design).
--
-- A submission of measured values now says what its values are: measured values in the indicator's
-- own unit ('raw', the default, standardised by the engine with the workbook method) or 0-10 scores
-- the institution computed with that same method ('score', e.g. with the NORMAL Excel tool). A score
-- deposit must cite its source (INFORM uses open, published data) and every score must lie within
-- 0 and 10. Approval copies the type, method and source into raw_values, where the engine reads them
-- and keeps them in the lineage of every recomputed value.

alter table public.raw_submissions
  add column if not exists value_type text not null default 'raw' check (value_type in ('raw', 'score')),
  add column if not exists method     text check (method is null or length(method) <= 40),
  add column if not exists source     text check (source is null or length(source) <= 500);

alter table public.raw_values
  add column if not exists value_type text not null default 'raw' check (value_type in ('raw', 'score')),
  add column if not exists method     text,
  add column if not exists source     text;

-- Submit measured values or deposited scores for one indicator.
-- Entries: [{ "unit_id": "TZ" | "R-..." | "C001", "level": ..., "value": number | null }].
drop function if exists public.submit_raw_values(text, jsonb, text, text, text, uuid);
create or replace function public.submit_raw_values(
  p_spec_id text, p_entries jsonb, p_dataset text, p_period text default null, p_note text default null, p_request_id uuid default null,
  p_value_type text default 'raw', p_method text default null, p_source text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  r        jsonb;
  seen     text[] := '{}';
  v_unit   text;
  v_num    double precision;
  inst     text;
  req      public.data_requests;
  new_id   uuid;
  who      text := app.actor_name();
  ind_name text;
  vtype    text := coalesce(nullif(btrim(p_value_type), ''), 'raw');
begin
  if not app.can_enter(p_spec_id) then
    raise exception 'Your institution is not assigned to this indicator' using errcode = '42501';
  end if;
  select name into ind_name from public.indicators where spec_id = p_spec_id;
  if ind_name is null then raise exception 'Unknown indicator %', p_spec_id; end if;
  if vtype not in ('raw', 'score') then raise exception 'Invalid value type %', vtype; end if;
  if vtype = 'score' and (p_method is null or btrim(p_method) <> 'inform') then
    raise exception 'Deposited scores must be computed with the INFORM method';
  end if;
  if vtype = 'score' and length(coalesce(btrim(p_source), '')) < 3 then
    raise exception 'Cite the source the scores come from';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) = 0 then
    raise exception 'No values to submit';
  end if;
  for r in select * from jsonb_array_elements(p_entries) loop
    v_unit := r ->> 'unit_id';
    if v_unit is null or v_unit !~ '^(TZ|R-[a-z0-9]{2,40}|C[0-9]{3})$' then raise exception 'Invalid unit %', v_unit; end if;
    if (r ->> 'level') is distinct from (case when v_unit = 'TZ' then 'national' when v_unit like 'R-%' then 'region' else 'council' end) then
      raise exception 'Level does not match unit %', v_unit;
    end if;
    if jsonb_typeof(r -> 'value') not in ('number', 'null') then raise exception 'Invalid value for %', v_unit; end if;
    if vtype = 'score' and jsonb_typeof(r -> 'value') = 'number' then
      v_num := (r ->> 'value')::double precision;
      if v_num < 0 or v_num > 10 then raise exception 'Scores must lie between 0 and 10 (%)', v_unit; end if;
    end if;
    if v_unit = any (seen) then raise exception 'Unit % appears twice', v_unit; end if;
    seen := seen || v_unit;
  end loop;

  select institution_key into inst from public.indicator_assignments where spec_id = p_spec_id;
  inst := coalesce(inst, app.current_institution());

  if p_request_id is not null then
    select * into req from public.data_requests where id = p_request_id for update;
    if not found or req.spec_id <> p_spec_id then raise exception 'The request does not match this indicator'; end if;
    if req.status not in ('open', 'submitted') then raise exception 'The request is already closed'; end if;
    update public.data_requests set status = 'submitted' where id = p_request_id;
  end if;

  insert into public.raw_submissions (spec_id, institution_key, request_id, entries, dataset, period, note, author_name, value_type, method, source)
  values (p_spec_id, inst, p_request_id, p_entries, btrim(p_dataset), nullif(btrim(p_period), ''), nullif(btrim(p_note), ''), who,
          vtype, case when vtype = 'score' then 'inform' else null end, nullif(btrim(p_source), ''))
  returning id into new_id;

  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), who, 'submitted', p_spec_id, ind_name,
          jsonb_array_length(p_entries) || case when vtype = 'score' then ' score(s) · ' else ' value(s) · ' end || btrim(p_dataset));
  return new_id;
end $$;

revoke all on function public.submit_raw_values(text, jsonb, text, text, text, uuid, text, text, text) from public, anon;
grant execute on function public.submit_raw_values(text, jsonb, text, text, text, uuid, text, text, text) to authenticated;

-- Approve or reject a submission. Approval writes raw_values (with the value type, method and source)
-- and closes its request.
create or replace function public.review_raw_submission(p_id uuid, p_decision text, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  s   public.raw_submissions;
  r   jsonb;
  who text := app.actor_name();
begin
  if not app.is_reviewer() then
    raise exception 'Only PMO reviewers or administrators can review submissions' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'Invalid decision %', p_decision; end if;

  select * into s from public.raw_submissions where id = p_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.status <> 'pending' then raise exception 'Submission already reviewed'; end if;

  if p_decision = 'approved' then
    for r in select * from jsonb_array_elements(s.entries) loop
      insert into public.raw_values (spec_id, unit_id, level, value, value_type, method, source, dataset, period, institution_key, submission_id, author_name, updated_by, updated_at)
      values (
        s.spec_id, r ->> 'unit_id', r ->> 'level',
        case when jsonb_typeof(r -> 'value') = 'number' then (r ->> 'value')::double precision else null end,
        coalesce(s.value_type, 'raw'), s.method, s.source,
        s.dataset, s.period, s.institution_key, s.id,
        s.author_name || case when s.author_id <> auth.uid() then ' · approved by ' || who else '' end,
        auth.uid(), now()
      )
      on conflict (spec_id, unit_id) do update set
        level = excluded.level, value = excluded.value, value_type = excluded.value_type, method = excluded.method, source = excluded.source,
        dataset = excluded.dataset, period = excluded.period,
        institution_key = excluded.institution_key, submission_id = excluded.submission_id, author_name = excluded.author_name,
        updated_by = excluded.updated_by, updated_at = excluded.updated_at;
    end loop;
    if s.request_id is not null then
      update public.data_requests set status = 'done', closed_at = now(), closed_by = auth.uid()
       where id = s.request_id and status in ('open', 'submitted');
    end if;
  elsif s.request_id is not null then
    update public.data_requests set status = 'open' where id = s.request_id and status = 'submitted';
  end if;

  update public.raw_submissions
     set status = p_decision, reviewed_at = now(), reviewer_id = auth.uid(), reviewer_name = who, review_note = nullif(btrim(p_note), '')
   where id = p_id;

  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), who, p_decision, s.spec_id, (select name from public.indicators where spec_id = s.spec_id), nullif(btrim(p_note), ''));
end $$;
