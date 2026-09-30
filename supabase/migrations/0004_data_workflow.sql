-- 0004: institutional data workflow
--
-- The PMO assigns each workbook indicator to the institution that owns its data, sends update and
-- validation requests with a due date, and reviews what institutions submit. Institutions submit
-- MEASURED values (natural units) for one indicator at national, region and/or council level; the site
-- standardises them with the INFORM workbook method (src/engine/risk/rawValues.ts).
--
--   institutions            data owners and global sources (NBS, TMA, MoH ... UNHCR, INFORM)
--   indicators              the 78 workbook indicators (53 INFORM + 25 advanced), for integrity
--   indicator_assignments   the institution responsible for each indicator
--   data_requests           update / validation requests to an institution, with a due date
--   raw_submissions         measured values for one indicator, waiting for PMO review
--   raw_values              the APPROVED measured values the public model reads
--   indicator_validations   "values confirmed current" stamps from the owning institution
--
-- Security: everyone may read institutions, indicators, assignments, approved values and validations
-- (the public site shows where every number comes from). Requests and submissions are visible to
-- reviewers and to members of the institution concerned. Every write goes through a SECURITY DEFINER
-- function that re-checks the caller's role and institution and writes an audit entry.

-- ---------------------------------------------------------------------------------------------------
-- Institutions and indicators
-- ---------------------------------------------------------------------------------------------------
create table if not exists public.institutions (
  key        text primary key check (key ~ '^[A-Z0-9_]{2,16}$'),
  label      text not null check (length(label) between 1 and 40),
  full_name  text not null check (length(full_name) between 1 and 200),
  kind       text not null default 'national' check (kind in ('national', 'global')),
  created_at timestamptz not null default now()
);

insert into public.institutions (key, label, full_name, kind) values
  ('NBS', 'NBS', 'National Bureau of Statistics', 'national'),
  ('OCGS', 'OCGS', 'Office of the Chief Government Statistician (Zanzibar)', 'national'),
  ('PMO', 'PMO-DMD', 'Prime Minister''s Office, Disaster Management Department', 'national'),
  ('PORALG', 'PO-RALG', 'President''s Office, Regional Administration and Local Government', 'national'),
  ('DRRC', 'DRRC', 'Regional and District Disaster Management Committee', 'national'),
  ('TMA', 'TMA', 'Tanzania Meteorological Authority', 'national'),
  ('NEMC', 'NEMC', 'National Environment Management Council', 'national'),
  ('GST', 'GST', 'Geological Survey of Tanzania', 'national'),
  ('TFS', 'TFS', 'Tanzania Forest Services Agency', 'national'),
  ('MOA', 'MoA', 'Ministry of Agriculture', 'national'),
  ('MOW', 'MoW', 'Ministry of Water', 'national'),
  ('MOH', 'MoH', 'Ministry of Health', 'national'),
  ('MOLHHSD', 'MLHHSD', 'Ministry of Lands, Housing and Human Settlements Development', 'national'),
  ('MOEST', 'MoEST', 'Ministry of Education, Science and Technology', 'national'),
  ('MOWORKS', 'MoWT', 'Ministry of Works and Transport', 'national'),
  ('MOFP', 'MoFP', 'Ministry of Finance and Planning', 'national'),
  ('MOHA', 'MoHA', 'Ministry of Home Affairs', 'national'),
  ('TCRA', 'TCRA', 'Tanzania Communications Regulatory Authority', 'national'),
  ('TANROADS', 'TANROADS', 'Tanzania National Roads Agency', 'national'),
  ('TARURA', 'TARURA', 'Tanzania Rural and Urban Roads Agency', 'national'),
  ('TPF', 'TPF', 'Tanzania Police Force (Traffic)', 'national'),
  ('TACAIDS', 'TACAIDS', 'Tanzania Commission for AIDS', 'national'),
  ('NMCP', 'NMCP', 'National Malaria Control Programme', 'national'),
  ('TFNC', 'TFNC', 'Tanzania Food and Nutrition Centre', 'national'),
  ('MUCHALI', 'MUCHALI/IPC', 'Tanzania Food Security and Nutrition Analysis System (IPC)', 'national'),
  ('TRCS', 'TRCS', 'Tanzania Red Cross Society', 'national'),
  ('UNHCR', 'UNHCR', 'UNHCR, the UN Refugee Agency', 'global'),
  ('WFP', 'WFP', 'World Food Programme', 'global'),
  ('FEWSNET', 'FEWS NET', 'Famine Early Warning Systems Network', 'global'),
  ('CHC', 'CHIRPS/ERA5', 'CHIRPS v3 rainfall and ERA5 temperature (computed)', 'global'),
  ('USGS', 'USGS', 'U.S. Geological Survey earthquake catalogue', 'global'),
  ('INFORM', 'INFORM SADC', 'INFORM Sub-national SADC 2024 baseline', 'global')
