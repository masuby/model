# INFORM Tanzania — Methodology & Data-Integrity Manual

**Living document. Honest by design.** This explains, end to end, how a raw measurement
(a population count, a rainfall record, a flood event) becomes a 0–10 indicator, how
indicators combine into the INFORM Risk, and how a Data-Entry edit travels the same path.
Where a method is approximate, or a value looks too close to a neighbour, it is **flagged
here openly** so we can improve it together — not hidden. Numbers below are real, taken
from the current dataset (`src/data/tanzania-inform-risk.json`).

---

## 1. The risk journey (one picture)

```
 raw data ──standardize──▶ indicator 0–10 ──MEAN──▶ category 0–10
        └────────────────────────────────────────────────┘
 category 0–10 ──scaled GEOMEAN (Excel Box 6)──▶ dimension 0–10
 Hazard&Exposure · Vulnerability · Lack-of-Coping ──∛(H×V×LCC)──▶ RISK 0–10 ──▶ class
```

Three rules, taken **exactly from the Tanzania INFORM Excel** (`TZ_INFORM_model.xlsx`, locked
by `excelParity.test.js`):

| Step | Method | Where |
|---|---|---|
| indicator → category | **arithmetic MEAN** | `AVERAGEIFS` in Excel |
| category → dimension | **INFORM scaled geometric mean** | Excel Box 6 (below) |
| dimension → risk | **∛(H × V × LCC)** (geometric mean) | INFORM Risk index |

The same three rules run in the offline build (`scripts/apply-climate-hazards.mjs`) **and**
live in the app when you edit (`riskModel.applyEdits`) — so a computed value and an edited
value behave identically.

---

## 2. Standardization: turning a raw number into 0–10

Every indicator must sit on the same 0–10 scale ("higher = more risk") before it can be
combined. We use **min-max** scaling across Tanzania's districts:

> **idx = (value − min) / (max − min) × 10**

For quantities that are highly skewed (a few huge cities, many small rural areas) we take
the **log first** (log min-max), so the scale is not dominated by one outlier:

> **idx = (log₁₀value − log₁₀min) / (log₁₀max − log₁₀min) × 10**

### Worked example — population → Exposure (your "3900" question)
Exposure is **population density** (people per km²), log-scaled because Dar (4,600/km²)
dwarfs pastoral Longido (22/km²).

- Ilala (Dar): density 4,643/km² → log₁₀ = 3.667 → **exposure 8.66**
- Kondoa: density 54/km² → log₁₀ = 1.73 → **exposure 3.19**
- Longido: density 22/km² → log₁₀ = 1.34 → **exposure 2.10**

So a district of (say) 3,900 people in a 1,300 km² ward = density 3.0/km² → near the bottom
of the scale; the *same* 3,900 people in 5 km² = 780/km² → high. **Exposure is about
concentration, not the raw headcount.** (Population comes from the NBS 2022 census, per
council, summed to the district — see §7.)

### Why min-max and not "rank"
An earlier draft ranked districts (1st, 2nd, …). That spreads everything evenly but
**invents differences where the data is flat** — it once put random districts top of the
drought list. Min-max keeps the *real* spacing: if two districts are genuinely similar,
their scores stay close (and yes, sometimes they look "too close" — that is honest, see §8).

---

## 3. Hazard indicators — what we compute, honestly

### 3.1 Drought (computed — CHIRPS v3 + ERA5)
Drought is **slow** and hits communities through **failed growing seasons** (→ food
insecurity, IPC/MUCHALI). SPI/SPEI *frequency* is ~16 % everywhere by construction, so it
can NOT rank where drought is worse. Instead we blend four real signals, each min-maxed:

> **drought = minmax( 0.30·aridity + 0.20·variability + 0.15·SPEI-depth + 0.35·season-failure ) × 10**

- **aridity** = low mean annual rainfall (1991–2024 CHIRPS v3)
- **variability** = interannual rainfall CV
- **SPEI-depth** = mean magnitude of SPEI-12 during droughts (uses ERA5 temperature → Thornthwaite PET)
- **season-failure** = how often the main 4-month rainy season falls below 80 % of normal

Result (top): Longido 9.7, Simanjiro 9.1, Singida 8.7, Hanang 8.7, Kondoa 8.6 — the real
pastoral north + semi-arid centre. Bottom: Rungwe 0.5, Kyela 0.5, Mafia 1.5 — the wet
highlands/islands. *(Script: `scripts/compute-drought-spi-spei.py`.)*

The computed value is **floored at the documented baseline** (`drought = max(computed,
documented)`) — like flood, a known drought is never lowered, only raised where the climate
evidence is stronger.

