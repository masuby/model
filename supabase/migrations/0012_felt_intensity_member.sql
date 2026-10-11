-- 0012: the felt-intensity earthquake member of the Advancement layer as a workflow indicator (issue
-- ADV-08, indicator integrity recheck of 10 October 2026), so that the Geological Survey of Tanzania can
-- be assigned it, receive requests and submit figures through the Data portal like any other indicator.
-- Flagged core = false: it never enters the Core.
--
--   HA.NAT.EQ-FELT  maximum felt intensity at the council centroid over the USGS catalogue 1960-2024
--                   (1.5 M - 1.5 log10(R + 15)); records the shaking of events the GEM exposure index
--                   misses (Bukoba 2016)
--
-- Apply to the live project after 0011.

insert into public.indicators (spec_id, name, unit, component, dimension, core) values
  ('HA.NAT.EQ-FELT', 'Maximum felt intensity', 'intensity', 'Earthquake', 'Hazards & Exposure', false)
on conflict (spec_id) do update set
  name = excluded.name, unit = excluded.unit, component = excluded.component, dimension = excluded.dimension, core = excluded.core;
