# INFORM Tanzania — Indicator Source Register (Deep Data Hunt)

- **Purpose:** the authoritative, citable provenance register for every indicator — the result of a deep
  multi-domain data hunt across climate, geophysical, environment/fire, health/food, socioeconomic and
  coping/governance corners. For each indicator: the best authentic dataset, the true native granularity,
  cited Tanzania values, and an honest verdict on whether it can be taken to council/district or is a gap.
- **Hard rule (authenticity):** per-council numbers are NEVER fabricated. Where data is region- or
  national-level, the council inherits a **labelled region proxy**, not an invented figure. Gaps are
  recorded as gaps, with the authentic path to close them.
- **Granularity legend:** `council` = natively council/district resolvable · `region` = Adm1 survey/account
  (proxy down) · `national` = country-level only · `grid` = raster, zonal-averaged to council ·
  `point/event` = discrete catalogue → proximity/hotspot · `GAP` = no authentic per-unit value.

---

## A. Climate / meteorological hazards — lead TMA

| Indicator | Best authentic source | Granularity | Key cited TZ values | Verdict |
|---|---|---|---|---|
| Drought SPI/SPEI | CHIRPS v3 (UCSB CHC) 0.05° daily 1981– (on disk) | grid→council | driest regions Dodoma, Singida, Shinyanga, Manyara, Simiyu, Arusha; severe yrs 2003–2011 | HAVE — validate vs World Bank CCKP (ADM1/basin) |
| Aridity (P/PET) | CGIAR-CSI Global Aridity Index v3 (Zomer/Trabucco 2022) 30 arc-sec | grid→council | ~51% of TZ is dryland; central semi-arid Dodoma/Singida/Tabora | GAP — **fillable** (1 km raster zonal mean) |
| Rainfall variability (CV) | CHIRPS v3 interannual CV | grid→council | — | HAVE — derive from on-disk cube |
| Vegetation/soil drought stress | USGS FEWS NET eMODIS NDVI C6 250 m dekadal; ESA-CCI / SMAP soil moisture (~25 km) | NDVI grid→council; soil region | — | NDVI **fillable**; soil moisture coarse |
| Heavy rain (>50 / >100 mm days) | CHIRPS v3 daily (on disk) | grid→council | — | HAVE |
| River / basin flood | WRI Aqueduct Floods (~750 m) / GloFAS; Fathom/JBA 30 m | grid→council | Rufiji/Kibiti Apr-2024 ~88,000 in need; Dar Msimbazi basin (27% of city pop) | GAP — fillable (% area inundated @RP100) |
| Flood events (validation) | ReliefWeb / EM-DAT / NASA EO | event | Rufiji, Dar (Msimbazi), Kilombero, Kyela, Kigoma | hotspot flag (on disk: flood_events.csv) |
| Heatwave (heat-health days) | ERA5-Land 0.1° (upgrade from on-disk ERA5 0.25°); Mora 2017 threshold | grid→council (smoothed) | humid coast exposure zone | HAVE (coarse) — upgrade ERA5-Land |
| Lightning (flash density) | NASA LIS/OTD 0.1° (Albrecht 2016); ENGLN | grid→council | **Lake Victoria 183 flashes/km²/yr (ENGLN 2014–18); TRMM-LIS ~26**; basin councils Mwanza/Geita/Kagera/Mara/Simiyu/Shinyanga = national max | GAP — **fillable** (land cells only) |
| Storms / tropical cyclone | IBTrACS v4 (NOAA) S. Indian basin | event/coastal | landfalls 1872, 1952; **Cyclone Hidaya 4-May-2024 Mafia I., 18,862 affected**; Jobo 2021 | coastal hotspot only — **never a per-council rate** |
| Coastal waves / surge | ERA5 Hs / CMEMS WAVERYS (~0.2–0.5°); GTSM surge | grid (coarse), coastal only | Dar: ~8% below 10 m LECZ; ~30,000 exposed to 100-yr coastal flood (2005)→~210,000 (2070) | coastal councils only |

---

## B. Geophysical hazards — lead GST