on conflict (key) do nothing;

create table if not exists public.indicators (
  spec_id   text primary key check (spec_id ~ '^[A-Z]{2}\.[A-Z]{2,3}\.[A-Za-z0-9-]+$'),
  name      text not null,
  unit      text,
  component text,
  dimension text,
  core      boolean not null default true
);

insert into public.indicators (spec_id, name, unit, component, dimension, core) values
  ('HA.NAT.CH-ERO', 'Coastal Erosion', 'meters / year', 'Coastal hazards', 'Hazards & Exposure', true),
  ('HA.NAT.DR-FRE', 'Historic Drought Frequency', 'years', 'Drought', 'Hazards & Exposure', true),
  ('HA.NAT.EQ-EXP', 'Earthquake exposure', 'index', 'Earthquake', 'Hazards & Exposure', true),
  ('HA.NAT.ED-DEF', 'Deforestation - Treecover Loss', '%', 'Environmental Degradation', 'Hazards & Exposure', true),
  ('HA.NAT.DE-ERO', 'Soil Erosion', 'Mg/ha/yr', 'Environmental Degradation', 'Hazards & Exposure', true),
  ('HA.NAT.FL-EXP', 'Flood exposure', '%', 'Flood', 'Hazards & Exposure', true),
  ('HA.NAT.LS-EXP', 'Landslide exposure', '%', 'Landslide', 'Hazards & Exposure', true),
  ('HA.NAT.ST-TC2', 'Cyclone exposure - max speed', '%', 'Storms & Cyclone', 'Hazards & Exposure', true),
  ('HA.NAT.VC-EXP', 'Volcano exposure', 'index', 'Volcano', 'Hazards & Exposure', true),
  ('HA.NAT.WF-BURN', 'Burned Area', '%', 'Wildfire', 'Hazards & Exposure', true),
  ('HA.NAT.WF-FWI', 'Fire Weather Index', 'index', 'Wildfire', 'Hazards & Exposure', true),
  ('HA.HUM.CR-GCRI', 'GCRI derived Conflict probability', '%', 'Conflict Risk', 'Hazards & Exposure', true),
  ('HA.HUM.CI-CBAR', 'Conflict Barometer', 'Index', 'Conflict Intensity', 'Hazards & Exposure', true),
  ('HA.HUM.VIO-EVE', 'Number of Events', 'Number', 'Internal Violence', 'Hazards & Exposure', true),
  ('HA.HUM.VIO-FAT', 'Number of Fatalities', 'Number', 'Internal Violence', 'Hazards & Exposure', true),
  ('VU.SE.POV-HDI', 'Human Development Index', 'index', 'Development & Poverty', 'Vulnerability', true),
  ('VU.SE.POV-MPI', 'Multidimensional Poverty Index', 'index', 'Development & Poverty', 'Vulnerability', true),
  ('VU.SE.POV-GDI', 'Gender Development Index', 'index', 'Development & Poverty', 'Vulnerability', true),
  ('VU.SE.POV-GINI', 'Wealth Inequality', 'index', 'Development & Poverty', 'Vulnerability', true),
  ('VU.SE.DEP-ODA', 'Net ODA received (% of GNI)', '%', 'Economic Dependency', 'Vulnerability', true),
  ('VU.SE.DEP-REM', 'Personal remittances', '%', 'Economic Dependency', 'Vulnerability', true),
  ('VU.SE.DEP-DR', 'Dependency Ratio', 'ratio', 'Economic Dependency', 'Vulnerability', true),
  ('VU.SE.HAB-INF', 'Population in informal settlements', '%', 'Habitat', 'Vulnerability', true),
  ('VU.SE.HAB-URB', 'Urban Population', '%', 'Habitat', 'Vulnerability', true),
  ('VU.SE.LV-FS', 'Food Security - Insufficient food', '% pop phase 2 or higher', 'Livelihoods', 'Vulnerability', true),
  ('VU.VG.DP-IDP', 'Internal Displaced People', 'number of people', 'Displaced People', 'Vulnerability', true),
  ('VU.VG.HC-LEXP', 'Life Expectancy', 'years', 'Health Conditions', 'Vulnerability', true),
  ('VU.VG.HC-MALAPREV', 'Malaria prevalence', 'max malaria prevalence per person', 'Health Conditions', 'Vulnerability', true),
  ('VU.VG.HC-MEASLES', 'Measles Incidence', 'per 1,000,000 population', 'Health Conditions', 'Vulnerability', true),
  ('VU.VG.CH-MORTNEO', 'Neonatal mortality', 'per 1,000 live births', 'Children Health and Nutrition', 'Vulnerability', true),
  ('VU.VG.CH-MORTINF', 'Infant mortality', 'per 1,000 live births', 'Children Health and Nutrition', 'Vulnerability', true),
  ('VU.VG.CH-MORTCH', 'Child mortality', 'per 1,000 live births', 'Children Health and Nutrition', 'Vulnerability', true),
  ('VU.VG.CH-UW', 'Children Underweight', '%', 'Children Health and Nutrition', 'Vulnerability', true),
  ('CC.INF.HC-EXP', 'Health expenditure per capita', 'US$ per capita', 'Access to health care', 'Coping Capacity', true),
  ('CC.INF.HC-BCG', 'BCG Immunization Coverage', '%', 'Access to health care', 'Coping Capacity', true),
  ('CC.INF.HC-DTP', 'DTP3 Immunization Coverage', '%', 'Access to health care', 'Coping Capacity', true),
  ('CC.INF.HC-MEASLES', 'Measles Immunization Coverage', '%', 'Access to health care', 'Coping Capacity', true),
  ('CC.INF.HC-PHY', 'Physicians density', 'per 10,000 population', 'Access to health care', 'Coping Capacity', true),
  ('CC.INF.HC-FAC', 'Density of health facilities', 'per capita', 'Access to health care', 'Coping Capacity', true),
  ('CC.INF.ECO-INC', 'Household income', 'US$ per capita', 'Economic capacity', 'Coping Capacity', true),
  ('CC.INF.ECO-IWI', 'International Wealth Index', 'index', 'Economic capacity', 'Coping Capacity', true),
  ('CC.INF.ECO-GDP', 'Gross National Income per capita', 'Log - Thousands of US$', 'Economic capacity', 'Coping Capacity', true),
  ('CC.INF.WASH-SAN', 'People using at least basic sanitation services (% of population)', '%', 'WASH', 'Coping Capacity', true),
  ('CC.INF.WASH-WF', 'People using at least basic drinking water services (% of population)', '%', 'WASH', 'Coping Capacity', true),
  ('CC.INF.COM-ELEC', 'Access to electricity', '%', 'Communication', 'Coping Capacity', true),
  ('CC.INF.COM-INT', 'Internet access', '%', 'Communication', 'Coping Capacity', true),
  ('CC.INF.COM-PHONE', 'Cellphone ownership', '%', 'Communication', 'Coping Capacity', true),
  ('CC.INF.EDU-YRS', 'Mean years at school', 'years', 'Education', 'Coping Capacity', true),
  ('CC.INF.EDU-ALIT', 'Adult literacy rate', '%', 'Education', 'Coping Capacity', true),
  ('CC.INS.DRR-SEN', 'Sendai Framework for Action', 'index', 'DRR implementation', 'Coping Capacity', true),
  ('CC.INS.DRR-EWS', 'Early Warning System', 'number of people', 'DRR implementation', 'Coping Capacity', true),
  ('CC.INS.GOV-EFF', 'Government effectiveness', 'index', 'Governance', 'Coping Capacity', true),
  ('CC.INS.GOV-SCI', 'Subnational Corruption Index', 'index', 'Governance', 'Coping Capacity', true),
  ('HA.NAT.DR-SPEI', 'SPEI-12 drought depth', 'index', 'Drought', 'Hazards & Exposure', false),
  ('HA.NAT.DR-ARID', 'Aridity (P/PET)', 'ratio', 'Drought', 'Hazards & Exposure', false),
  ('HA.NAT.DR-CV', 'Rainfall variability (CV)', 'ratio', 'Drought', 'Hazards & Exposure', false),
  ('HA.NAT.DR-SEAS', 'Growing-season failure frequency', 'fraction', 'Drought', 'Hazards & Exposure', false),
  ('HA.NAT.DR-NDVI', 'Mean NDVI (greenness)', 'index', 'Drought', 'Hazards & Exposure', false),
  ('HA.NAT.DR-SOIL', 'Soil moisture', 'mm', 'Drought', 'Hazards & Exposure', false),
  ('HA.NAT.DR-WLEV', 'Water levels (% of normal)', '%', 'Drought', 'Hazards & Exposure', false),
  ('HA.NAT.FL-R50', 'Extreme wet days (>50 mm)', 'days/yr', 'Flood', 'Hazards & Exposure', false),
  ('HA.NAT.FL-R100', 'Very-heavy days (>100 mm)', 'days/yr', 'Flood', 'Hazards & Exposure', false),
  ('HA.NAT.FL-WLEV', 'River peak above normal', 'm', 'Flood', 'Hazards & Exposure', false),
  ('HA.NAT.FL-BASIN', 'Basin flood records', 'events/decade', 'Flood', 'Hazards & Exposure', false),
  ('HA.NAT.FL-EVENT', 'Recorded flood impact events', 'events/decade', 'Flood', 'Hazards & Exposure', false),
  ('HA.NAT.LS-SUSC', 'Slope susceptibility (mean)', 'degrees', 'Landslide', 'Hazards & Exposure', false),
  ('HA.NAT.LS-RAIN', 'Triggering rainfall (max 1-day)', 'mm', 'Landslide', 'Hazards & Exposure', false),
  ('HA.NAT.ST-FREQ', 'Cyclone/strong-wind frequency', 'events/decade', 'Storms & Cyclone', 'Hazards & Exposure', false),
  ('HA.NAT.ST-WIND', 'Extreme wind speed', 'm/s', 'Storms & Cyclone', 'Hazards & Exposure', false),
  ('HA.NAT.EQ-PGA', 'Seismic hazard (PGA 475-yr)', 'g', 'Earthquake', 'Hazards & Exposure', false),
  ('HA.NAT.EQ-HIST', 'Historical seismicity density', 'events/100yr', 'Earthquake', 'Hazards & Exposure', false),
  ('HA.NAT.CO-WAVE', 'Significant wave height (Hs 99th pct)', 'm', 'Coastal hazards', 'Hazards & Exposure', false),
  ('HA.NAT.CO-WIND', 'Extreme onshore wind', 'm/s', 'Coastal hazards', 'Hazards & Exposure', false),
  ('HA.NAT.CO-SURGE', 'Storm-surge frequency', 'events/decade', 'Coastal hazards', 'Hazards & Exposure', false),
  ('HA.NAT.CO-EROS', 'Shoreline retreat / erosion rate', 'm/yr', 'Coastal hazards', 'Hazards & Exposure', false),
  ('HA.NAT.CO-MANG', 'Mangrove loss (protective buffer)', '%/decade', 'Coastal hazards', 'Hazards & Exposure', false),
  ('HA.NAT.HW-DAYS', 'Hot days (Tmax > 35C)', 'days/yr', 'Heatwave', 'Hazards & Exposure', false),
  ('HA.NAT.LI-FLASH', 'Flash density', 'flashes/km2/yr', 'Lightning', 'Hazards & Exposure', false)
