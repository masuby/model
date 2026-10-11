-- 0008: the Advancement layer's new sub-indicators as workflow indicators (issue ADV-02), so that
-- institutions can be assigned them, receive requests and submit figures through the Data portal like
-- any other indicator. Flagged core = false: they never enter the Core.
--
--   VU.VG.DP-UNHCR  refugees and asylum-seekers hosted (UNHCR); the workbook's own refugee indicator
--                   VU.VG.DP-REF is switched off, so this member keeps its own id
--   CC.INF.HC-DENS  health facilities per 10,000 people (2022 census geodatabase)
--   CC.INF.EDU-DENS schools per 10,000 people (2022 census geodatabase)
--   CC.INS.DRR-STAT DRM arrangements in place (EPRP, anticipatory action, EOCC, ERT, RVCA), counted
--                   0 to 5 by the engine from the committees' approved DRR records
--
-- Apply to the live project after 0006 and 0007.

insert into public.indicators (spec_id, name, unit, component, dimension, core) values
  ('VU.VG.DP-UNHCR', 'Refugees and asylum-seekers hosted', 'number of people', 'Displaced People', 'Vulnerability', false),
  ('CC.INF.HC-DENS', 'Health facilities per 10,000 people', 'per 10,000 people', 'Access to health care', 'Coping Capacity', false),
  ('CC.INF.EDU-DENS', 'Schools per 10,000 people', 'per 10,000 people', 'Education', 'Coping Capacity', false),
  ('CC.INS.DRR-STAT', 'DRM arrangements in place (EPRP AA EOCC ERT RVCA)', 'count of 5', 'DRR implementation', 'Coping Capacity', false)
on conflict (spec_id) do update set
  name = excluded.name, unit = excluded.unit, component = excluded.component, dimension = excluded.dimension, core = excluded.core;