| Indicator | Best authentic source | Granularity | Key cited TZ values | Verdict |
|---|---|---|---|---|
| Earthquake PGA | **GEM Sub-Saharan Africa seismic model (SSAHARA, v2023.1)** ~10 km; Msabi & Ferdinand 2021 0.1° (N. rift) | grid→council | N. rift PGA **0.06–0.34 g @475-yr**; Arusha 0.15 g; Western branch (Rukwa/Tanganyika/Kigoma) highest; 2016 M5.9 Bukoba | GAP vs on-disk felt-proxy — **fillable** (zonal max PGA, raise-only) |
| Landslide | **NASA LHASA Global Landslide Susceptibility** ~1 km (Stanley & Kirschbaum 2017); GLC point catalog | grid→council | hotspots Kilimanjaro, Pare, Usambara/Lushoto, Uluguru, Rungwe (4-May-2016 Mbeya), Hanang | GAP — **fillable** (zonal mean), district studies validate |
| Volcano | **Smithsonian GVP** Holocene catalog | point→proximity | Ol Doinyo Lengai (active since 2017), Meru, Ngozi, Rungwe, Kyejo (RVP), Igwisi Hills | proximity decay; genuinely **0** outside Arusha/Manyara & Mbeya/Songwe |

On disk: `usgs_earthquakes_tz.csv` (555 events M≥4.5 1960–2024), `earthquake_usgs.csv` (150 districts felt-intensity proxy — **not** PGA).

---

## C. Environment & fire — lead NEMC / TFS

| Indicator | Best authentic source | Granularity | Key cited TZ values | Verdict |
|---|---|---|---|---|
| **Wildfire** | **TFS/NEMC Tanzania Active Fires (TZ_ACTF) — ON DISK** `inform_sheets/FIRE DATA/TZ_ACTF2021…xlsx` (138 districts, 74,965 fires 2021); NASA FIRMS to extend | **district (real!)** | Songwe 4,975; Handeni 4,425; Ngorongoro 3,478; Mufindi 3,300; Rungwe 2,295 — western/southern miombo belt | **WIRE IN** — replaces "refine pending" placeholder in hazard_overlays.csv |
| Deforestation / tree-cover loss | Global Forest Watch / Hansen (UMD) 30 m 2001–2023 (ADM2 dashboards) | grid→council | ~3.2 Mha lost 2001–23 (~12%); ~372–400k ha/yr; Lindi/Ruvuma/Morogoro/Tabora/Katavi | GAP — **fillable** (30 m clip) |
| Soil erosion (RUSLE) | Borrelli GloSEM 250 m (JRC) 2022; TZ highland plot studies | grid→council (modelled) | Uluguru ~312, Usambara ~69, Shinyanga 105→224 Mg/ha/yr | GAP — fillable (label "modelled") |
| Coastal erosion | IMS-Dar/TCMP shoreline surveys | hotspot | Dar ~3 m/yr (>5 local); Maziwe I. eroded away by ~1983 | GAP (m/yr per unit); coastal only |
| Mangrove buffer loss | Global Mangrove Watch / Wetlands Intl | polygon→coastal council | Rufiji delta (~53,255 ha) loses ~378 ha/yr (~0.5%/yr); national ~0.7%/yr | fillable for ~14 coastal councils |
| Environmental degradation | Central-TZ dryland studies; HADO/Kondoa (UNCCD) | region/zone | Kondoa Eroded Area; Dodoma/Singida/Shinyanga semi-arid belt | qualitative regional |
| Hazardous material | ASGM mercury studies (BGS/SUA/UDSM); NEMC industrial inventory | district cluster | Geita/Rwamagasa ~27 kg Hg/yr; L. Victoria fish Hg up to 3.5 mg/kg | on disk; upgrade basis |

---

## D. Health & food-security vulnerability — lead MoH / MoA(MUCHALI/IPC)

