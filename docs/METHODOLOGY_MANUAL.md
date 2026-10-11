# INFORM Tanzania: Methodology & Data-Integrity Manual

**Living document. Honest by design.** This explains, end to end, how a raw measurement
(a population count, a rainfall record, a flood event) becomes a 0–10 indicator, how
indicators combine into the INFORM Risk, and how a Data-Entry edit travels the same path.
Where a method is approximate, or a value looks too close to a neighbour, it is **flagged
here openly** so we can improve it together, not hidden. Numbers below are real, taken
from the current dataset (`src/data/tanzania-inform-risk.json`).

> **Superseded, 9 October 2026.** This manual describes the pipeline that built the dataset up to
> September 2026: computed drought and flood indices folded into the INFORM values with a "raise-only"
> floor, flood amplified by exposure, documented overlays and hand grades for the empty hazards, and the
> Kondoa district row quoted as the "official national INFORM value (4.1)". The integrity assessment of
> October 2026 (`docs/assessment/INFORM_TZ_Integrity_Assessment_2026-10.md`) found that this changed
> 165 of 170 units of the INFORM SADC 2024 workbook and that the national figure was not national.
> Since then:
>
> - **The Core is the workbook, exactly** (`scripts/build-core.mjs`; reproduced by tests at 8,664/8,664
>   standardised values and 170/170 risks). Sections 1 and 5 below (the three aggregation rules) remain
>   correct; the worked numbers now come from `docs/WORKED_EXAMPLE.md`, regenerated from the engine.
> - **The national figure is the INFORM aggregate of the 195 councils**: 3.8 (Hazard & Exposure 2.4,
>   Vulnerability 3.8, Lack of Coping Capacity 6.2) on the workbook exactly, and 4.1 (2.6, 4.2, 6.2) on the
>   live model after the validation quarantine of 10 October 2026 (section 8), labelled as not an official
>   INFORM figure.
> - **Every Tanzanian computation is out of the Core.** Where kept, it is a documented sub-indicator of
>   the **Advancement layer**, computed from its own inputs and shown on each profile beside the Core.
>   There is no raise-only floor, no flood x exposure rule, no overlay and no hand grade anywhere.
> - **Councils carry their workbook unit's values** until institutions enter council values through the
>   Data portal (measured values, or 0-10 scores by the INFORM method with a citable source), reviewed by
>   the owning institution's chain; an approved council value applies to that council alone.
>
> The current methodology is the Methodology page of the site (`/methodology`), the worked example and
> the assessment. Sections marked *legacy* below are kept as the record of the retired pipeline and must
> not be read as the current method.


---

## 1. The risk journey (one picture)

```
 raw data ──standardize──▶ indicator 0–10 ──MEAN──▶ category 0–10
        └────────────────────────────────────────────────┘
 category 0–10 ──scaled GEOMEAN (Excel Box 6)──▶ dimension 0–10
 Hazard&Exposure · Vulnerability · Lack-of-Coping ──∛(H×V×LCC)──▶ RISK 0–10 ──▶ class
```

Three rules, taken **exactly from the Tanzania INFORM Excel** (the INFORM SADC 2024 workbook,
`data-source/tanzania-inform-risk.xlsx`, locked by `src/engine/risk/__tests__/workbook.golden.test.ts`):

| Step | Method | Where |
|---|---|---|
| indicator → category | **arithmetic MEAN** | `AVERAGEIFS` in Excel |
| category → dimension | **INFORM scaled geometric mean** | Excel Box 6 (below) |
| dimension → risk | **∛(H × V × LCC)** (geometric mean) | INFORM Risk index |

The same three rules run in the engine (`src/engine/risk/model.ts`) for the shipped Core and for
every approved data update, so a workbook value and an institutional value behave identically.

---

## 2. Standardization: turning a raw number into 0–10

