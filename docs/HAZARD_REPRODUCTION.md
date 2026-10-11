# Reproducing the Advancement layer's hazard members (issue ENG-03)

Every council-level member of the Advancement layer is a zonal statistic of an open dataset over the
195 council polygons of `src/data/tanzania-councils.json` (NBS 2022 census boundaries), written to a
CSV in `data-source/` by one script, and read from there by `python3 scripts/build-advanced-inputs.py`,
which writes `src/data/tanzania-advanced-inputs.json` with each member's source, method, period and
coverage. The derived CSVs are the versioned inputs: a collaborator can rebuild the layer from them
without any download, and can recompute any one of them from the dataset named below. The sha256 of
every derived input is in `data-source/CHECKSUMS.sha256` (`python3 scripts/checksums.py --check`).

## The members, their datasets and their scripts

| Member | What it is | Dataset (open) | Access | Script | Output |
|---|---|---|---|---|---|
| HA.NAT.DR-ARID | Annual P / PET, 1991-2020 climatology | CHIRPS v3 monthly precipitation (0.05°); ERA5 2 m temperature monthly | CHC `data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly`; Copernicus CDS ERA5 single levels monthly | `scripts/compute-aridity.py` (paths `CH`, `T2M` at the top) | `aridity_councils.csv` |
| HA.NAT.DR-SPEI, HA.NAT.DR-CV | Mean magnitude of SPEI-12 in drought months; interannual CV of annual rainfall, 1991-2024 | CHIRPS v3 monthly; ERA5 t2m (Thornthwaite PET) | as above; the council extraction is cached in `_council_climate_cube.npz` (P and T, 408 months × 195) by `scripts/compute-council-climate.py` | `scripts/compute-council-drought-members.py` | `drought_members_councils.csv` |
| HA.NAT.DR-NDVI | Mean NDVI 2001-2020 | MODIS MOD13Q1 (250 m) | Google Earth Engine, collection `MODIS/061/MOD13Q1` | `scripts/compute-gee-eo.py` | `ndvi_councils.csv`, raster `inform_sheets/satellite_maps/ndvi_mean.tif` |
| HA.NAT.DR-SOIL | Mean surface soil moisture 2015-2022 | NASA-USDA SMAP 10 km | Google Earth Engine, `NASA_USDA/HSL/SMAP10KM_soil_moisture` | `scripts/compute-gee-eo.py` | `soil_moisture_councils.csv`, `soil_ssm_mean.tif` |
| HA.NAT.FL-R50, HA.NAT.FL-R100 | Days per year with council-mean rainfall above 50 mm and 100 mm, 2015-2024 | CHIRPS v3 daily (0.05°) | `scripts/fetch-chirps-daily.py` downloads the national daily cube to `.cache/chirps_daily/` (git-ignored, about 3 GB) | `scripts/compute-council-climate.py` | `council_climate.csv` (`heavy_days_yr`, `vheavy_days_yr`) |
| HA.NAT.LS-SUSC | Mean terrain slope (degrees) | SRTM 30 m | Google Earth Engine, `USGS/SRTMGL1_003` | `scripts/compute-gee-eo2.py` | `landslide_slope_councils.csv` |
| HA.NAT.LS-RAIN | Mean annual maximum 1-day rainfall 2015-2023 | CHIRPS daily | Google Earth Engine, `UCSB-CHG/CHIRPS/DAILY` | `scripts/compute-gee-eo2.py` | `rain_trigger_councils.csv`, `rain_trigger_rx1day.tif` |
| HA.NAT.ST-WIND | Period maximum of daily maximum 10 m wind, 2015-2023 | ERA5-Land daily aggregates | Google Earth Engine, `ECMWF/ERA5_LAND/DAILY_AGGR` | `scripts/compute-gee-eo2.py` | `wind_councils.csv`, `wind_max.tif` |
| HA.NAT.HW-DAYS | Days per year with Tmax above 35 °C, 2015-2023 | ERA5-Land daily aggregates | Google Earth Engine, as above | `scripts/compute-gee-eo2.py` | `heatwave_councils.csv`, `heatwave_hotdays.tif` |
| HA.NAT.EQ-HIST, HA.NAT.EQ-FELT | Events (M ≥ 4.5) within 50 km of the centroid, 1960-2024, per 100 years; maximum felt intensity 1.5 M − 1.5 log10(R + 15) | USGS earthquake catalogue | USGS FDSN event service (`earthquake.usgs.gov/fdsnws/event/1/query`, CSV, bbox 28.5-41.5 E, 12.2 S-0.2 N, minmagnitude 4.5, 1960-01-01 to 2024-12-31); the export is vendored as `usgs_earthquakes_tz.csv` | `scripts/compute-council-earthquake.py` | `earthquake_councils.csv` |
| HA.NAT.FL-EVENT | Recorded flood events 2010-2024 per district | PMO-DMD records, DesInventar, EM-DAT, press | Hand-compiled register, one row per event with its source | (edit the CSV) | `flood_events.csv` |
| VU.VG.DP-UNHCR | Refugees and asylum-seekers hosted, 2024 | UNHCR Tanzania operational data | `data.unhcr.org/en/country/tza` (rounded camp and urban figures) | (edit the CSV) | `displaced_refugees.csv` |
| CC.INF.HC-DENS, CC.INF.EDU-DENS | Dispensaries, health centres and hospitals, and schools (pre-primary to secondary), per 10,000 people | 2022 Population and Housing Census geodatabase (NBS/OCGS) | The geodatabase is distributed by NBS to institutions (TCVMP copy at `../tcvmp/TANZANIA_2022_POST_PHC_GEODATABASE/commondata/tanzania_2022phc_geodatabase.gdb`); needs `geopandas` and `fiona` | `scripts/spatial-join-facilities-councils.py` | `facilities_by_council.json`, `facilities_by_unit.json` |
| CC.INS.DRR-STAT | DRM arrangements in place (EPRP, anticipatory action, EOCC, ERT, RVCA) | PMO-DMD list (June 2026) and the committees' approved DRR records | `drr_status.csv` plus the Data portal | computed by the engine (`src/engine/risk/advanced.ts`) | — |

