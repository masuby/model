-- 0003 — found by the end-to-end role test (sector / reviewer / anonymous) against the live database.
--
-- 1. The profiles UPDATE policy compared the new role with a sub-select on profiles, which Postgres
--    rejects as infinite policy recursion — so NO user could update their own profile. Compare with the
--    security-definer helper instead (it reads the stored role without re-entering RLS).
-- 2. Supabase's default privileges grant every table to anon/authenticated. RLS already filters rows,
--    but grant only what each role actually needs (defence in depth).

drop policy if exists "profiles: update own details or admin" on public.profiles;
create policy "profiles: update own details or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select app.current_app_role()) = 'admin')
  with check ((select app.current_app_role()) = 'admin' or (id = (select auth.uid()) and role = (select app.current_app_role())));

revoke all on public.profiles, public.submissions, public.indicator_values, public.audit_log from anon, authenticated;
grant select on public.indicator_values to anon, authenticated;
grant select, insert on public.submissions to authenticated;
grant select on public.audit_log to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, institution, role) on public.profiles to authenticated;
revoke all on sequence public.audit_log_id_seq from anon, authenticated;
