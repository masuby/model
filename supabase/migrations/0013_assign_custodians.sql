-- 0013: a responsible institution for every workflow indicator (issue SRC-05). The live portal had 63 of
-- 78 indicators assigned; the fifteen below had no institution, so no one was asked to update them. The
-- institutions are the custodians the site names for the indicator's group (src/engine/risk/sources.ts,
-- CUSTODIANS) and the leads the NORMAL collection tool prints. Existing assignments are never overwritten
-- (on conflict do nothing): an administrator's choice in the portal stands.
--
-- Apply to the live project after 0012.

insert into public.indicator_assignments (spec_id, institution_key, note) values
  -- Conflict intensity and conflict risk: Ministry of Home Affairs
  ('HA.HUM.CI-CBAR',   'MOHA', 'Seeded by migration 0013 from the custodian register: conflict intensity'),
  ('HA.HUM.CR-GCRI',   'MOHA', 'Seeded by migration 0013 from the custodian register: conflict risk'),
  -- Internal violence: Tanzania Police Force
  ('HA.HUM.VIO-EVE',   'TPF',  'Seeded by migration 0013 from the custodian register: internal violence'),
  ('HA.HUM.VIO-FAT',   'TPF',  'Seeded by migration 0013 from the custodian register: internal violence'),
  -- Environmental degradation: National Environment Management Council
  ('HA.NAT.ED-DEF',    'NEMC', 'Seeded by migration 0013 from the custodian register: environmental degradation'),
  ('HA.NAT.DE-ERO',    'NEMC', 'Seeded by migration 0013 from the custodian register: environmental degradation'),
  -- Economic dependency: Ministry of Finance and Planning
  ('VU.SE.DEP-ODA',    'MOFP', 'Seeded by migration 0013 from the custodian register: economic dependency'),
  ('VU.SE.DEP-REM',    'MOFP', 'Seeded by migration 0013 from the custodian register: economic dependency'),
  ('VU.SE.DEP-DR',     'MOFP', 'Seeded by migration 0013 from the custodian register: economic dependency'),
  -- Economic capacity: National Bureau of Statistics
  ('CC.INF.ECO-INC',   'NBS',  'Seeded by migration 0013 from the custodian register: economic capacity'),
  ('CC.INF.ECO-IWI',   'NBS',  'Seeded by migration 0013 from the custodian register: economic capacity'),
  ('CC.INF.ECO-GDP',   'NBS',  'Seeded by migration 0013 from the custodian register: economic capacity'),
  -- Communication: Tanzania Communications Regulatory Authority
  ('CC.INF.COM-ELEC',  'TCRA', 'Seeded by migration 0013 from the custodian register: communication'),
  ('CC.INF.COM-INT',   'TCRA', 'Seeded by migration 0013 from the custodian register: communication'),
  ('CC.INF.COM-PHONE', 'TCRA', 'Seeded by migration 0013 from the custodian register: communication')
on conflict (spec_id) do nothing;