The withheld member HA.NAT.DR-SEAS (growing-season failure frequency) is computed by
`scripts/compute-drought-spi-spei.py` on the district cube; it stays withheld until both rainy seasons
are scored in bimodal zones (`data-source/seasonality_zones.csv`, issue MET-01).

## Environment

- Python 3.11 with `numpy`, `pandas`, `scipy`, `xarray`, `rasterio`, `geopandas`, `fiona`, `shapely`,
  `openpyxl`, `python-docx`; for the Earth Engine scripts, `earthengine-api` with a project the user can
  initialise (`ee.Initialize(project=...)` at the top of `compute-gee-eo.py` and `compute-gee-eo2.py`:
  replace the project id with your own).
- Node 22 for the build scripts (`npm run build:core`, `node scripts/build-council-index.mjs`,
  `node scripts/verify-advanced-tool.mjs`, `node scripts/integrity-recheck.mjs`).
- LibreOffice (`soffice`) for the tool verification and the PDF exports.

## Order of operations for a full rebuild

1. Boundaries and population: `src/data/tanzania-councils.json`, `data-source/council_registry.csv`,
   `data-source/population_2022_councils.csv` (see `data-source/BOUNDARIES.md` for changes).
2. Climate cube and the CHIRPS-based members: `scripts/fetch-chirps-daily.py`, then
   `scripts/compute-council-climate.py`, `scripts/compute-aridity.py`,
   `scripts/compute-council-drought-members.py`.
3. Earth Engine members: `scripts/compute-gee-eo.py`, `scripts/compute-gee-eo2.py`.
4. Earthquake: refresh `usgs_earthquakes_tz.csv` from the FDSN query, then
   `scripts/compute-council-earthquake.py`.
5. Facilities: `scripts/spatial-join-facilities-councils.py` (then `npm run build:core` for the display
   counts).
6. `python3 scripts/build-advanced-spec-json.py && python3 scripts/build-advanced-inputs.py`, then
   the tools (`build-advanced-tool.py`, `fill-advanced-tool.py`, `verify-advanced-tool.mjs`), the
   reports (`advancement-sensitivity.mjs`, `coherence-report.mjs`, `integrity-recheck.mjs`) and
   `python3 scripts/checksums.py`.
7. `npm run check`.

Every member's reference range is the span of the council values at the release (the layer's rule;
`data-source/inform_advanced_spec.csv`), and the register `docs/assessment/INFORM_TZ_Indicator_Integrity_<release>.md`
checks each range against its span at every release.