| Indicator | Best authentic source | Granularity | Key cited TZ values | Verdict |
|---|---|---|---|---|
| Stunting / wasting / underweight | **TDHS-MIS 2022** (FR382, DHS StatCompiler) | region (31) | national stunting **30%**; Iringa **57%**, Njombe 50%, Rukwa 50–56%; Dar **18%**; wasting 3%, underweight 12% | region proxy (NOT the inflated 60–88% figures) |
| U5 / infant / maternal mortality | TDHS-MIS 2022 | national | U5 43/1,000; infant 33; **MMR 556→104/100,000** | national |
| HIV prevalence | **THIS 2022-23 (PHIA)** | region (31) | national 4.4%; **Njombe 12.7%, Iringa 11.1%, Mbeya 9.6%**; Manyara/Kigoma ~2% | region — **on-disk Njombe 11.4% → update to 12.7%** |
| Malaria prevalence | TDHS-MIS 2022 MIS (RDT u-5) | region (31) | national 7.8%; Tabora ~23%, Mtwara ~20%, Kagera ~18%, Geita ~17%; Arusha/Kilimanjaro ~0.5% | region (matches on-disk) |
| Health-care access (facility density) | **MoH HFR / DHIS2** + 2022 PHC | **council** | SBA 84.8%; ~11,805 facilities | **fillable per council** (facilities ÷ pop) |
| Food security / livelihoods | **IPC / MUCHALI** (FAO/WFP/UNICEF/Govt) | **council (assessed subset)** | Feb–May 2025: 466k in Phase 3, 16 councils Phase 2; Longido & Monduli Phase 3 (2024); chronic: Dodoma/Arusha/Manyara/Singida/Kilimanjaro councils | council for assessed subset; unassessed = Phase 1 (not a data point) |
| Zoonoses / pests | MoA-TPHPA / MoLF / ProMED / FAO | region/zone | RVF: Manyara/Tanga/Dodoma/Morogoro/Pwani; fall armyworm maize belt; desert locust northern-pastoral | region risk-zone |

---

## E. Socioeconomic vulnerability — lead NBS / MoFP / MoHA

| Indicator | Best authentic source | Granularity | Key cited TZ values | Verdict |
|---|---|---|---|---|
| Basic-needs poverty | **NBS HBS 2017/18** (+ WB SAE poverty map for district) | region (26) | national **26.4% (2018)**; food poverty 8.0%; Kigoma poorest ~23.5%, Kilimanjaro least ~4.4% | region proxy; district only via WB/NBS SAE |
| Multidimensional poverty (MPI) | OPHI/UNDP Global MPI 2024 (TDHS 2022) | region | **47.2% MPI poor** (~30.55M); +23.1% vulnerable; MPI 0.221 | region |
| Habitat / housing quality | **NBS 2022 PHC Housing Condition report** + 2022 Buildings Census | **district (census)** | 34.5% burnt-brick walls; 70.1% improved water; Morogoro 39.5% permanent floors | **fillable per district** (best socioeconomic granularity) |
| Economic capacity (regional GDP pc) | NBS National Accounts (regional) 2022/2024 | region | national TZS 3.06M (2023); Dar TZS 5.74M (~2×); lowest Kigoma/Singida/Kagera/Simiyu/Geita | region; district GAP |
| Economic dependency (remittances/ODA) | World Bank WDI (BoP / OECD-DAC) | national | remittances ~US$750M (2024, +25% in 2022); ODA via DT.ODA.ODAT.CD | national modifier only |
| Displaced / refugees | **UNHCR operational portal** | camp→host district | **Nov-2025: 229,446** (~82% Kigoma); **Nduta closed 30-Apr-2026; Nyarugusu (~22k Burundians) closing 31-Jul-2026** | district; **on-disk displaced_refugees.csv STALE — refresh** |

---

## F. Coping capacity & governance — lead MoW / TCRA / MoEST / PMO-DMD / PO-RALG

