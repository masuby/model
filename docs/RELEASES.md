# Releases, validation and the update cycle (issue MET-15, decision D12)

INFORM Tanzania publishes its data as releases, so that any figure can be cited with a version and a
date, and so that every change can be traced to a decision. This follows the INFORM Subnational
Guidance (II.8 to II.10): update with the core group and partners, validate, publish, maintain on a fixed
cycle. The arrangement below is the recommended one of the October 2026 assessment; it takes effect when
PMO-DMD adopts it (decision D12).

## What a release is

| Layer | Release id | What it holds | Where the id is stamped |
|---|---|---|---|
| Core | `core-YYYY.MM` (now `core-2026.10`) | The INFORM SADC 2024 workbook values (those that fail validation withheld live, with a data note) plus the institutional values approved through the Data portal by the release date | `src/data/tanzania-inform-risk.json` metadata; every export's first rows; the Methodology page |
| Advancement | `adv-YYYY.MM` (now `adv-2026.10`) | The Tanzanian sub-indicators and their inputs | `src/data/tanzania-advanced-inputs.json`; the Advancement section of every profile |

Within a release, every approved value carries the moment it was applied, and the Data portal's
"Versions" block (Approved changes tab) compares the state of any two days. A release is the dated,
validated snapshot that the site names; the day-by-day versions are its audit trail.

## The cycle

Annual, aligned with the planning and budgeting calendar, with an interim release when a census, a survey
round or a boundary change warrants it:

1. **Collection (months 1 to 9).** Institutions keep their indicators current through the Data portal
   (measured values on the workbook's definitions, or 0 to 10 scores by the INFORM method with a citable
   source); the committees record DRR arrangements, statements and events. Each submission is reviewed by
   the owning institution's chain and applied on approval.
2. **Technical review (month 10).** The NDRRC technical committee reviews the approved changes of the
   year (the Approved changes tab, the coherence report `scripts/coherence-report.mjs`, the sensitivity
   report `scripts/advancement-sensitivity.mjs`) and the Advancement layer's inputs.
3. **Methodological changes go to INFORM (JRC) first.** Any change to the indicator set, the
   aggregation rules, the reference ranges or the class thresholds of the Core is proposed to the SADC
   and INFORM (JRC) partners before it enters the Core; until then it is shown only as a labelled
   sensitivity in the Advancement layer (decision D11).
4. **Publication (month 11).** PMO-DMD approves the release: `npm run build:core` stamps the release id,
   the change log below is updated, the collection tools are regenerated, and the site is deployed.
5. **Boundary changes** follow `data-source/BOUNDARIES.md` and are themselves a release.

## Benchmark 2026 (bm-2026.10)

The institutional dataset that accompanies the Core: `src/data/tanzania-benchmark-2026.json`, built by
`python3 scripts/build-benchmark.py` from `data-source/benchmark_2026/` (inputs produced by the scripts in
`scripts/benchmark/` from public sources; `docs/BENCHMARK_2026.md` lists every dataset, source, period,
resolution and method; the file is stored compactly, dataset metadata once and the values as plain maps). Its values are approved institutional values dated 10 October 2026: they carry
their lineage, lift the quarantine of the workbook values they replace, and give way to a newer approved
value from the Data portal. A dated version before 10 October 2026 has none of them.

Validation record for bm-2026.10:

- Reproduction: every input CSV is rebuilt by its script from the named source; `scripts/build-benchmark.py`
  is deterministic apart from the build timestamp.
- Parity: the workbook build (`workbookOnly`) is untouched (`dataset.integrity.test.ts`); the benchmark
  reaches councils only as leaf edits dated 2026-10-10 (`model.test.ts`).
- Realism checks recorded in the register (DATA-01 to DATA-05) and the thesis: coastal retreat hotspots
  (Kibiti, Mtwara, Mafia, Mkuranga), cyclone exposure concentrated on the south coast, heatwave days
  highest on the islands and the coast, lightning highest in the west, road crashes densest in Zanzibar
  Town and the Dar es Salaam municipalities and then the big cities, hazardous-material sites densest in
  the cities and their industrial towns (Mwanza and Ilemela, Arusha, Moshi, Mbeya, Kibaha, Tanga), food
  insecurity in the 30 IPC districts, census electricity and literacy highest in the cities.