on conflict (spec_id) do update set
  name = excluded.name, unit = excluded.unit, component = excluded.component, dimension = excluded.dimension, core = excluded.core;

-- ---------------------------------------------------------------------------------------------------
-- A user's institution (set by an administrator, like the role)
-- ---------------------------------------------------------------------------------------------------
alter table public.profiles add column if not exists institution_key text references public.institutions (key) on delete set null;
create index if not exists profiles_institution_key_idx on public.profiles (institution_key);

create or replace function app.current_institution()
returns text
language sql stable security definer set search_path = public
as $$ select institution_key from public.profiles where id = auth.uid() $$;

create or replace function app.actor_name()
returns text
language sql stable security definer set search_path = public
as $$ select coalesce(nullif((select full_name from public.profiles where id = auth.uid()), ''), 'User') $$;

-- Non-admins may edit their own name, but neither their role nor their institution.
drop policy if exists "profiles: update own details or admin" on public.profiles;
create policy "profiles: update own details or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select app.current_app_role()) = 'admin')
  with check (
    (select app.current_app_role()) = 'admin'
    or (id = (select auth.uid())
        and role = (select app.current_app_role())
        and institution_key is not distinct from (select app.current_institution()))
  );
grant update (institution_key) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------------------------------
-- Assignments, requests, submissions, approved values, validations
-- ---------------------------------------------------------------------------------------------------
create table if not exists public.indicator_assignments (
  spec_id         text primary key references public.indicators (spec_id) on delete cascade,
  institution_key text not null references public.institutions (key),
  note            text check (note is null or length(note) <= 1000),
  assigned_by     uuid references auth.users (id),
  assigned_at     timestamptz not null default now()
);
create index if not exists indicator_assignments_institution_idx on public.indicator_assignments (institution_key);
create index if not exists indicator_assignments_assigned_by_idx on public.indicator_assignments (assigned_by);