| Indicator | Best authentic source | Granularity | Key cited TZ values | Verdict |
|---|---|---|---|---|
| WASH (water / sanitation) | **NBS 2022 PHC Housing Condition report** (+ MoW WPMS) | region→district | improved water **70.1%**; improved sanitation **60.2%** (Kilimanjaro 75.7%, Dar 68.3%, Songwe 29.7%) | region→district (pull 31-region vector from PHC PDF/microdata) |
| Health-care access (coping) | NBS 2022 PHC + MoH HFR | **council** | facilities geocoded per council | **fillable per council** |
| Communication | TCRA Comm. Statistics (national+region counts) + 2022 PHC ownership | national/region; ownership→district | internet penetration 72%→79% (2025); Dar 14.1M subs; smartphone 41.8% | ownership % → district via PHC; penetration region |
| Education (literacy / enrolment / PTR) | **NBS 2022 PHC Education Monograph** + **BEST 2023** (MoEST/PO-RALG/TAMISEMI) | region (literacy); **council (enrolment/PTR)** | literacy 83.0% (Tabora 68.0% → Dar 97.5%); primary PTR 1:57; sec NER ~27% | enrolment/PTR **council**; literacy region |
| DRR implementation | PMO-DMD (TEPRP, EOCC) + UNDRR/GFDRR | national + named regions | **National EOCC Dodoma (14-Jun-2023)**; WASH stocks in 6 regions (Shinyanga/Lindi/Dar/Mbeya/Dodoma/Kilimanjaro); 5 EPRPs, 12 districts | presence overlay — **not a per-council score** |
| Governance | World Bank WGI (national); **CAG/NAOT LGA audits (council)** | national + **council** | Gov. Effectiveness −0.63 (2021); CAG FY2022/23: 99.5% unqualified LGA opinions | WGI flat national; CAG audit-opinion = council overlay |

---

## G. Data-integrity actions flagged by the hunt

1. **HIV (health_burden.csv):** Njombe 11.4% → **12.7%** (THIS 2022-23, published). Iringa 11.1%, Mbeya 9.6%.
2. **Refugees (displaced_refugees.csv):** 2024 camp figures are **invalidated** by 2026 closures (Nduta closed 30-Apr-2026; Nyarugusu drawing down, closing 31-Jul-2026). Refresh from UNHCR before this drives any current-state score.
3. **Wildfire (hazard_overlays.csv):** still the "MODIS/VIIRS refine pending" placeholder while **real 138-district fire counts sit on disk** (`FIRE DATA/TZ_ACTF2021…xlsx`). Wire them in.
4. **Stunting:** ignore any 60–88% regional table (conflated); authentic is national 30% / Iringa 57% / Dar 18% (TDHS-MIS 2022).
5. **Poverty:** ignore any table ranking Njombe/Kilimanjaro as *poorest* (inverted); Kigoma is poorest, Kilimanjaro least poor.

---

## H. Authentic upgrade paths (gaps that ARE fillable, next phase)

These need a raster/dataset download + zonal extraction (the same pattern as the existing CHIRPS pipeline), then min-max into the council layer (raise-only where appropriate):

- **Earthquake PGA** ← GEM SSA grid (zonal max per council).
- **Landslide** ← NASA LHASA ~1 km susceptibility (zonal mean).
- **Volcano** ← GVP points (status-weighted proximity decay).
- **Aridity** ← CGIAR Global Aridity Index v3 1 km.
- **NDVI drought stress** ← USGS FEWS eMODIS 250 m.
- **Lightning** ← NASA LIS/OTD 0.1° (land cells; Lake Victoria basin validates).
- **Deforestation** ← GFW/Hansen 30 m (ADM2 clip).
- **Soil erosion** ← GloSEM 250 m (label modelled).
- **Mangrove loss** ← Global Mangrove Watch polygons (coastal councils).
- **Wildfire** ← TZ_ACTF on-disk district counts (immediate).
- **Habitat** ← 2022 PHC district housing-condition tabulations.
- **Health-facility access, education enrolment/PTR, local governance** ← MoH HFR, BEST/TAMISEMI, CAG NAOT — all natively council-level.

Genuinely **not** per-council (use region/national proxy, labelled): stunting, HIV, malaria, mortality, basic-needs poverty, MPI, regional GDP, remittances/ODA, WGI governance, communication penetration, DRR structures, tropical-cyclone rate.

---

