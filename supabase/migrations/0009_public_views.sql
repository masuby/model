-- 0009: no officer's name reaches anonymous clients (issue SEC-02).
--
-- raw_values.author_name, indicator_values.author_name and indicator_validations.validated_by_name were
-- readable by anyone through the API although the site shows only institutions. Anonymous clients now
-- read views without the personal columns; signed-in users keep reading the tables (reviewers see who
-- submitted what). Row-level security applies to the views as to the tables (security_invoker).
--
-- Apply to the live project after 0008.

create or replace view public.indicator_values_public
  with (security_invoker = true) as
  select unit_id, ref, value, authority, dataset, note, updated_at
  from public.indicator_values;

create or replace view public.raw_values_public
  with (security_invoker = true) as
  select spec_id, unit_id, level, value, value_type, method, source, dataset, period, institution_key, submission_id, updated_at
  from public.raw_values;

create or replace view public.indicator_validations_public
  with (security_invoker = true) as
  select id, spec_id, institution_key, request_id, note, validated_at
  from public.indicator_validations;

revoke select on public.indicator_values, public.raw_values, public.indicator_validations from anon;
grant select on public.indicator_values_public, public.raw_values_public, public.indicator_validations_public to anon, authenticated;