create table if not exists public.data_requests (
  id              uuid primary key default gen_random_uuid(),
  spec_id         text not null references public.indicators (spec_id) on delete cascade,
  institution_key text not null references public.institutions (key),
  kind            text not null check (kind in ('update', 'validate')),
  message         text check (message is null or length(message) <= 2000),
  due_date        date,
  status          text not null default 'open' check (status in ('open', 'submitted', 'done', 'cancelled')),
  created_by      uuid references auth.users (id),
  created_by_name text not null,
  created_at      timestamptz not null default now(),
  closed_at       timestamptz,
  closed_by       uuid references auth.users (id),
  response_note   text check (response_note is null or length(response_note) <= 2000)
);
create index if not exists data_requests_institution_status_idx on public.data_requests (institution_key, status);
create index if not exists data_requests_spec_idx on public.data_requests (spec_id);
create index if not exists data_requests_created_by_idx on public.data_requests (created_by);
create index if not exists data_requests_closed_by_idx on public.data_requests (closed_by);

create table if not exists public.raw_submissions (
  id              uuid primary key default gen_random_uuid(),
  spec_id         text not null references public.indicators (spec_id) on delete cascade,
  institution_key text references public.institutions (key),
  request_id      uuid references public.data_requests (id) on delete set null,
  entries         jsonb not null check (jsonb_typeof(entries) = 'array' and jsonb_array_length(entries) between 1 and 260),
  dataset         text not null check (length(dataset) between 2 and 200),
  period          text check (period is null or length(period) <= 40),
  note            text check (note is null or length(note) <= 2000),
  author_id       uuid not null default auth.uid() references auth.users (id),
  author_name     text not null,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewer_id     uuid references auth.users (id),
  reviewer_name   text,
  review_note     text check (review_note is null or length(review_note) <= 2000)
);
create index if not exists raw_submissions_status_idx on public.raw_submissions (status, created_at desc);
create index if not exists raw_submissions_spec_idx on public.raw_submissions (spec_id);
create index if not exists raw_submissions_institution_idx on public.raw_submissions (institution_key);
create index if not exists raw_submissions_author_idx on public.raw_submissions (author_id, created_at desc);
create index if not exists raw_submissions_reviewer_idx on public.raw_submissions (reviewer_id);
create index if not exists raw_submissions_request_idx on public.raw_submissions (request_id);