## I. Round 2 — council-granular sources (population / TCVMP / TASAF / IPC / JICA)

- **Population (2022 PHC) — EXTRACTED & VALIDATED.** Per-council 2022 census population for all 195 councils in `data-source/population_2022_councils.csv`. Sum = **61,741,120 — exactly the official URT total** (mainland 59,851,347 + Zanzibar 1,889,773); agrees with on-disk `council_climate.pop2022` within 10% on every matched name. Source: NBS 2022 PHC Administrative Units Population Distribution Report (parsed via citypopulation.de). This is the authentic council **denominator** for derived indicators (TASAF intensity, facility density, exposure). Finer paths: NBS council-level projections 2023–2050 (per-council PDFs), NBS 5-level census shapefiles, WorldPop/GRID3 100 m for ward allocation.
- **TCVMP — Tanzania Climate Vulnerability Mapping Platform** (`tcvmp.pmo.go.tz`). Official PMO-DMD + Global Center on Adaptation index (IMF RSF-funded, 2024): **40+ climate indicators** (temp, precip, drought, flood, tropical-cyclone wind, landslide, sea-level rise, wet-bulb…) at **adm0→adm3 (all 3,285 wards)**, historical 1971–2020 + SSP126/245/370/585 projections. **Visualization-only — no public download or API** (confirmed by fetch). It is a **parallel government vulnerability index** → a benchmark / integration target, not a downloadable dataset; bulk data needs a formal request to PMO-DMD/GCA.
- **TASAF / PSSN poverty** (council/village-native, the route below region). Per-council poor-household counts exist in the **Unified Registry of Beneficiaries** (administered village→mtaa/shehia→council); PSSN II ≈ **1.3–1.4M households / ~5M people across 186 PAAs** + Zanzibar; **PSSN III (Mar 2026) targets ~100 poorest councils** (an internal council poverty ranking exists). NOT a machine-readable file. Confirmed published fragments: **Mbeya 7 councils = 37,789 HH; Dar es Salaam 3 councils = 1,535 HH** (Ilala 594, Ubungo 437, Kinondoni 304). Authentic indicator: `PSSN beneficiary HH ÷ 2022-census council HH` (min-max standardized; a *targeted-poverty intensity*, not an absolute rate). Extraction path: parse TASAF quarterly-report PDFs (Oct–Dec 2022) + NBS PSSN2 IE Baseline 2022; or formal registry request.
- **IPC / MUCHALI food security** (council = assessed subset). Council × phase × population is in a **machine-readable HDX CSV** (`united-republic-of-tanzania-acute-food-insecurity-country-data`). Assessed subset **shrinking 28→21→16 councils** (funding). Only **Longido & Monduli (Arusha)** reached area-Phase-3 in the window (Nov 2023–Apr 2024, ~900k in Phase 3+ nationally); Feb–May 2025 all 16 = Phase 2 (466k in Phase 3 within them). **Hard rule:** join phases only to named councils; unassessed councils = NULL, never Phase 1.
- **JICA** (OpenJICAReport, PDF). Dar es Salaam Urban Transport Master Plan 2018 (Msimbazi flood basin ~1.6M people; Dar pop → ~10M by 2030s); National Irrigation Master Plan 2018 (potential 29.4M ha — drought/agriculture base); rural water-supply plans (Mwanza/Mara, 428 villages + 57 schemes).
- **Tooling:** WebFetch is available to the main loop (the round-1/2 subagents' was blocked). The IPC HDX CSV, TASAF quarterly PDFs, and NBS per-ward census tables are therefore now extractable on request — the next authentic fills (council food phase, TASAF poverty intensity) are unblocked.

---

*Compiled from an eight-corner deep data hunt (two rounds). Every value above is traceable to a named
producer + dataset + year. The benchmark dataset (`*_Benchmark.xlsx`) is filled from the official INFORM
workbook (NORMAL) and the on-disk EO computations (ADVANCED); `population_2022_councils.csv` adds the
validated census denominator; this register is the roadmap for authentically closing the remaining gaps
without fabricating a single council number.*