### 3.2 Heavy rainfall & flood (computed — CHIRPS daily + recorded events)
Two ingredients:
1. **Heavy-rain index** — count of days where the district-mean rainfall exceeds **50 mm**
   (heavy) and **100 mm** (very heavy), per year, 2015–2024 daily CHIRPS, min-maxed (very-heavy
   weighted ×2). Top: the Pemba/Zanzibar coast (Mkoani 14 heavy days/yr).
2. **Recorded floods** — a documented, *editable* event list (`data-source/flood_events.csv`)
   with sources (DesInventar / EM-DAT / PMO-DMD / news). `event index = min(10, 4 + 2 × #events)`.

The **physical flood hazard** = `max(heavy-rain index, event index)` — so a coastal cloudburst
zone *or* a documented river-flood district both score high.

### 3.3 Flood = Hazard, amplified by Exposure (never lowered)
INFORM hazard is **Hazard × Exposure** — but exposure must only ever **raise** a flood
score, never hide a flood-prone place. So:

> **hazardFlood = max( documented flood , heavy-rain index , recorded-event index )**
> **flood = max( hazardFlood , √(hazardFlood × exposure) )**

Exposure lifts the score only where population *exceeds* the hazard (dense flood cities);
a sparsely-populated but flood-prone district keeps its full documented hazard.

- **Ilala (Dar):** heavy-rain 4.0, 2 recorded floods (2011, 2018) → event index 8 →
  hazardFlood = **8**. Exposure 8.66 → √(8 × 8.66) = 8.3 → flood = max(8, 8.3) = **8.3**.
- **Pangani (coastal, flood-prone but sparse):** documented hazard 9.8, exposure 2.9 →
  √(9.8 × 2.9) = 5.3 → flood = max(9.8, 5.3) = **9.8 — preserved.**

> ⚠️ An earlier draft multiplied flood *down* by exposure (Pangani 9.8 → 3.3, Korogwe 8 →
> 2.1 — hiding known flood areas). That bug was caught by a before/after audit and fixed:
> **exposure now amplifies only; a documented flood hazard is never lowered.**

### 3.4 Other hazards — deepened one by one (all raise-only)
Each is floored at the documented baseline (`hazard_baseline.csv`) — computed/overlay evidence
can raise a hazard, never lower it.
- **Storms & tropical cyclone** — coastal exposure overlay graded south→north: **Cyclone Hidaya
  2024** (Mafia landfall, 18,862 affected), **Lindi cyclone 1952**, Zanzibar 1872. The INFORM
  baseline had ~0 here — outdated after Hidaya (first cyclone to hit Tanzania).
- **Heatwave (new — computed)** — ERA5 temperature climatology (hot coast/lowlands → cool
  highlands), capped at 6.5 (Tanzania heat is moderate, not Sahel-extreme). `heatwave_era5.csv`.
- **Lightning (new — overlay)** — Lake Victoria basin, one of Earth's top flash-density hotspots
  (NASA LIS/OTD; ~3,000–5,000 thunderstorm deaths/yr in the basin); shore districts 8–9.
- **Volcano (new — overlay)** — Ol Doinyo Lengai (active, Lake Natron), Rungwe Volcanic Province,
  Kilimanjaro & Meru (dormant).
- **Zoonoses / plants & pests (new — overlay)** — 2020 desert-locust invasion (north), fall
  armyworm (maize belts), livestock disease (pastoral), tsetse (western miombo).
- **Earthquake, landslide, coastal hazards, wildfire, environmental degradation** keep their
  **documented / INFORM SADC** values (earthquake already follows the rift; the others are
  differentiated). Next: wildfire from MODIS/VIIRS, earthquake refine from USGS — same overlay pattern.
- **Vulnerability & coping** indicators are the next dimensions to deepen — so the Risk total will
  keep evolving as the model becomes more complete. That is expected and documented, not drift.

---

## 4. Vulnerability & Coping — current sources

- **Development & poverty** — NBS Household Budget Survey 2017/18 (poverty headcount); already
  differentiated by region (Kigoma/Geita/Kagera highest → Dar/Kilimanjaro lowest).
- **Children health & nutrition** — TDHS 2022 (under-5 stunting; Iringa/Njombe/Rukwa highest).
- **Health conditions (NEW)** — disease burden = **HIV** (THIS 2022-23: Njombe 11.4 % → Kigoma
  1.7 %) + **malaria** (TDHS-MIS 2022: Tabora 23 %, Mtwara 20 %, Lake/West high; highlands ~0),
  min-max blended, raise-only. `health_burden.csv`.
- **Displaced people (NEW)** — **UNHCR 2024** refugees: Nyarugusu (Kasulu ~130 k) + Nduta
  (Kibondo ~75 k) → these were **0**, now **10 / 8** (burden-scaled). `displaced_refugees.csv`.