create table if not exists public.raw_values (
  spec_id         text not null references public.indicators (spec_id) on delete cascade,
  unit_id         text not null check (unit_id ~ '^(TZ|R-[a-z0-9]{2,40}|C[0-9]{3})$'),
  level           text not null check (level in ('national', 'region', 'council')),
  value           double precision,
  dataset         text,
  period          text,
  institution_key text references public.institutions (key),
  submission_id   uuid references public.raw_submissions (id) on delete set null,
  author_name     text,
  updated_by      uuid references auth.users (id),
  updated_at      timestamptz not null default now(),
  primary key (spec_id, unit_id),
  check ((level = 'national') = (unit_id = 'TZ') and (level = 'region') = (unit_id like 'R-%'))
);
create index if not exists raw_values_submission_idx on public.raw_values (submission_id);
create index if not exists raw_values_updated_by_idx on public.raw_values (updated_by);
create index if not exists raw_values_institution_idx on public.raw_values (institution_key);

create table if not exists public.indicator_validations (
  id                bigserial primary key,
  spec_id           text not null references public.indicators (spec_id) on delete cascade,
  institution_key   text references public.institutions (key),
  request_id        uuid references public.data_requests (id) on delete set null,
  note              text check (note is null or length(note) <= 2000),
  validated_by      uuid references auth.users (id),
  validated_by_name text not null,
  validated_at      timestamptz not null default now()
);
create index if not exists indicator_validations_spec_idx on public.indicator_validations (spec_id, validated_at desc);
create index if not exists indicator_validations_request_idx on public.indicator_validations (request_id);
create index if not exists indicator_validations_validated_by_idx on public.indicator_validations (validated_by);
create index if not exists indicator_validations_institution_idx on public.indicator_validations (institution_key);

