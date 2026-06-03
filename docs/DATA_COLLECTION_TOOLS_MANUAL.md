# INFORM Tanzania — Data Collection Tools & System Operations Manual

- **Version:** 1.0
- **Audience:** INFORM TZ system maintainers, sector focal points (TMA, GST, NEMC, MoA, MoW, MoH, NBS, PMO‑DMD, …), and the national coordination team.
- **Companion documents:** `INFORM_CALCULATION_ENGINE.md` (the exact engine math), `INDICATOR_UPDATE_DELETE_PROCEDURES.md` (engine‑side indicator changes), `METHODOLOGY_MANUAL.md`, `USER_MANUAL.md` (the web app).

> **What this manual covers.** How the federated data‑collection system works, the **two Excel tools** sectors fill (NORMAL and ADVANCED), the **stakeholder directory** (who owns what), and the **maintenance / update procedures** (regenerate a tool, add/delete/amend an indicator, change a stakeholder, deploy). The INFORM engine itself is **never tampered with** — it reproduces the regional INFORM hidden sheets exactly (proven 8664/8664). Everything here either feeds that engine or refines it additively.

---

## Table of contents

1. [The idea in one page](#1-the-idea-in-one-page)
2. [The standardisation engine (untampered)](#2-the-standardisation-engine-untampered)
3. [The NORMAL tool — one shared workbook](#3-the-normal-tool--one-shared-workbook)
4. [The ADVANCED tool — exploded multi‑source](#4-the-advanced-tool--exploded-multi-source)
5. [Stakeholder directory](#5-stakeholder-directory)
6. [The federated workflow (bottom‑up)](#6-the-federated-workflow-bottom-up)
7. [Where the tools live (local, not online)](#7-where-the-tools-live-local-not-online)
8. [Maintenance & update procedures](#8-maintenance--update-procedures)
9. [Verification](#9-verification)
10. [File & path reference](#10-file--path-reference)

---

## 1. The idea in one page

INFORM Tanzania produces a **risk index 0–10** for every one of the **195 councils** (and 31 regions, and the nation), built the official INFORM way from three dimensions — **Hazard & Exposure**, **Vulnerability**, **Lack of Coping Capacity**.

Sectors do **not** hand over scores. They enter the **actual value** of an indicator in its **natural unit** (e.g. `18` for 18 % underweight, `11` for an 11‑year drought frequency, a count of displaced people). The tool **standardises** that value to 0–10 with the exact INFORM formula. The centre reads only the **0–10**; the raw stays with the sector.

Two workbooks deliver this:

| Tool | Purpose | Shared? |
|---|---|---|
| **NORMAL** (`INFORM_TZ_Collection_Tool.xlsx`) | The exact regional INFORM — 53 used indicators, **one** stakeholder per indicator | Yes — sent to all sectors |
| **ADVANCED** (`INFORM_TZ_Advanced_Tool.xlsx`) | The research model — each hazard **exploded** into all its contributing institutions | Separate file, kept by the centre |

Both apply the **identical** standardiser; the difference is only *which indicators exist* and *how many sources feed a component*.

---

## 2. The standardisation engine (untampered)

Every 0–10 cell in both tools runs the same pipeline — the faithful reproduction of the INFORM workbook's hidden sheets:

```
actual value
  └─ 1. denominator      ÷1 (None) or ÷ population/area/GDP  (SUBDIVISIONS)
  └─ 2. outlier cap      MAX(MIN(x, Q3+1.5·IQR), Q1−1.5·IQR)   — only if Outlier = Yes
  └─ 3. transform        None | Logarithm LN(0.001+x) | Exponential EXP(x)
  └─ 4. min–max          10 · (x − Min) / (Max − Min)          — vs the FROZEN reference
  └─ 5. direction        Decrease Risk → 10 − base             — "protective" inversion
  └─ 6. clamp + round    MAX(0, MIN(10, ROUND(·, 1)))
  └─ IFERROR → "No data"                                       — exactly as the workbook
```

The **reference (Min/Max) is frozen** so a value means the same thing at village, district, region or country level — that is what makes bottom‑up aggregation valid.

**Aggregation** (never edited):

```
leaf 0–10
  → component   = AVERAGE of the leaves with Use = "Yes"      (NORMAL: AVERAGEIFS; ADVANCED: weighted, present‑only)
  → category    = AVERAGE of its components
  → dimension   = scaled GEOMEAN of its categories
  → INFORM risk = ROUND( H^⅓ · V^⅓ · LCC^⅓ , 1 )
```

Proven byte‑exact against the workbook: **8664/8664** standardised cells and **170/170** district risks. See `INFORM_CALCULATION_ENGINE.md`.

---

## 3. The NORMAL tool — one shared workbook

**File:** `inform_sheets/INFORM_TZ_Collection_Tool.xlsx` · **Builder:** `scripts/build-collection-tool.py`

The single file every sector receives. Sheets:

| Sheet | What it is |
|---|---|
| **How to use** | Instructions (read first). |
| **Council Entry** | 195 councils (rows) × 53 indicators (cols). **Yellow** cells = type the actual value here. Header rows carry the unit, owner, transform, frozen reference, direction. |
| **Council 0‑10** | The same grid showing the **locked** 0–10 the standardiser computes live. |
| Data Entry *(hidden)* | A per‑indicator reference layout, superseded by Council Entry. |

**Rules for the sector officer**

1. Find **your** institution's indicators (the *Sector* / *Owner* row names them).
2. Type the **actual value** in the yellow cell, in the unit shown. Never invent a 0–10 — the tool computes it.
3. Leave anything you don't have **blank** — the model uses the foundation value; nothing breaks.
4. Save and send the file back. The centre reads only the 0–10.

Only the yellow value cells are editable; every formula/reference cell is **locked** so the standardiser stays consistent across all sectors.

**One key stakeholder per indicator.** In the shared tool each component has exactly **one accountable owner** (no slashes) — see the [stakeholder directory](#5-stakeholder-directory).

---

## 4. The ADVANCED tool — exploded multi‑source

**File:** `inform_sheets/INFORM_TZ_Advanced_Tool.xlsx` · **Builder:** `scripts/build-advanced-tool.py` · **Spec:** `data-source/inform_advanced_spec.csv`

A **separate** workbook (not a hidden tab). Here each hazard is **exploded** into every institution that holds relevant evidence, each with its **own coloured cell**. Any institution can feed any component — the NORMAL owner stays the **lead**, but it is joined by everyone with data. This is *capturing the issue without biasing it*.

Sheets: **How to use · Advanced Entry · Advanced 0‑10 · Components**.

**The baskets (25 sub‑indicators / 8 components / 7 institutions):**

| Component (lead) | Source — owner | Unit | Weight | Basis |
|---|---|---|---|---|
| **Drought** (TMA) | SPEI‑12 drought depth — **TMA** | index | 0.25 | Vicente‑Serrano 2010 |
| | Aridity (P/PET) — **TMA** | ratio | 0.15 | UNEP 1992 |
| | Rainfall variability (CV) — **TMA** | ratio | 0.15 | Nicholson 2017 |
| | Growing‑season failure — **MoA** (MUCHALI/IPC) | fraction | 0.20 | IPC |
| | Vegetation/biomass anomaly (NDVI z) — **MoA** | index | 0.10 | MODIS/Sentinel |
| | Soil moisture — **MoA** | % | 0.10 | agromet |
| | Water levels (% normal) — **MoW** | % | 0.05 | gauging |
| **Flood** (TMA) | Extreme wet days (>50 mm) — **TMA** | days/yr | 0.30 | CHIRPS v3 daily |
| | Very‑heavy days (>100 mm) — **TMA** | days/yr | 0.15 | CHIRPS v3 daily |
| | River peak above normal — **MoW** | m | 0.20 | river gauging |
| | Basin flood records — **BWB** | events/decade | 0.20 | Basin Water Boards |
| | Recorded flood impact events — **PMO‑DMD** | events/decade | 0.15 | DesInventar |
| **Landslide** (GST) | Landslide susceptibility — **GST** | index 0–1 | 0.55 | GST hotspots |
| | Triggering rainfall (max 5‑day) — **TMA** | mm | 0.45 | antecedent rainfall |
| **Storms & Cyclone** (TMA) | Cyclone/strong‑wind frequency — **TMA** | events/decade | 0.60 | IBTrACS |
| | Extreme wind speed — **TMA** | m/s | 0.40 | TMA max wind |
| **Earthquake** (GST) | Seismic hazard (PGA 475‑yr) — **GST** | g | 0.70 | GSHAP / Rift |
| | Historical seismicity density — **GST** | events/100yr | 0.30 | GST catalogue |
| **Coastal hazards** (NEMC) | Significant wave height (Hs) — **TMA** | m | 0.25 | ERA5/WaveWatch III |
| | Extreme onshore wind — **TMA** | m/s | 0.20 | TMA coastal |
| | Storm‑surge frequency — **TMA** | events/decade | 0.20 | TMA |
| | Shoreline retreat/erosion — **NEMC** | m/yr | 0.20 | coastal monitoring |
| | Mangrove loss (buffer) — **NEMC** | %/decade | 0.15 | NEMC |
| **Heatwave** (TMA) | Heat‑health days (>90th pct Tmax) — **TMA** | days/yr | 1.0 | Mora 2017 |
| **Lightning** (TMA) | Flash density — **TMA** | flashes/km²/yr | 1.0 | Albrecht 2016 |

> **Coastal hazards is the clearest cross‑cutting case:** led by NEMC, but its wind, waves and storm surge come straight from **TMA**. The same pattern applies everywhere.

**The no‑bias rule (this is the heart of it).** On the *Components* sheet each component is a **weighted average over the cells that are present only**:

```
component = SUMPRODUCT(IFERROR(scores·1, 0) · weights) / SUMPRODUCT(ISNUMBER(scores) · weights)
```

A blank cell is **skipped — never counted as 0**. So if a council has only TMA rainfall for landslide and GST susceptibility is blank, the component is exactly that TMA evidence; a missing source never drags the number down, and partial fills per council are honoured. Hard‑tested in LibreOffice:

| Filled | Result | Proves |
|---|---|---|
| full drought basket (7 sources) | Drought **5.4** | weighted average over all present |
| landslide TMA‑rain only, GST blank | Landslide **5.0** (not 2.25) | blank skipped — **no bias** |
| coastal TMA‑wave + NEMC‑erosion, 3 blank | Coastal **5.0** | cross‑cutting + blanks skipped |
| nothing | blank | no data → skip, **not 0** |

Weights are research‑**proposed** and literature‑cited (the *Basis* column); they will be enforced once validated. Nothing here replaces the regional INFORM — it refines it where local data exists.

---

## 5. Stakeholder directory

**NORMAL tool — one accountable owner per indicator:**

| Institution | Full name | Indicators owned |
|---|---|---|
| **TMA** | Tanzania Meteorological Authority | drought, flood, storms/cyclone, lightning, heatwave |
| **GST** | Geological Survey of Tanzania | earthquake, landslide, volcano |
| **NEMC** | National Environment Management Council | environmental degradation, soil erosion, coastal hazards, hazardous material |
| **TFS** | Tanzania Forest Services Agency | wildfire |
| **MoA** | Ministry of Agriculture (incl. MUCHALI / IPC) | livelihoods / food security, zoonoses & pests |
| **MoHA** | Ministry of Home Affairs | conflict risk, conflict intensity, displaced people |
| **TPF** | Tanzania Police Force | internal violence, vehicle accidents |
| **NBS** | National Bureau of Statistics | development & poverty, habitat, economic, economic capacity |
| **MoFP** | Ministry of Finance and Planning | economic dependency (ODA, remittances) |
| **MoH** | Ministry of Health | health conditions, children health & nutrition, access to health care |
| **MoW** | Ministry of Water | WASH |
| **TCRA** | Tanzania Communications Regulatory Authority | communication |
| **MoEST** | Ministry of Education, Science and Technology | education |
| **PMO‑DMD** | Prime Minister's Office — Disaster Management Department | DRR implementation |
| **PO‑RALG** | President's Office — Regional Administration and Local Government | governance |

**ADVANCED tool adds, as cross‑cutting contributors:**

| Institution | Full name | Advanced contribution |
|---|---|---|
| **BWB** | Basin Water Boards (Rufiji, Wami‑Ruvu, Lake Victoria, Pangani, …) | basin flood records (flood) |
| **MoA / MoW / TMA / NEMC / GST** | (as above) | the multi‑source basket cells in §4 |

---

## 6. The federated workflow (bottom‑up)

1. The centre sends the **NORMAL** tool to all sectors (and the **ADVANCED** tool to sectors doing the research refinement).
2. Each sector fills the **actual values** it owns, at whatever level it has data — **village → district → region → country**.
3. The tool shows the **0–10** live (locked formula).
4. The sector returns the file; the centre ingests **only the 0–10**.
5. **Finer, well‑filled data refines the higher level.** Because the reference is frozen, a council value that is better‑sourced *downscales* into its region — e.g. a region sitting at 4.0 becomes 3.9 once a council is filled with real data. Aggregation always flows from the lowest filled level upward.
6. A sub‑indicator with no data is **skipped**, never zero — so coverage gaps never bias the index.

---

## 7. Where the tools live (local, not online)

The generated workbooks are **not served on the public website**. `public/` is the Vercel web root; the tools live instead in the INFORM data folder:

```
inform_sheets/INFORM_TZ_Collection_Tool.xlsx     (NORMAL)
inform_sheets/INFORM_TZ_Advanced_Tool.xlsx       (ADVANCED)
```

They sit alongside `TZ_INFORM_model.xlsx` and the source CSVs. You **send them to sectors directly** (email/shared drive); they are not downloadable from inform.co.tz. `*.xlsx` is git‑ignored, so the tools are local and **regenerable** from the scripts — the scripts are the source of truth, not the binary. (Stale `…/​*.xlsx` links on the site return a clean **404**, not the app shell.)

---

## 8. Maintenance & update procedures

> Golden rule: you change **data** (a value, a source) or **structure** (which indicators exist, which stakeholder owns one, an advanced basket). You never edit the three aggregation formulas. After any change, **regenerate** the affected tool and **run the tests**.

### 8.1 Regenerate the tools

```bash
python3 scripts/build-collection-tool.py     # → inform_sheets/INFORM_TZ_Collection_Tool.xlsx  (NORMAL)
python3 scripts/build-advanced-tool.py        # → inform_sheets/INFORM_TZ_Advanced_Tool.xlsx    (ADVANCED)
```

Each prints a summary (council count, indicators, by‑stakeholder counts) so you can eyeball the result.

### 8.2 Change which NORMAL indicators exist (add / delete)

The indicator set is **spec‑driven** — it lives in the spec, not in code.

- **Spec source:** `data-source/inform_indicator_spec.csv` → built into `src/data/inform-indicator-spec.json` by `scripts/build-indicator-spec.py` (extracted from the workbook).
- **Delete** an indicator: set `Use = "No"` (the data is kept; it simply drops out of its component's `AVERAGEIFS`).
- **Add** an indicator: add a spec row with `Use = "Yes"`, a unit, transform, **frozen reference** (`resolved_min/max`), `sign`, and `component`. It joins that component automatically.
- Rebuild the spec, then the tool:
  ```bash
  python3 scripts/build-indicator-spec.py      # refresh the JSON spec from source
  python3 scripts/build-collection-tool.py     # regenerate the NORMAL tool
  npm test                                      # golden tests must stay green
  ```

(See `INDICATOR_UPDATE_DELETE_PROCEDURES.md` for the engine‑side detail.)

### 8.3 Change a NORMAL indicator's stakeholder

Edit the `SECTOR` dict in `scripts/build-collection-tool.py` (component → institution; keys are normalised lowercase‑alpha). One owner per indicator — no slashes. Then regenerate the NORMAL tool.

### 8.4 Add / amend an ADVANCED sub‑indicator or basket

Edit `data-source/inform_advanced_spec.csv` — one row per source cell, columns:

```
id, dimension, category, component, sector, name, unit, transform, resolved_min, resolved_max, sign, weight, basis
```

- To **add a source** to an existing component, add a row with the same `component` and a new `sector`/`name`/`weight` (+ a literature `basis`).
- To **explode a new component**, add its rows (sources occupy a contiguous column block automatically — they're grouped by component at build time).
- `sign` is `Increase Risk` or `Decrease Risk`; `transform` is `None` / `Logarithm` / `Exponential`; `weight` is relative within the component (only ratios matter).
- Regenerate: `python3 scripts/build-advanced-tool.py`.

### 8.5 Deploy

```bash
git add -A && git commit -m "…"           # commit the scripts/spec/vercel changes (NOT the .xlsx)
git push prod master:main                  # deploy to inform.co.tz (Vercel, prod remote)
```

> **The tools do not deploy.** Only the app, the spec, the scripts and config go to the site. The `.xlsx` files are local (git‑ignored). To distribute a new tool, regenerate it and share the file directly. (Deploy topology: the `prod` remote = masuby/model, branch `main`, on Vercel — **not** origin.)

---

## 9. Verification

```bash
npm test          # vitest run — the golden + flexibility + parity suites
```

Key suites:

| Test | Asserts |
|---|---|
| `standardise.golden.test.js` | every standardised cell reproduces the workbook — **8664/8664** |
| `pipeline.golden.test.js` | end‑to‑end raw → risk for all **170** districts |
| `flexibility.test.js` | add / delete / spec‑driven set; the weighted multi‑source basket aggregates and falls back gracefully |
| `submit-mapping.test.js` | the captured components map onto the engine leaves |
| `excelParity.test.js`, `workbook_golden.test.js` | engine ↔ Excel parity |

For the tools themselves, the standardiser and the present‑only aggregation are hard‑tested in **LibreOffice** (recalculate with `soffice --headless --convert-to xlsx`), not estimated — fill values, recalc, compare to the hand‑computed 0–10 (see §4).

---

## 10. File & path reference

| Path | Role |
|---|---|
| `inform_sheets/INFORM_TZ_Collection_Tool.xlsx` | **NORMAL** tool (local, shared to sectors) |
| `inform_sheets/INFORM_TZ_Advanced_Tool.xlsx` | **ADVANCED** tool (local, separate) |
| `scripts/build-collection-tool.py` | builds the NORMAL tool (+ the `SECTOR` stakeholder map) |
| `scripts/build-advanced-tool.py` | builds the ADVANCED tool (exploded baskets, present‑only aggregation) |
| `scripts/build-indicator-spec.py` | extracts the proven spec + golden fixtures from the workbook |
| `data-source/inform_indicator_spec.csv` | the 78‑indicator NORMAL spec source |
| `data-source/inform_advanced_spec.csv` | the ADVANCED exploded baskets (sub‑indicators, owners, weights, basis) |
| `src/data/inform-indicator-spec.json` | the built spec the engine + tools read |
| `src/services/standardise.js` | the standardiser + `computeFromRaw` (weighted, present‑only) |
| `src/services/__tests__/` | the golden / flexibility / parity test suites |
| `inform_sheets/TZ_INFORM_model.xlsx` | the official regional INFORM workbook (ground truth) |
| `docs/INFORM_CALCULATION_ENGINE.md` | the exact engine math |
| `docs/INDICATOR_UPDATE_DELETE_PROCEDURES.md` | engine‑side indicator change SOP |

---

*The regional INFORM core is reproduced exactly and never altered. The NORMAL tool is that core, made fillable. The ADVANCED tool is the additive research layer — more sources per hazard, aggregated without bias — that the system can already run today and that will be enforced once its weights are validated.*
