-- 0014: the seven template indicators the Benchmark 2026 activates with a Tanzanian definition
-- (src/data/tanzania-benchmark-2026.json, issue DATA-02) become Core workflow indicators, so that the
-- responsible institutions can be assigned them, receive requests and submit figures through the Data
-- portal like any other Core indicator. The rows exist since 0004 (the workbook's 78 indicators) with
-- core = false; this flips them to core and gives them their Tanzanian names and units.
--
--   HA.NAT.CH-SEA    low-elevation coastal zone (share of area at or below 10 m), %      NEMC
--   HA.NAT.HW-EXP    heatwave days (3-day runs above the local 90th percentile), days/yr   TMA
--   HA.NAT.LI-CAS    lightning stroke density (WWLLN 2010-2021), strokes/km2/yr           TMA
--   HA.HUM.ACC       road traffic deaths per 100,000 people (police statistics)           TPF
--   VU.SE.LV-IPC     IPC acute food insecurity area phase, phase (1-5)                    MUCHALI
--   VU.VG.ECO-FEMHH  female-headed households (2022 census), %                            NBS
--   VU.VG.HC-DISAB   people living with disabilities (2022 census), %                     NBS
--
-- The benchmark values themselves are a release artefact of the application (applied by the engine with
-- their lineage); they are not copied into raw_values. Apply to the live project after 0013.

insert into public.indicators (spec_id, name, unit, component, dimension, core) values
  ('HA.NAT.CH-SEA', 'Sea level rise: low-elevation coastal zone (share of area at or below 10 m)', '%', 'Coastal hazards', 'Hazards & Exposure', true),
  ('HA.NAT.HW-EXP', 'Heatwave days (runs of 3 or more days above the local 90th percentile), 2015-2024', 'days/yr', 'Heatwave', 'Hazards & Exposure', true),
  ('HA.NAT.LI-CAS', 'Lightning stroke density (WWLLN 2010-2021)', 'strokes/km2/yr', 'Lightning', 'Hazards & Exposure', true),
  ('HA.HUM.ACC', 'Road traffic deaths per 100,000 people (police statistics, 2024-2025)', 'deaths per 100,000', 'Vehicle Accidents', 'Hazards & Exposure', true),
  ('VU.SE.LV-IPC', 'IPC acute food insecurity area phase', 'phase (1-5)', 'Livelihoods', 'Vulnerability', true),
  ('VU.VG.ECO-FEMHH', 'Female-headed households (2022 census)', '%', 'Economic', 'Vulnerability', true),
  ('VU.VG.HC-DISAB', 'People living with disabilities (2022 census)', '%', 'Health Conditions', 'Vulnerability', true)
on conflict (spec_id) do update set
  name = excluded.name, unit = excluded.unit, component = excluded.component, dimension = excluded.dimension, core = excluded.core;