-- New audit actions.
alter table public.audit_log drop constraint if exists audit_log_action_check;
alter table public.audit_log add constraint audit_log_action_check
  check (action in ('submitted', 'approved', 'rejected', 'reverted', 'imported', 'reset', 'assigned', 'requested', 'validated', 'closed'));

-- ---------------------------------------------------------------------------------------------------
-- Row-level security and grants
-- ---------------------------------------------------------------------------------------------------
alter table public.institutions enable row level security;
alter table public.indicators enable row level security;
alter table public.indicator_assignments enable row level security;
alter table public.data_requests enable row level security;
alter table public.raw_submissions enable row level security;
alter table public.raw_values enable row level security;
alter table public.indicator_validations enable row level security;

drop policy if exists "institutions: public read" on public.institutions;
create policy "institutions: public read" on public.institutions for select to anon, authenticated using (true);
drop policy if exists "indicators: public read" on public.indicators;
create policy "indicators: public read" on public.indicators for select to anon, authenticated using (true);
drop policy if exists "assignments: public read" on public.indicator_assignments;
create policy "assignments: public read" on public.indicator_assignments for select to anon, authenticated using (true);
drop policy if exists "raw values: public read" on public.raw_values;
create policy "raw values: public read" on public.raw_values for select to anon, authenticated using (true);
drop policy if exists "validations: public read" on public.indicator_validations;
create policy "validations: public read" on public.indicator_validations for select to anon, authenticated using (true);

drop policy if exists "requests: reviewers or the institution" on public.data_requests;
create policy "requests: reviewers or the institution" on public.data_requests
  for select to authenticated
  using ((select app.is_reviewer()) or institution_key = (select app.current_institution()));

drop policy if exists "raw submissions: author, institution or reviewer" on public.raw_submissions;
create policy "raw submissions: author, institution or reviewer" on public.raw_submissions
  for select to authenticated
  using (
    author_id = (select auth.uid())
    or (select app.is_reviewer())
    or (institution_key is not null and institution_key = (select app.current_institution()))
  );

revoke all on public.institutions, public.indicators, public.indicator_assignments, public.data_requests,
  public.raw_submissions, public.raw_values, public.indicator_validations from anon, authenticated;
grant select on public.institutions, public.indicators, public.indicator_assignments, public.raw_values,
  public.indicator_validations to anon, authenticated;