- **Livelihoods / food security (NEW)** — **IPC / MUCHALI** Nov 2023–Oct 2024: **Longido &
  Monduli in Phase 3 (Crisis)**, 16 more pastoral/semi-arid councils in Phase 2 (Stressed) —
  raised raise-only. Only the **classified** councils get a value; the many baseline `0`s are
  **no-data** (INFORM SADC didn't classify them) and are left as-is, never fabricated.
  `food_security.csv`.
- **WASH** — derived from **real 2022-census water points & boreholes** (more resource → lower
  "lack of coping"), rank-scaled 2–8.
- **Access to health / education** — 2022 PHC facility counts.
- **DRR implementation** — EPRP / regional EOCC / drought Anticipatory-Action records (the
  districts you provided) lower the institutional "lack of coping".
- Indicators not yet localized keep the INFORM SADC 2024 baseline.

---

## 5. Aggregation — the exact formulas

### 5.1 Indicator → Category: MEAN
`category = average of its indicators` (ignoring blanks). E.g. Kondoa Natural-hazards =
mean(drought 8.6, flood 3.8, earthquake 10, landslide 4.7, wildfire 4.75, lightning 3,
zoonoses 4, heatwave 3.3, …) = **3.9**. *(Adding real low hazards like lightning/heat can
nudge the mean — INFORM averages all hazard types; it never falls below the documented baseline.)*

### 5.2 Category → Dimension: INFORM scaled geometric mean (Excel Box 6)
> **dimension = (10 − GEOMEAN( (10−c₁)/10·9 + 1 , (10−c₂)/10·9 + 1 , … )) / 9 × 10**

A low category **drags the dimension down** (geometric), unlike a plain average.

**Worked example — Kondoa Hazard:** Natural 3.9, Human 0.7.
scaled: (10−3.9)/10·9+1 = 6.49 ; (10−0.7)/10·9+1 = 9.37.
GEOMEAN = √(6.49 × 9.37) = 7.80. dimension = (10 − 7.80)/9 × 10 = **2.4**. ✔ matches stored.

### 5.3 Dimension → Risk: cube root
> **Risk = ∛(Hazard × Vulnerability × LackOfCoping)**

**Kondoa:** ∛(2.4 × 5.5 × 4.6) = ∛60.7 = **3.9** (Medium). ✔

Then `Risk` is classed with the **Tanzania thresholds** (Very-Low < 2.5 < Low < 3.4 < Medium
< 4.3 < High < 5.9 < Very-High).

### 5.4 Missing data — no-data never distorts the score
A blank indicator means **NO DATA** and is stored as `null`. Every aggregation (mean & scaled
geomean) **excludes null entirely** — it is *not* read as 0:
- `mean(5, 5, null) = 5` — not 3.33. **A no-data indicator can never pull a score up or down.**
- `0` is different — a **real measured zero** (e.g. zero coastal-hazard exposure in landlocked
  Dodoma) — and **is** included.
- An all-no-data category drops out cleanly (`null`), so the dimension is the scaled-geomean of
  the categories that actually have data.

In **Data Entry**, clearing a field sets it back to no-data (`null`) — it removes data rather than
zeroing it. Each district shows a **data-coverage %** (share of the 32 leaf indicators that have
data) as a reliability cue — so a score built on sparse data is flagged for what it is. The
ambiguous INFORM `economic` slot is deliberately left no-data everywhere (170/170 null) and by
design affects nothing. *(Locked by tests in `climateIntegrity.test.js`.)*

---

## 6. Keying data in (Data Entry) — same formulas, with provenance

1. Pick **role** (PMO/Admin apply directly; Sector officer submits for approval), region, district.
2. Edit a **dimension score** directly, or **Fill indicators** to set each 0–10 leaf — for
   **Hazard, Exposure, Vulnerability, Coping**.
3. **Exposure** has its own box; changing it instantly recomputes flood = √(hazard × exposure)
   and the Hazard score — the live preview uses the *same* mean → scaled-geomean → ∛ chain.
4. Choose the **Data source / authority** (NBS, TMA, MoW, MoH, MoA, PMO-DMD, DRR Coordinator,
   MUCHALI/IPC). Each edited indicator is **stamped** with that authority + date.
5. **Save / Submit → Apply.** The edit flows to the map, charts, tables. Hover the indicator
   and it shows **"✎ Updated by MoW · 2026-06"**; un-edited indicators show the registry source
   (e.g. **"📎 Source: TMA (+MoA, CHC) · CHIRPS v3 …"**).

Storage today is the browser (`localStorage`); the Supabase schema is ready for multi-user.

---

## 7. Data sources (per indicator)

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

## 8. Honest limitations — the "to-improve" list (flag & discuss)

1. **Drought exposure is agricultural, not urban.** We multiply *flood* by population exposure
   but **not drought** — multiplying drought by urban density would wrongly demote pastoral
   communities (Longido). Better: cropland/livestock exposure. *Open.*
2. **Heavy-rain now uses CHIRPS v3 daily** (2015–2024, national download complete, ~96 % day
   coverage). Earlier drafts used v2.0 daily; v3 gives slightly lower extreme-day counts but the
   same spatial pattern (Pemba/Zanzibar/Mafia coast highest).
3. **Some values sit close together** (e.g. several semi-arid districts ~8.4–8.7 drought).
   That is real similarity, not precision — min-max preserves true spacing rather than forcing
   a spread. Don't over-read 0.1 differences.
4. **Dar es Salaam drought = 10 (documented artifact).** Ilala/Temeke carry drought 10 from the
   documented INFORM baseline — clearly too high for a coastal city. The precautionary floor
   keeps documented values rather than silently lowering them, so it persists (the *computed*
   value is ~6.6). **Flagged for correction via Data Entry** (MoA/TMA), which now overrides it.
5. **Administrative structure — the model now speaks the real NBS-2022 structure by default.**
   The explorer, the ranked table, the charts and Data Entry all open on the **195 councils (LGAs)**,
   aggregating to the **31 regions**, with the **official INFORM country value (4.1)** as the national
   figure. This is a *consistent scaling of the same source*: the model was built from the INFORM
   Tanzania **country-model workbook** (170 council-level units — the **reference/backing**), and the
   195 NBS-2022 councils are derived from it. **195/195 councils carry data**: 167 match an INFORM unit
   directly; **28 new/split councils** (Kibiti←Rufiji, Ubungo←Kinondoni, Kigamboni←Temeke,
   Mlimba/Ifakara←Kilombero, Magharibi A/B…) **inherit their parent's data — flagged on hover/in the
   list** — until council-specific data exists (**never fabricated**). Because the data is 170-resolution,
   **34 INFORM source units back more than one council** (e.g. Mtwara → Mtwara District + Nanyamba Town +
   Mtwara Mikindani Municipal); a **Data-Entry edit is keyed by that single source unit and flows to every
   council that shares it** — Data Entry states which source unit it is editing and which councils it
   updates. The **170 INFORM units remain available as a labelled "source/reference" level**; national and
   regional figures aggregate from this distinct backbone (no double-counting of inherited/shared councils),
   and the **national value is kept official**, never a unit-mean. Official NBS 2022: 31 regions · 150
   districts · 195 councils · 4,344 wards. Reconciliation: `scripts/export-councils.py` →
   `tanzania-councils.json` + `council_reconciliation.csv`.
6. **Wildfire, earthquake, lightning, storms** are still INFORM baseline — not yet physically
   recomputed (MODIS/VIIRS fire, USGS seismicity are the next sources).
7. **Standardization is relative to Tanzania** (min over our 150 districts), not INFORM's fixed
   global reference values. Fine for a national tool; note when comparing to global INFORM.
8. **Precautionary by design.** Flood and drought are *floored* at the documented baseline —
   computed evidence can **raise** a hazard but never **lower** it. This errs toward flagging
   risk (safer for planning) at the cost of keeping a few possibly-overstated documented values
   (see #4). A before/after audit confirms **0 districts** had flood or risk-class lowered.
9. **Risk evolves as the model is completed — by design.** Populating previously-blank hazards
   (storms, heatwave, lightning, volcano, zoonoses, earthquake-refine, wildfire-refine, plus the
   technological hazards road-accidents & hazmat) raised High-risk districts from **18 → 43**,
   all raise-only (a value-audit confirms **0 districts below their documented baseline**). The
   coast (cyclone + heat), the Lake-Victoria zone (lightning + flood) and the western rift
   (earthquake) are the main risers. **Technological hazards (vehicleAccidents, hazmat) are kept
   deliberately moderate** — human hazards carry 50 % of the Hazard dimension, so road accidents
   should not dominate *disaster* risk. Deepening **vulnerability & coping** next will shift it
   again — toward a more complete picture, not drift. Every change is traceable to a sourced indicator.

*Everything in this list is editable in Data Entry and improvable in code — that is the point
of writing it down.*

---

## 9. Risk over time (snapshots)

Risk is reported **"as of"** a date (`metadata.asOf`, currently the baseline). The plan to
turn this into a time series — dated snapshots, **emerging** (risk ↑) vs **improving** (risk ↓)
detection, and a Δrisk map — is in **[RISK_OVER_TIME_PLAN.md](RISK_OVER_TIME_PLAN.md)**.
Foundation already in place: every Data-Entry edit is timestamped with its authority, the
CHIRPS inputs are inherently temporal (1991–2024), and the trend-chart components exist — so
future seasonal refreshes can be compared to spot communities whose risk is rising before it
becomes a disaster.
