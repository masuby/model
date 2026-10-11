-- 0015: the Benchmark 2026 revision of 10 October 2026. The template's hazardous-material indicator is
-- activated with the density of sites that produce, store, process or dispose of hazardous materials
-- (OpenStreetMap, the 2022 census mapping and the NEMC environmental certificates of July-September 2026),
-- and the vehicle-accidents indicator is redefined as the density of recorded road crashes, each police
-- region's crashes shared among its councils by population, so that the big cities carry it (it was the
-- road death rate of 0014). Both are Core workflow indicators with their Tanzanian names and units, so the
-- responsible institutions (NEMC; the Tanzania Police Force) can be assigned them and submit council
-- figures through the Data portal.
--
--   HA.HUM.ACC    road traffic crashes per 100 km2 (police records 2024-2025, shared by population)   TPF
--   HA.HUM.HMAT   hazardous-material sites per 100 km2                                               NEMC
--
-- Internal violence (HA.HUM.VIO-EVE, VIO-FAT) is withheld from the live model by programme decision (data
-- note DN-12); its rows stay, so an institution can still submit a validated council series.
-- Apply to the live project after 0014.

insert into public.indicators (spec_id, name, unit, component, dimension, core) values
  ('HA.HUM.ACC', 'Road traffic crashes per 100 km2 (police records 2024-2025, shared by population)', 'crashes per 100 km2', 'Vehicle Accidents', 'Hazards & Exposure', true),
  ('HA.HUM.HMAT', 'Hazardous-material sites per 100 km2 (OpenStreetMap, 2022 census, NEMC 2026)', 'sites per 100 km2', 'Hazardous Material', 'Hazards & Exposure', true)
on conflict (spec_id) do update set
  name = excluded.name, unit = excluded.unit, component = excluded.component, dimension = excluded.dimension, core = excluded.core;