grant select on public.data_requests, public.raw_submissions to authenticated;
revoke all on sequence public.indicator_validations_id_seq from anon, authenticated;

-- ---------------------------------------------------------------------------------------------------
-- The workflow API (each function re-checks the caller and writes the audit trail)
-- ---------------------------------------------------------------------------------------------------

-- Reviewers may enter any indicator; a sector officer only those assigned to their institution.
create or replace function app.can_enter(p_spec_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select app.is_reviewer()
      or (app.current_app_role() = 'sector'
          and app.current_institution() is not null
          and exists (select 1 from public.indicator_assignments a
                       where a.spec_id = p_spec_id and a.institution_key = app.current_institution()))
$$;

-- Assign (or, with a null institution, unassign) indicators. Reviewers only.
create or replace function public.assign_indicators(p_spec_ids text[], p_institution_key text, p_note text default null)
returns integer
language plpgsql security definer set search_path = public
as $$
declare n integer := 0;
begin
  if not app.is_reviewer() then
    raise exception 'Only PMO reviewers or administrators can assign indicators' using errcode = '42501';
  end if;
  if p_spec_ids is null or cardinality(p_spec_ids) = 0 then return 0; end if;
  if p_institution_key is null then
    delete from public.indicator_assignments where spec_id = any (p_spec_ids);
  else
    if not exists (select 1 from public.institutions where key = p_institution_key) then
      raise exception 'Unknown institution %', p_institution_key;
    end if;
    insert into public.indicator_assignments (spec_id, institution_key, note, assigned_by, assigned_at)
    select s, p_institution_key, nullif(btrim(p_note), ''), auth.uid(), now()
      from unnest(p_spec_ids) as s
     where exists (select 1 from public.indicators i where i.spec_id = s)
    on conflict (spec_id) do update set
      institution_key = excluded.institution_key, note = excluded.note,
      assigned_by = excluded.assigned_by, assigned_at = excluded.assigned_at;
  end if;
  get diagnostics n = row_count;
  insert into public.audit_log (actor_id, actor_name, action, detail)
  values (auth.uid(), app.actor_name(), 'assigned', n || ' indicator(s): ' || coalesce(p_institution_key, 'unassigned'));
  return n;
end $$;

-- Ask the assigned institutions to update or validate indicators. Unassigned indicators are skipped.
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

-- Close a request as done or cancelled. Reviewers only.
create or replace function public.close_request(p_id uuid, p_status text, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare req public.data_requests;
begin
  if not app.is_reviewer() then
    raise exception 'Only PMO reviewers or administrators can close requests' using errcode = '42501';
  end if;
  if p_status not in ('done', 'cancelled') then raise exception 'Invalid status %', p_status; end if;
  update public.data_requests
     set status = p_status, closed_at = now(), closed_by = auth.uid(), response_note = coalesce(nullif(btrim(p_note), ''), response_note)
   where id = p_id and status in ('open', 'submitted')
  returning * into req;
  if not found then raise exception 'Request not found or already closed'; end if;
  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), app.actor_name(), 'closed', req.spec_id, (select name from public.indicators where spec_id = req.spec_id), p_status);
end $$;

-- Submit measured values for one indicator. Entries: [{ "unit_id": "TZ" | "R-..." | "C001", "level": ..., "value": number | null }].
create or replace function public.submit_raw_values(
  p_spec_id text, p_entries jsonb, p_dataset text, p_period text default null, p_note text default null, p_request_id uuid default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  r        jsonb;
  seen     text[] := '{}';
  v_unit   text;
  inst     text;
  req      public.data_requests;
  new_id   uuid;
  who      text := app.actor_name();
  ind_name text;
begin
  if not app.can_enter(p_spec_id) then
    raise exception 'Your institution is not assigned to this indicator' using errcode = '42501';
  end if;
  select name into ind_name from public.indicators where spec_id = p_spec_id;
  if ind_name is null then raise exception 'Unknown indicator %', p_spec_id; end if;
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

  insert into public.raw_submissions (spec_id, institution_key, request_id, entries, dataset, period, note, author_name)
  values (p_spec_id, inst, p_request_id, p_entries, btrim(p_dataset), nullif(btrim(p_period), ''), nullif(btrim(p_note), ''), who)
  returning id into new_id;

  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), who, 'submitted', p_spec_id, ind_name, jsonb_array_length(p_entries) || ' value(s) · ' || btrim(p_dataset));
  return new_id;
