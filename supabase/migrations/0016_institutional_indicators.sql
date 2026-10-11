-- 0016: the two Tanzanian institutional indicators of 10 October 2026 (src/engine/risk/institutional.ts), added
-- inside the workbook's institutional components as Core workflow indicators owned by the Prime Minister's
-- Office (Disaster Management Department):
--
--   CC.INS.DRR-ARR   DRM arrangements in place: the share of five arrangements the council has (an emergency
--                    preparedness and response plan, its risk vulnerability and capacity assessment, a trained
--                    emergency response team, an emergency operations and communication centre, DRR training
--                    of the committee), % of 5                                                     PMO-DMD
--   CC.INS.GOV-DMC   Disaster management committee functioning: the share of the assessed criteria met (the
--                    committee is active, collaborates with stakeholders, is involved in DRR issues), %  PMO-DMD
--
-- Their values are not entered as figures: the engine computes them from the DRR records the district and
-- regional committees approve on the Committee desk (committee_records, kind 'drr'; payload fields eprp,
-- rvca, aa, ert, eocc, training, committee, stakeholders, involvement) over the published PMO-DMD lists the
-- Benchmark 2026 carries. The rows let the indicators be assigned, requested and shown like any other Core
-- indicator. Apply to the live project after 0015.

insert into public.indicators (spec_id, name, unit, component, dimension, core) values
  ('CC.INS.DRR-ARR', 'DRM arrangements in place (EPRP, RVCA, trained ERT, EOCC, DRR training)', '% of 5 arrangements', 'DRR implementation', 'Coping Capacity', true),
  ('CC.INS.GOV-DMC', 'Disaster management committee functioning (active, stakeholder collaboration, involvement in DRR)', '% of assessed criteria', 'Governance', 'Coping Capacity', true)
on conflict (spec_id) do update set
  name = excluded.name, unit = excluded.unit, component = excluded.component, dimension = excluded.dimension, core = excluded.core;
