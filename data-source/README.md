# INFORM Tanzania — data layer (`data-source/`)

Transparent, reusable CSVs behind the model. Edit/extend these and re-run the scripts to
update `src/data/tanzania-inform-risk.json`. Methodology: [`../docs/METHODOLOGY_MANUAL.md`](../docs/METHODOLOGY_MANUAL.md).

## Master indicator tables (start here)
- **`inform_indicators_long.csv`** — tidy: **one row per district × indicator**, with the
  0–10 value **and its source** (`authority, dataset, method`). Best for adding indicators,
  updating values, and auditing provenance. Columns:
  `adm1_code, adm1_name, adm2_code, adm2_name, dimension, category, indicator_key, indicator, value, authority, dataset, method`.
- **`inform_indicators_wide.csv`** — one row per district, every indicator as a column, plus
  `hazard_total, vulnerability_total, coping_total, risk`. Convenient for analysis/GIS joins.

Regenerate both: `node scripts/export-indicators.mjs`.

## Computed-hazard inputs
- **`chirps_drought_spi_spei.csv`** — per district: mean annual rain, rainfall CV, rainy
  season, season-failure frequency, SPEI severity, `drought_index` (0–10). *(compute-drought-spi-spei.py)*
- **`chirps_heavy_rain_events.csv`** — days/yr > 50 mm & > 100 mm, `heavy_rain_index`. *(compute-heavy-rain.py)*
- **`exposure_nbs2022.csv`** — NBS 2022 council population, area, density, `exposure_index`. *(compute-exposure.py)*
- **`flood_events.csv`** — recorded floods (district, year, event, **source**). **Editable** —
  append events as they occur; folded into the flood hazard by `apply-climate-hazards.mjs`.
- **`indicator_sources.csv`** — the authority/dataset/method per headline indicator.

## How it flows
```
compute-*.py / *.csv ──▶ apply-climate-hazards.mjs ──▶ src/data/tanzania-inform-risk.json ──▶ app
                                                   └──▶ export-indicators.mjs ──▶ the two master CSVs
```
Standardization to 0–10 = **min-max** (log for skewed); aggregation = indicator→category **mean**,
category→dimension **scaled geometric mean**, risk = **∛(H×V×LCC)** — see the manual.

## Future advancements
- Treat `inform_indicators_long.csv` as the editable source of record; a small importer can read
  it back to regenerate the dataset (closing the loop) — see `RISK_OVER_TIME_PLAN.md` for dated
  snapshots and `EO_VALIDATION_PLAN.md` for Sentinel-1 flood validation.
- New indicators: add rows (long) with a clear `authority/dataset/method`; new sources: extend
  `indicator_sources.csv` and `src/components/inform-risk/indicatorSources.js`.