- Effect (as revised on 10 October 2026, with hazardous material, road crashes by area and internal
  violence withheld): national risk 3.9 (H 2.4, V 4.2, LCC 5.8) against 3.6 without the benchmark; 182
  councils change risk, 78 change class; 38 councils high, 140 medium, 17 low; 30 of 32 groups carry data
  (zoonoses empty; internal violence withheld by programme decision, data note DN-12).

## Validation record

Every release records, in this file:

| Release | Date | Scope | Reviewed by | Approved by | Methodological changes sent to INFORM (JRC) |
|---|---|---|---|---|---|
| core-2026.10 / adv-2026.10 | 2026-10-09 | Core rebuilt from the INFORM SADC 2024 workbook after the integrity assessment; first Advancement release (18 of 30 sub-indicators after the recheck of 10 October 2026) | Integrity assessment, docs/assessment/ (not yet reviewed by the NDRRC technical committee) | Pending (PMO-DMD) | None proposed yet; the two rule sensitivities (hazard aggregation, class thresholds) and the eleven data notes of the indicator integrity register (docs/assessment/INFORM_TZ_Indicator_Integrity_core-2026.10.md) are the queries to raise |

## Change log

- **bm-2026.10 revision 2 (11 October 2026)**: two Tanzanian institutional indicators inside the workbook's
  DRR implementation and Governance groups (DRM arrangements in place, share of five; disaster management
  committee functioning, share of the assessed criteria), seeded from the PMO-DMD lists and published
  launches and trainings (`data-source/drr_status.csv`) and superseded by the committees' approved records
  through the Data portal. National risk 3.9 unchanged; 37 high, 144 medium, 14 low. Migration
  `0016_institutional_indicators.sql`. Decision D20 (PMO-DMD, 10 October 2026).
- **bm-2026.10 revision (10 October 2026)**: the hazardous-material indicator activated with the density of
  hazardous-material sites (OpenStreetMap, the 2022 census mapping of industries and hospitals, the NEMC
  environmental certificates of July to September 2026; 10,341 sites); the vehicle-accidents indicator
  redefined as the density of recorded road crashes, each police region's crashes shared among its
  councils by population, so that the big cities carry it (it was the death rate per 100,000, which put the
  rural highway regions first); internal violence withheld from the live model by programme decision
  (DN-12); the benchmark's council population file corrected (29 councils had taken a neighbour's figure).
  Live national risk 3.8 to 3.9; high 42 to 38, medium 124 to 140, low 29 to 17. Migration
  `0015_benchmark_hazmat_crashes.sql` gives the portal the two indicators' names and units.
- **core-2026.10, validation quarantine (10 October 2026)**: 391 workbook values that fail validation are
  withheld from the live model (eight data notes, `src/data/inform-data-notes.json`); the workbook is
  reproduced exactly for the tests. Live national aggregate 4.1 (H 2.6, V 4.2, LCC 6.2); 62 councils change
  class. Queries to INFORM (JRC) and SADC: `docs/assessment/INFORM_TZ_Upstream_Queries_core-2026.10.md`.

- **core-2026.10**: the Core is the workbook exactly (165 of 170 units had been altered before); the
  national figure is the INFORM aggregate of the councils (3.8 on the workbook exactly; 4.1 on the live
  model after the validation quarantine of 10 October 2026); hand grades, overlays and the raise-only
  floor removed; twelve urban councils linked to their own units; Butiama's own values.
- **adv-2026.10**: 30 sub-indicators in 12 baskets, 18 filled (council-level drought, flood, landslide,
  wind, heat, seismicity and felt-intensity indices; recorded flood events; refugees hosted; facility
  densities on the council polygons with the facility types filtered; DRM arrangements); sensitivity
  report published. Recheck of 10 October 2026: facility join rebuilt, felt-intensity member added, six
  member ranges fitted to the council spans (`docs/assessment/INFORM_TZ_Indicator_Integrity_core-2026.10.md`).