end $$;

-- Approve or reject a submission of measured values. Approval writes raw_values and closes its request.
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
      insert into public.raw_values (spec_id, unit_id, level, value, dataset, period, institution_key, submission_id, author_name, updated_by, updated_at)
      values (
        s.spec_id, r ->> 'unit_id', r ->> 'level',
        case when jsonb_typeof(r -> 'value') = 'number' then (r ->> 'value')::double precision else null end,
        s.dataset, s.period, s.institution_key, s.id,
        s.author_name || case when s.author_id <> auth.uid() then ' · approved by ' || who else '' end,
        auth.uid(), now()
      )
      on conflict (spec_id, unit_id) do update set
        level = excluded.level, value = excluded.value, dataset = excluded.dataset, period = excluded.period,
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

-- The owning institution (or a reviewer) confirms the current values are still correct.
create or replace function public.confirm_values(p_spec_id text, p_request_id uuid default null, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  inst     text;
  req      public.data_requests;
  who      text := app.actor_name();
  ind_name text;
begin
  if not app.can_enter(p_spec_id) then
    raise exception 'Your institution is not assigned to this indicator' using errcode = '42501';
  end if;
  select name into ind_name from public.indicators where spec_id = p_spec_id;
  if ind_name is null then raise exception 'Unknown indicator %', p_spec_id; end if;
  select institution_key into inst from public.indicator_assignments where spec_id = p_spec_id;
  inst := coalesce(inst, app.current_institution());
  if p_request_id is not null then
    select * into req from public.data_requests where id = p_request_id for update;
    if not found or req.spec_id <> p_spec_id then raise exception 'The request does not match this indicator'; end if;
    if req.status not in ('open', 'submitted') then raise exception 'The request is already closed'; end if;
    update public.data_requests
       set status = 'done', closed_at = now(), closed_by = auth.uid(), response_note = nullif(btrim(p_note), '')
     where id = p_request_id;
  end if;
  insert into public.indicator_validations (spec_id, institution_key, request_id, note, validated_by, validated_by_name)
  values (p_spec_id, inst, p_request_id, nullif(btrim(p_note), ''), auth.uid(), who);
  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), who, 'validated', p_spec_id, ind_name, nullif(btrim(p_note), ''));
end $$;

-- Remove one approved measured value (the council falls back to its region, national or baseline value).
create or replace function public.revert_raw_value(p_spec_id text, p_unit_id text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not app.is_reviewer() then
    raise exception 'Only PMO reviewers or administrators can revert values' using errcode = '42501';
  end if;
  delete from public.raw_values where spec_id = p_spec_id and unit_id = p_unit_id;
  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), app.actor_name(), 'reverted', p_unit_id, null, p_spec_id);
end $$;

-- Execution rights: helpers are private; the workflow API is for signed-in users (each call re-checks).
revoke all on function app.current_institution(), app.actor_name(), app.can_enter(text) from public;
grant execute on function app.current_institution(), app.actor_name(), app.can_enter(text) to anon, authenticated;

revoke all on function
  public.assign_indicators(text[], text, text),
  public.create_requests(text[], text, date, text),
  public.close_request(uuid, text, text),
  public.submit_raw_values(text, jsonb, text, text, text, uuid),
  public.review_raw_submission(uuid, text, text),
  public.confirm_values(text, uuid, text),
  public.revert_raw_value(text, text)
from public, anon;
grant execute on function
  public.assign_indicators(text[], text, text),
  public.create_requests(text[], text, date, text),
  public.close_request(uuid, text, text),
  public.submit_raw_values(text, jsonb, text, text, text, uuid),
  public.review_raw_submission(uuid, text, text),
  public.confirm_values(text, uuid, text),
  public.revert_raw_value(text, text)
to authenticated;