*Legacy in part (October 2026): the Core standardises every indicator by the workbook's own
specification (denominator, outlier fence, logarithm, the indicator's reference range, direction), not by
a min-max over Tanzania's districts; the population example below described a removed exposure
indicator. See `docs/WORKED_EXAMPLE.md`, step 1.*

Every indicator must sit on the same 0–10 scale ("higher = more risk") before it can be
combined. We use **min-max** scaling across Tanzania's districts:

> **idx = (value − min) / (max − min) × 10**

For quantities that are highly skewed (a few huge cities, many small rural areas) we take
the **log first** (log min-max), so the scale is not dominated by one outlier:

> **idx = (log₁₀value − log₁₀min) / (log₁₀max − log₁₀min) × 10**

### Worked example: population → Exposure (your "3900" question)
Exposure is **population density** (people per km²), log-scaled because Dar (4,600/km²)
dwarfs pastoral Longido (22/km²).

- Ilala (Dar): density 4,643/km² → log₁₀ = 3.667 → **exposure 8.66**
- Kondoa: density 54/km² → log₁₀ = 1.73 → **exposure 3.19**
- Longido: density 22/km² → log₁₀ = 1.34 → **exposure 2.10**

So a district of (say) 3,900 people in a 1,300 km² ward = density 3.0/km² → near the bottom
of the scale; the *same* 3,900 people in 5 km² = 780/km² → high. **Exposure is about
concentration, not the raw headcount.** (Population comes from the NBS 2022 census, per
council, summed to the district: see §7.)

### Why min-max and not "rank"
An earlier draft ranked districts (1st, 2nd, …). That spreads everything evenly but
**invents differences where the data is flat**: it once put random districts top of the
drought list. Min-max keeps the *real* spacing: if two districts are genuinely similar,
their scores stay close (and yes, sometimes they look "too close", that is honest, see §8).

---

## 3. Hazard indicators: what we compute, honestly

*Legacy (retired October 2026): none of the computations in this section is in the Core. The drought
composite was withdrawn (it scored wet highland councils 10); its members enter the Advancement layer
separately. The flood and exposure rules, the floors and the overlays are removed.*

### 3.1 Drought (computed, CHIRPS v3 + ERA5)
Drought is **slow** and hits communities through **failed growing seasons** (→ food
insecurity, IPC/MUCHALI). SPI/SPEI *frequency* is ~16 % everywhere by construction, so it
can NOT rank where drought is worse. Instead we blend four real signals, each min-maxed:

> **drought = minmax( 0.30·aridity + 0.20·variability + 0.15·SPEI-depth + 0.35·season-failure ) × 10**

- **aridity** = low mean annual rainfall (1991–2024 CHIRPS v3)
- **variability** = interannual rainfall CV
- **SPEI-depth** = mean magnitude of SPEI-12 during droughts (uses ERA5 temperature → Thornthwaite PET)
- **season-failure** = how often the main 4-month rainy season falls below 80 % of normal

Result (top): Longido 9.7, Simanjiro 9.1, Singida 8.7, Hanang 8.7, Kondoa 8.6: the real
pastoral north + semi-arid centre. Bottom: Rungwe 0.5, Kyela 0.5, Mafia 1.5: the wet
highlands/islands. *(Script: `scripts/compute-drought-spi-spei.py`.)*

The computed value is **floored at the documented baseline** (`drought = max(computed,
documented)`): like flood, a known drought is never lowered, only raised where the climate
evidence is stronger.

### 3.2 Heavy rainfall & flood (computed, CHIRPS daily + recorded events)
Two ingredients:
1. **Heavy-rain index**: count of days where the district-mean rainfall exceeds **50 mm**
   (heavy) and **100 mm** (very heavy), per year, 2015–2024 daily CHIRPS, min-maxed (very-heavy
   weighted ×2). Top: the Pemba/Zanzibar coast (Mkoani 14 heavy days/yr).
2. **Recorded floods**: a documented, *editable* event list (`data-source/flood_events.csv`)
   with sources (DesInventar / EM-DAT / PMO-DMD / news). `event index = min(10, 4 + 2 × #events)`.

The **physical flood hazard** = `max(heavy-rain index, event index)`, so a coastal cloudburst
zone *or* a documented river-flood district both score high.

### 3.3 Flood = Hazard, amplified by Exposure (never lowered)
INFORM hazard is **Hazard × Exposure**, but exposure must only ever **raise** a flood
score, never hide a flood-prone place. So:

> **hazardFlood = max( documented flood , heavy-rain index , recorded-event index )**
> **flood = max( hazardFlood , √(hazardFlood × exposure) )**

Exposure lifts the score only where population *exceeds* the hazard (dense flood cities);
a sparsely-populated but flood-prone district keeps its full documented hazard.

- **Ilala (Dar):** heavy-rain 4.0, 2 recorded floods (2011, 2018) → event index 8 →
  hazardFlood = **8**. Exposure 8.66 → √(8 × 8.66) = 8.3 → flood = max(8, 8.3) = **8.3**.
- **Pangani (coastal, flood-prone but sparse):** documented hazard 9.8, exposure 2.9 →
  √(9.8 × 2.9) = 5.3 → flood = max(9.8, 5.3) = **9.8: preserved.**

> ⚠️ An earlier draft multiplied flood *down* by exposure (Pangani 9.8 → 3.3, Korogwe 8 →
> 2.1: hiding known flood areas). That bug was caught by a before/after audit and fixed:
> **exposure now amplifies only; a documented flood hazard is never lowered.**

### 3.4 Other hazards: deepened one by one (all raise-only) *[legacy: removed from the Core]*
Each is floored at the documented baseline (`hazard_baseline.csv`): computed/overlay evidence
can raise a hazard, never lower it.
- **Storms & tropical cyclone**: coastal exposure overlay graded south→north, based on **Cyclone Hidaya
  2024** (Mafia landfall, 18,862 affected), **Lindi cyclone 1952**, Zanzibar 1872. The INFORM
  baseline had ~0 here: outdated after Hidaya (first cyclone to hit Tanzania).
- **Heatwave (new, computed)**: ERA5 temperature climatology (hot coast/lowlands → cool
  highlands), capped at 6.5 (Tanzania heat is moderate, not Sahel-extreme). `heatwave_era5.csv`.
- **Lightning (new, overlay)**: Lake Victoria basin, one of Earth's top flash-density hotspots
  (NASA LIS/OTD; ~3,000–5,000 thunderstorm deaths/yr in the basin); shore districts 8–9.
- **Volcano (new, overlay)**: Ol Doinyo Lengai (active, Lake Natron), Rungwe Volcanic Province,
  Kilimanjaro & Meru (dormant).
- **Zoonoses / plants & pests (new, overlay)**: 2020 desert-locust invasion (north), fall
  armyworm (maize belts), livestock disease (pastoral), tsetse (western miombo).
- **Earthquake, landslide, coastal hazards, wildfire, environmental degradation** keep their
  **documented / INFORM SADC** values (earthquake already follows the rift; the others are
  differentiated). *[Legacy plan: fire detections and the USGS event record are Advancement-layer members,
  never overlays on the Core.]*
- **Vulnerability & coping** indicators are the next dimensions to deepen, so the Risk total will
  keep evolving as the model becomes more complete. That is expected and documented, not drift.

---

## 4. Vulnerability & Coping: current sources

*Legacy (retired October 2026): the Core's vulnerability and coping values are the workbook's (Global
Data Lab, World Bank, WHO, UNHCR and others, per the workbook's Metadata sheet). The HBS, TDHS, THIS,
UNHCR, IPC and census-facility rebuilds below are out of the Core; institutions may re-enter them
through the Data portal on the indicator's own definition.*

- **Development & poverty**: NBS Household Budget Survey 2017/18 (poverty headcount); already
  differentiated by region (Kigoma/Geita/Kagera highest → Dar/Kilimanjaro lowest).
- **Children health & nutrition**: TDHS 2022 (under-5 stunting; Iringa/Njombe/Rukwa highest).
- **Health conditions (NEW)**: disease burden = **HIV** (THIS 2022-23: Njombe 11.4 % → Kigoma
  1.7 %) + **malaria** (TDHS-MIS 2022: Tabora 23 %, Mtwara 20 %, Lake/West high; highlands ~0),
  min-max blended, raise-only. `health_burden.csv`.
- **Displaced people (NEW)**: **UNHCR 2024** refugees: Nyarugusu (Kasulu ~130 k) + Nduta
  (Kibondo ~75 k) → these were **0**, now **10 / 8** (burden-scaled). `displaced_refugees.csv`.
- **Livelihoods / food security (NEW)**: **IPC / MUCHALI** Nov 2023–Oct 2024: **Longido &
  Monduli in Phase 3 (Crisis)**, 16 more pastoral/semi-arid councils in Phase 2 (Stressed),
  applied raise-only. Only the **classified** councils get a value; the many baseline `0`s are
  **no-data** (INFORM SADC didn't classify them) and are left as-is, never fabricated.
  `food_security.csv`.
- **WASH**: derived from **real 2022-census water points & boreholes** (more resource → lower
  "lack of coping"), rank-scaled 2–8.
- **Access to health / education**: 2022 PHC facility counts.
- **DRR implementation**: EPRP / regional EOCC / drought Anticipatory-Action records (the
  districts you provided) lower the institutional "lack of coping".
- Indicators not yet localized keep the INFORM SADC 2024 baseline.

---

## 5. Aggregation: the exact formulas

### 5.1 Indicator → Category: MEAN
`category = average of its indicators` (ignoring blanks). E.g. Rufiji Natural-hazards =
mean(coastal 0, drought 2.9, earthquake 0.7, env. degradation 5.4, flood 9.0, landslide 5.2,
storms 0, volcano 0, wildfire 4.5) = **3.08** (heatwave, lightning and zoonoses have no data and are
excluded). *(Before the mean, each indicator group is itself the mean of its workbook indicators with
data: see `docs/WORKED_EXAMPLE.md`, step 2.)*

### 5.2 Category → Dimension: INFORM scaled geometric mean (Excel Box 6)
> **dimension = (10 − GEOMEAN( (10−c₁)/10·9 + 1 , (10−c₂)/10·9 + 1 , … )) / 9 × 10**

Because the scores are inverted before the geometric mean, the result is always **at or above** the
plain average: a **high** category weighs more than a low one, so a serious problem in one category is
not averaged away by a benign one.

**Worked example: Rufiji Hazard:** Natural 3.08, Human 2.50 (plain average 2.79).
scaled: (10−3.08)/10·9+1 = 7.228 ; (10−2.50)/10·9+1 = 7.750.
GEOMEAN = √(7.228 × 7.750) = 7.4845. dimension = ROUND((10 − 7.4845)/9 × 10, 1) = **2.8** (≥ 2.79). ✔ matches the engine.

> **Full end-to-end worked example** (real data, every indicator from raw value → standardisation →
> 0-10 → category → dimension → risk, plus how the four levels harmonise): see
> [`docs/WORKED_EXAMPLE.md`](WORKED_EXAMPLE.md), with the data tables in
> `docs/worked_example_indicators.csv` and `docs/worked_example_levels.csv`. It uses Rufiji
> (a documented flood district), its council Kibiti, and the Pwani region, regenerated from the live
> dataset by `scripts/build-worked-example.mjs`.

### 5.3 Dimension → Risk: cube root
> **Risk = ∛(Hazard × Vulnerability × LackOfCoping)**

**Rufiji:** ∛(2.8 × 3.8 × 6.0) = ∛63.84 = 3.995 → **4.0** (Medium). **Kondoa:** ∛(2.2 × 5.5 × 5.9) =
∛71.39 = **4.1** (Medium). ✔ (The in-app Methodology page recomputes this example live from the engine
for any council.)

Then `Risk` is classed with the **Tanzania thresholds** (Very-Low < 2.5 < Low < 3.4 < Medium
< 4.3 < High < 5.9 < Very-High).

### 5.4 Missing data: no-data never distorts the score
A blank indicator means **NO DATA** and is stored as `null`. Every aggregation (mean & scaled
geomean) **excludes null entirely**: it is *not* read as 0:
- `mean(5, 5, null) = 5`, not 3.33. **A no-data indicator can never pull a score up or down.**
- `0` is different: it is a **real measured zero** (e.g. zero coastal-hazard exposure in landlocked
  Dodoma), and it **is** included.
- An all-no-data category drops out cleanly (`null`), so the dimension is the scaled-geomean of
  the categories that actually have data.

In **Data Entry**, clearing a field sets it back to no-data (`null`): it removes data rather than
zeroing it. Each district shows a **data-coverage %** (share of the 32 leaf indicators that have
data) as a reliability cue, so a score built on sparse data is flagged for what it is. The
ambiguous INFORM `economic` slot has no workbook data anywhere (170/170 null) and by
design affects nothing. *(Locked by tests in `src/engine/risk/__tests__/`.)*

---

## 6. Keying data in (Data Entry): same formulas, with provenance

*Legacy (retired October 2026): the steps below describe the browser-only editor of the first
version. Values now enter through the Data portal of the site: institutions submit measured values in
natural units, or 0-10 scores by the INFORM method with a citable source, for the nation, a region or a
council; the owning institution's reviewer approves; the engine recomputes every level.*

1. Pick **role** (PMO/Admin apply directly; Sector officer submits for approval), region, district.
2. Edit a **dimension score** directly, or **Fill indicators** to set each 0–10 leaf, for
   **Hazard, Exposure, Vulnerability, Coping**.
3. **Exposure** has its own box; changing it instantly recomputes flood = √(hazard × exposure)
   and the Hazard score: the live preview uses the *same* mean → scaled-geomean → ∛ chain.
4. Choose the **Data source / authority** (NBS, TMA, MoW, MoH, MoA, PMO-DMD, DRR Coordinator,
   MUCHALI/IPC). Each edited indicator is **stamped** with that authority + date.
5. **Save / Submit → Apply.** The edit flows to the map, charts, tables. Hover the indicator
   and it shows **"✎ Updated by MoW · 2026-06"**; un-edited indicators show the registry source
   (e.g. **"📎 Source: TMA (+MoA, CHC) · CHIRPS v3 …"**).

Storage today is the browser (`localStorage`); the Supabase schema is ready for multi-user.

---

## 7. Data sources (per indicator)

*Legacy (retired October 2026): the Core's source for every indicator is the workbook's Metadata sheet
(`src/data/inform-workbook-sources.json`), shown on the site beside each value. The table below lists
the sources of the retired pipeline.*

| Indicator | Authority | Dataset | How standardized |
|---|---|---|---|
| Drought | TMA / MoA | CHIRPS v3 1991-2024 + ERA5 t2m | aridity+variability+SPEI-depth+season-fail, min-max |
| Flood | PMO-DMD / TMA / MoW | CHIRPS v3 daily + recorded floods | max(>50/100 mm count, events) × exposure |
| Exposure | NBS | 2022 PHC population | density, **log** min-max |
| Poverty | NBS | HBS 2017/18 | INFORM baseline |
| Stunting | MoH | TDHS 2022 | INFORM baseline |
| Food security | MUCHALI / IPC (MoA) | IPC rounds | *to be entered* |
| WASH | MoW | 2022 PHC water/boreholes | resource availability 2–8 |
| Health/Education access | MoH / NBS | 2022 PHC facilities | resource availability |
| DRR implementation | PMO-DMD / DRR Coordinator | EPRP/EOCC/AA records | investment overlay |
| Wildfire, earthquake, etc. | INFORM SADC 2024 | INFORM | baseline (not yet recomputed) |

---

## 7b. Benchmark 2026: institutional values for the empty and the withheld indicators

The SADC workbook lists template indicators without data (heatwave, lightning, vehicle accidents, hazardous
material, sea-level rise, the IPC classification, female-headed households, disability) and carries a few values that failed
validation (coastal erosion 0 everywhere, a single cyclone unit, food security, displacement, Dodoma's
electricity, Ukerewe's landslide). The Benchmark 2026 (`docs/BENCHMARK_2026.md`) supplies for those
indicators measured values prepared from public, citable datasets, in the shape the Data portal produces
for an institution's approved values. The engine applies them as approved institutional values of
10 October 2026: the lineage is shown wherever the value appears, the hold on a replaced workbook value is
lifted, and a newer approved value from the portal supersedes the benchmark value. The workbook itself is
never changed.

- Activation: a template indicator gets a Tanzanian definition (unit, keyed level, direction,
  normalisation and reference range), exactly as the workbook's Metadata sheet defines every indicator in
  use; the reference range of an activated indicator is resolved from the Tanzanian data, the workbook's
  own rule for its "Data range" indicators. The food-security percentage's range is re-resolved to 0 to 100.
- Replacement: an existing indicator keeps its workbook definition and range; the benchmark value is a
  measurement in the same unit from the same or a better source (Digital Earth Africa for coastal
  erosion, the 2022 census for electricity, IDMC for displacement).
- Recheck: where the recomputation from the workbook's own source reproduces the workbook (Kagera's
  earthquake index, the Lake zone's drought frequency), the value is retained and the data note explains.
- Human hazards measured where they happen: vehicle accidents as the density of recorded road crashes
  (police statistics 2024-2025, each police region's crashes shared among its councils by population and
  divided by land area, so the cities, where people and traffic are densest, carry them) and hazardous
  material as the density of sites that produce, store, process or dispose of hazardous materials
  (OpenStreetMap installations, the 2022 census mapping of industries and hospitals, the NEMC environmental
  certificates of July-September 2026). Both are log-transformed, as the workbook does for its counts.
- Internal violence (ACLED events and fatalities by region) is withheld from the live model by programme
  decision (data note DN-12): too complicated to read and communicate as a council's hazard. The workbook
  keeps the values; the human category is the mean of the other groups.
- Institutions measured at the council (11 October 2026, `src/engine/risk/institutional.ts`): two Tanzanian
  indicators added inside the workbook's institutional groups, beside its national Sendai score,
  anticipatory-action coverage, government-effectiveness score and regional corruption index. *DRM
  arrangements in place* (DRR implementation) is the share of five arrangements the council has (EPRP,
  RVCA, trained ERT, EOCC, DRR training of the committee); an arrangement not recorded is not in place,
  the registers being PMO-DMD's own. *Disaster management committee functioning* (Governance) is the share
  of the assessed criteria met (committee active, stakeholder collaboration, involvement in DRR); the law
  and policy are the same everywhere and are not scored, and a council has a value only once assessed.
  Both are fixed 0 to 100 scales that decrease risk. The published lists seed them through the Benchmark
  2026; the committees' approved records supersede them through the Data portal. A council's arrangements
  lower its own lack of coping capacity and, through the unweighted means of the INFORM aggregation, its
  region's and the country's in proportion to the councils covered.
- What remains empty: zoonoses, plants and pests (no validated national dataset at council level yet);
  agricultural drought for the five Dar es Salaam councils (not applicable).

## 8. Honest limitations: the "to-improve" list (flag & discuss)

*Legacy in part (October 2026): items 1 to 4b, 6, 8 and 9 describe the retired pipeline. The current
limitations are the eleven items of the Methodology page (hazard aggregation rule, SADC classes, global
sources, six empty groups, coherence, relative ranges, inheriting councils, shared units, Advancement
status, precision, no reliability score).*

*Sensitivities and releases (October 2026):* the Methodology page shows, beside the Core and never on a
map, what INFORM Global's hazard rules would give (inverted geometric mean of the natural hazards; human
hazard as the conflict maximum; Advanced model section), Tanzanian class thresholds by natural breaks for
risk, the dimensions and the categories (Classification section), the guidance's coherence check over the
councils (Quality section; the report per release is `docs/assessment/INFORM_TZ_Coherence_<release>.md`,
`node scripts/coherence-report.mjs`), and a lack-of-reliability score on every council profile (missing
groups, age of the data, inherited or shared values; `src/engine/risk/variants.ts`). Releases, validation
and the update cycle: `docs/RELEASES.md`; boundary changes: `data-source/BOUNDARIES.md` and
`python3 scripts/check-boundaries.py`. Decisions D11 and D12 remain with PMO-DMD. The indicator integrity
recheck of 10 October 2026 (`node scripts/integrity-recheck.mjs`,
`docs/assessment/INFORM_TZ_Indicator_Integrity_<release>.md`) rechecked every value of every indicator: eleven
workbook values carry a data note on the site (`src/data/inform-data-notes.json`) and are raised with INFORM
(JRC); in the Advancement layer the facility densities were recomputed on the council polygons with the
census facility types filtered, a felt-intensity earthquake member was added and six member ranges fitted.

*Validation quarantine (10 October 2026):* a workbook value that fails validation is withheld from the live
model (treated as missing for the unit, as INFORM's guidance treats data that fails validation; a group with
other indicators is recomputed from them) until an institution supplies it through the Data portal or the
workbook is corrected: 391 values over the 170 units (coastal erosion and food security for every unit;
Dar es Salaam's and the Lake zone's drought; Kagera's earthquake; Ukerewe's landslide; Dodoma's electricity;
two displaced-people rows). The workbook stays reproduced exactly for the tests (`buildModel` with
`workbookOnly`). Live national aggregate 4.1 against 3.8 on the workbook; 62 councils change class.

1. **Drought exposure is agricultural, not urban.** We multiply *flood* by population exposure
   but **not drought**: multiplying drought by urban density would wrongly demote pastoral
   communities (Longido). Better: cropland/livestock exposure. *Open.*
2. **Heavy-rain now uses CHIRPS v3 daily** (2015–2024, national download complete, ~96 % day
   coverage). Earlier drafts used v2.0 daily; v3 gives slightly lower extreme-day counts but the
   same spatial pattern (Pemba/Zanzibar/Mafia coast highest).
3. **Some values sit close together** (e.g. several semi-arid districts ~8.4–8.7 drought).
   That is real similarity, not precision: min-max preserves true spacing rather than forcing
   a spread. Don't over-read 0.1 differences.
4. **Dar es Salaam drought = 10 (documented artifact).** Ilala/Temeke carry drought 10 from the
   documented INFORM baseline: clearly too high for a coastal city. The precautionary floor
   keeps documented values rather than silently lowering them, so it persists (the *computed*
   value is ~6.6). **Flagged for correction via Data Entry** (MoA/TMA), which now overrides it.
4b. **Drought season in bimodal highlands (artefact).** The drought index scores the season it detects as
   the main rainy season. In some bimodal highland councils it selects the erratic short rains (Oct–Jan)
   instead of the reliable long rains: **Lushoto computes to 10.0** (season-failure 0.35, SPEI 1.56), which
   is implausible for the wet Usambara highlands. *Open*: score both seasons in bimodal areas (or the
   livelihood-relevant one) and validate against MUCHALI/IPC history; meanwhile read very high drought in
   wet highland councils with caution.
5. **Administrative structure: the model now speaks the real NBS-2022 structure by default.**
   The explorer, the ranked table, the charts and Data Entry all open on the **195 councils (LGAs)**,
   aggregating to the **31 regions**, with the **INFORM aggregate of the 195 councils (3.8 on the workbook, 4.1 live, not an
   official INFORM figure)** as the national figure *[corrected October 2026: the "official 4.1" quoted
   here before was Kondoa's row]*. This is a *consistent scaling of the same source*: the model was built
   from the INFORM Tanzania **country-model workbook** (170 district-level units, the **reference**),
   and the 195 NBS-2022 councils are derived from it. **195/195 councils carry data**: 175 take the
   values of their workbook unit directly; **20 councils created after the workbook's boundaries**
   (Kibiti←Rufiji, Ubungo←Kinondoni, Kigamboni←Temeke, Mlimba/Ifakara←Kilombero…) **inherit their
   parent's values, flagged**, until council values are approved (**never fabricated**). Because the data
   is 170-resolution, **25 workbook units back two councils each**. A council carries its unit's values
   for all three dimensions; an **approved council value (measured or scored) applies to that council
   alone**, and the Data portal shows which councils each change reaches. Council risk is computed live
   as ∛(H × V × LCC), so approved values reach the map, regions and profiles immediately. **Regions
   aggregate from their councils the INFORM way** (indicator means → groups → categories → scaled geomean
   → cube root; facilities summed over distinct workbook units, so no double counting). The **170
   workbook units remain available as a labelled reference level**. Official NBS 2022: 31 regions · 150
   districts · 195 councils · 4,344 wards. Reconciliation: `scripts/export-councils.py` →
   `tanzania-councils.json` + `council_reconciliation.csv`.
6. **Wildfire, earthquake, lightning, storms** are the workbook's values in the Core (earthquake is the
   GEM exposure index). Fire detections, the USGS event record and LIS/OTD lightning density are
   Advancement-layer members, present or planned, never Core sources.
7. **Standardization uses the workbook's own reference ranges** (17 fixed pairs and 36 data ranges
   over the 170 units, frozen at the 2024 release), not INFORM Global's. Subnational models are not
   comparable with INFORM Global; never set the two side by side as if they were.
8. **Precautionary by design** *[legacy: the floor was removed in October 2026; the Core is the
   workbook and the Advancement layer is shown beside it]*. Flood and drought were *floored* at the
   documented baseline: computed evidence could **raise** a hazard but never **lower** it. This errs toward flagging
   risk (safer for planning) at the cost of keeping a few possibly-overstated documented values
   (see #4). A before/after audit confirms **0 districts** had flood or risk-class lowered.
9. **Risk evolves as the model is completed, by design** *[legacy: these fills were hand grades and
   overlays inside the Core and were removed in October 2026; the six empty groups stay empty in the
   Core until filled in the Advancement layer or by institutions]*. Populating previously-blank hazards
   (storms, heatwave, lightning, volcano, zoonoses, earthquake-refine, wildfire-refine, plus the
   technological hazards road-accidents & hazmat) raised High-risk districts from **18 → 43**,
   all raise-only (a value-audit confirms **0 districts below their documented baseline**). The
   coast (cyclone + heat), the Lake-Victoria zone (lightning + flood) and the western rift
   (earthquake) are the main risers. **Technological hazards (vehicleAccidents, hazmat) are kept
   deliberately moderate**: human hazards carry 50 % of the Hazard dimension, so road accidents
   should not dominate *disaster* risk. Deepening **vulnerability & coping** next will shift it
   again, toward a more complete picture, not drift. Every change is traceable to a sourced indicator.

*Everything in this list is editable in Data Entry and improvable in code: that is the point
of writing it down.*

---

## 9. Risk over time (snapshots)

Risk is reported **"as of"** a date (`metadata.asOf`, currently the baseline). The plan to
turn this into a time series, with dated snapshots, detection of **emerging** (risk ↑) and **improving** (risk ↓)
areas and a Δrisk map, is in **[RISK_OVER_TIME_PLAN.md](RISK_OVER_TIME_PLAN.md)**.
Foundation already in place: every Data-Entry edit is timestamped with its authority, the
CHIRPS inputs are inherently temporal (1991–2024), and the trend-chart components exist, so
future seasonal refreshes can be compared to spot communities whose risk is rising before it
becomes a disaster.
