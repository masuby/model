-- INFORM Tanzania: one live request per indicator and kind.
-- A new update (or validation) request replaces the indicator's older live request of the same kind,
-- so a changed due date or message never leaves a stale request open. A partial unique index keeps
-- it that way. Additive: safe to run on a database that already has 0004.

-- Keep only the newest live request per (indicator, kind) before the index is created.
update public.data_requests d
   set status = 'cancelled', closed_at = now(), response_note = coalesce(d.response_note, 'Replaced by a newer request')
 where d.status in ('open', 'submitted')
   and exists (
     select 1 from public.data_requests n
      where n.spec_id = d.spec_id and n.kind = d.kind and n.status in ('open', 'submitted')
        and (n.created_at, n.id) > (d.created_at, d.id));

create unique index if not exists data_requests_one_live_idx
  on public.data_requests (spec_id, kind) where status in ('open', 'submitted');

create or replace function public.create_requests(p_spec_ids text[], p_kind text, p_due date default null, p_message text default null)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  n    integer := 0;
  s    text;
  inst text;
  who  text := app.actor_name();
begin
  if not app.is_reviewer() then
    raise exception 'Only PMO reviewers or administrators can send requests' using errcode = '42501';
  end if;
  if p_kind not in ('update', 'validate') then raise exception 'Invalid request kind %', p_kind; end if;
  foreach s in array coalesce(p_spec_ids, '{}'::text[]) loop
    select institution_key into inst from public.indicator_assignments where spec_id = s;
    continue when inst is null;
    update public.data_requests
       set status = 'cancelled', closed_at = now(), closed_by = auth.uid(),
           response_note = coalesce(response_note, 'Replaced by a newer request')
     where spec_id = s and kind = p_kind and status in ('open', 'submitted');
    insert into public.data_requests (spec_id, institution_key, kind, message, due_date, created_by, created_by_name)
    values (s, inst, p_kind, nullif(btrim(p_message), ''), p_due, auth.uid(), who);
    n := n + 1;
  end loop;
  if n > 0 then
    insert into public.audit_log (actor_id, actor_name, action, detail)
    values (auth.uid(), who, 'requested', n || ' ' || p_kind || ' request(s)');
  end if;
  return n;
end $$;

revoke all on function public.create_requests(text[], text, date, text) from public, anon;
grant execute on function public.create_requests(text[], text, date, text) to authenticated;
