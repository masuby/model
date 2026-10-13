-- 0017: the two council measures of 14 October 2026 that the Benchmark 2026 carries in place of workbook
-- values that cannot rank the councils (data notes DN-10 and DN-02), added as Core workflow indicators so
-- that they can be assigned, requested and updated like any other:
--
--   HA.NAT.EQ-INT   Earthquake: maximum felt intensity from recorded earthquakes (USGS catalogue, magnitude
--                   4.5 and above, 1960-2024; 1.5 M - 1.5 log10(R + 15) at the council centroid)      GST
--   HA.NAT.DR-DOC   Drought: recorded by PMO-DMD's Risk Action Guide Book, graded by the council's mean
--                   annual rainfall (CHIRPS 1991-2024), 0 to 10                                        PMO-DMD
--
-- The workbook's own indicators (HA.NAT.EQ-EXP, HA.NAT.DR-FRE) keep their rows; the live model withholds
-- their values by the data notes. Apply to the live project after 0016.

insert into public.indicators (spec_id, name, unit, component, dimension, core) values
  ('HA.NAT.EQ-INT', 'Earthquake: maximum felt intensity from recorded earthquakes (USGS 1960-2024)', 'intensity', 'Earthquake', 'Hazards & Exposure', true),
  ('HA.NAT.DR-DOC', 'Drought: recorded by PMO-DMD''s Risk Action Guide Book, graded by mean annual rainfall (CHIRPS 1991-2024)', 'index', 'Drought', 'Hazards & Exposure', true)
on conflict (spec_id) do update set
  name = excluded.name, unit = excluded.unit, component = excluded.component, dimension = excluded.dimension, core = excluded.core;

insert into public.indicator_assignments (spec_id, institution_key, note) values
  ('HA.NAT.EQ-INT', 'GST', 'Seeded by migration 0017: the Geological Survey of Tanzania keeps the earthquake record'),
  ('HA.NAT.DR-DOC', 'PMO', 'Seeded by migration 0017: PMO-DMD keeps the Guide Book''s drought record')
on conflict (spec_id) do nothing;
