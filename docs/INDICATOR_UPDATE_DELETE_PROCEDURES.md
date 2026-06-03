% INFORM Tanzania - Procedures for Updating and Deleting Indicators
% Document 4 of 4 (Manual / Exact-formula reference / Paper / **Procedures**)
% Version 1.0

> **What this document is.** The standard operating procedure for changing an indicator in the
> calculation engines - updating a value or its source, or removing an indicator - while keeping the
> engine **exactly** as the official INFORM workbook (v1). The engine math is never edited here. You
> change **data** (a leaf value, a source) or **structure** (which indicators exist); the engine then
> recomputes the category, dimension and risk deterministically by the exact Excel formulas.

---

# 0. The golden rule

The INFORM aggregation is fixed and authentic:

```
leaf indicator (0-10)
   -> category aggregate   = AVERAGE of its leaf indicators            (arithmetic mean)
   -> dimension total      = scaled GEOMEAN of the category aggregates  ROUND((10-GEOMEAN((10-c)/10*9+1))/9*10, 1)
   -> INFORM risk          = ROUND( H^(1/3) * V^(1/3) * LCC^(1/3), 1 )
```

You never edit those three formulas. Updating or deleting an indicator only changes **the numbers that
flow into them** or **the set of leaves a category averages**. Everything downstream (map, lenses,
charts, tables, severity baseline, the 195-council and 31-region rollups) recomputes from the same
engine. Improvements to the standardisation step (Tukey IQR capping, custom references) belong to the
**v2 proposal**, not to this procedure.

---

# 1. What an "indicator" is, and where it lives

The model has **32 leaf indicators**, in **6 categories**, in **3 dimensions**:

| Dimension | Category | Leaf indicators | Count |
|---|---|---|---|
| Hazard and Exposure | Natural hazards | drought, flood, earthquake, landslide, wildfire, stormsCyclone, coastalHazards, heatwave, lightning, environmentalDegradation, volcano, zoonoses | 12 |
| Hazard and Exposure | Human hazards | conflictIntensity, conflictRisk, hazardousMaterial, internalViolence, vehicleAccidents | 5 |
| Vulnerability | Socio-economic | developmentPoverty, economicDependency, habitat, livelihoods | 4 |
| Vulnerability | Vulnerable groups | displacedPeople, healthConditions, childrenHealthNutrition, economic | 4 |
| Lack of Coping Capacity | Infrastructure | accessHealth, economicCapacity, wash, communication, education | 5 |
| Lack of Coping Capacity | Institutional | drrImplementation, governance | 2 |

Each leaf appears in two places that must stay in step:

1. **The structure**, in code: `DIMENSION_TREE` in `src/components/inform-risk/riskModel.js`. This lists
   every category and its `{ k, label }` leaves, and is the single source of truth for which indicators
   exist and how they are named on screen.
2. **The value**, in data: `src/data/tanzania-inform-risk.json`, at the path the tree gives, for example
   `d.hazardExposure.natural.drought`, `d.vulnerability.socioEconomic.developmentPoverty`,
   `d.lackCopingCapacity.infrastructure.wash`. The 170 INFORM source units carry the values; the 195
   councils carry their own Hazard and Exposure in `tanzania-councils-data.json` and inherit
   Vulnerability and Coping from their district.

Two value conventions, taken straight from INFORM and enforced by the engine (`riskModel.js`,
`dataCoverage` and the aggregation filters):

- **`null` means NO DATA.** It is **excluded** from every average and geomean (the engine filters to
  finite numbers). It lowers a unit's data-coverage percentage but does not push the aggregate up or down.
- **`0` means a real measured zero** (for example no coastal exposure inland). It **is** included in the
  average. Never use `0` to mean "remove" - that corrupts the mean.

Every indicator also has a **source descriptor** in
`src/components/inform-risk/indicatorSources.js` (`INDICATOR_SOURCE['<dim>:<k>']` -> responsible
authority, dataset, method). Provenance is shown on the map tooltip and the district detail, so any
update or deletion must keep this registry honest.

---

# 2. Updating an indicator

There are two update paths. Use **2A** for an operational correction at a place; use **2B** for an
evidence-based refresh of a whole indicator.

## 2A. Operational update at one place (live, through Data Entry)

For a council, district or region officer correcting a value to reflect reality on the ground.

**Who and how:**

1. Open **Data Entry**, select the unit, open the dimension, and edit the leaf indicator's 0-10 value.
2. Choose the **responsible authority** in the source picker (it defaults to the officer's own
   institution, for example MoW for water, MoH for health, TMA for climate) and add a note.
3. **PMO or Admin** edits apply directly. A **sector** edit becomes a pending submission a PMO reviewer
   approves (`submit` -> `approve`) or rejects.

**What the engine does (no math is edited):**

- The edit is stored per unit in the override store
  (`src/components/inform-risk/overrideStore.js`) keyed by the unit's `adm2Code`, as
  `{ ind: { 'hazard:drought': 7.2, ... }, indSrc, exposure, expSrc }`.
- On load, `applyEdits()` in `riskModel.js`:
  - writes the edited leaf into the unit,
  - recomputes that category's **AVERAGE**, then the dimension's **scaled GEOMEAN**, then
    **risk = H^(1/3)·V^(1/3)·LCC^(1/3)** - all by the exact engine,
  - stamps provenance (`d._prov['<dim>:<k>']`) so the view shows "Updated by MoW, 2026-06" instead of
    the baseline source.

**Safeguards built into the path:**

- An **Exposure** edit only **amplifies** flood (`flood = max(hazard, sqrt(hazard × exposure))`); it can
  never pull a documented flood hazard down.
- An explicit dimension-total edit, if given, wins over the recomputed total (for an externally supplied
  official figure).
- These edits live in the browser (localStorage, single device) until promoted to the shared backend.
  They do not change the shipped dataset; they overlay it at view time.

## 2B. Evidence-based refresh of a whole indicator (authoritative, through a script)

For an analyst updating an indicator across units from a new authoritative source (a new census round, a
new CHIRPS or ERA5 window, a new IPC or MUCHALI bulletin, a new survey).

**Procedure:**

1. **Bring the raw source** into `data-source/` as a CSV with a `source` column (provenance travels with
   the data). Do not hand-type values into the dataset.
2. **Standardise to 0-10 by the exact INFORM pipeline** (Document 2, the exact-formula reference):
   divide by the indicator's denominator, then the transform (None, Logarithm `LN(0.001+x)`, or
   Exponential), then min-max `10*(x-Min)/(Max-Min)` clamped to `[0,10]`, with the "Decrease Risk"
   inversion `10 - 10*(x-Min)/(Max-Min)` for protective indicators. **The Tukey IQR outlier cap and
   custom (fixed) references are v2** - in v1, use Data Range references and no IQR cap, exactly as the
   workbook ships for these indicators.
3. **Write the standardised leaf** into `src/data/tanzania-inform-risk.json` (and the council overlay if
   it is a Hazard or Exposure leaf), then recompute with the **literal engine** used everywhere:

   ```js
   const isN = x => typeof x === 'number' && isFinite(x);
   const r1  = x => Math.round(x * 10) / 10;                 // ROUND(.,1)
   const mean = a => { const v = a.filter(isN); return v.length ? v.reduce((s,x)=>s+x,0)/v.length : null; };
   // scaled GEOMEAN, product form = the literal Excel expression
   const sgm = a => { const v=a.filter(isN); if(!v.length) return null;
     const sc=v.map(x=>((10-x)/10*9)+1);
     return (10 - Math.pow(sc.reduce((p,x)=>p*x,1), 1/sc.length)) / 9 * 10; };
   const risk = (h,v,c) => Math.pow(h,1/3)*Math.pow(v,1/3)*Math.pow(c,1/3);   // H^(1/3)·V^(1/3)·LCC^(1/3)
   // category.aggregate = r1(mean(leaves));  dimension.total = r1(sgm(category aggregates));
   // unit.risk = r1(risk(H,V,LCC));
   ```

4. **Apply the floors and the official line:**
   - **Raise-only for documented hazards** - a refreshed hazard takes `max(new, documented floor)`, so a
     known hazard is never silently lowered.
   - **National stays official** - never re-aggregate the national value from the units; it is the
     authoritative INFORM Tanzania figure (`NATIONAL_UNIT`).
5. **Update the source registry** `indicatorSources.js` so `INDICATOR_SOURCE['<dim>:<k>']` names the new
   authority, dataset and method - the tooltip and detail must tell the truth about where the number now
   comes from.
6. **Verify** (Section 4), then commit. Existing recompute scripts to copy from:
   `scripts/apply-climate-hazards.mjs`, `apply-vulnerability.mjs`, `enrich-coping-facilities.mjs`,
   `apply-council-hazards.mjs`, `refill-real-hazards.mjs` - all already use the literal `sgm`/`risk` above.

---

# 3. Deleting an indicator

"Delete" has two meanings. Pick the one you actually want.

## 3A. Remove a value at one place (this place has no data) -> set it to `null`

This is the common, safe case. A unit genuinely lacks data for an indicator.

- Set the leaf to **`null`** (through Data Entry, or in the dataset for a permanent gap). Do **not** use
  `0`.
- The engine **excludes** it: the category averages over the remaining leaves, the dimension geomean and
  risk recompute, and the unit's **data-coverage percentage drops** to report the lower reliability.
- The indicator still exists in the model for every other unit; only this place stops counting it.

## 3B. Remove an indicator from the whole model (structural change)

This retires a leaf everywhere. Do it deliberately - it changes the **set** a category averages, which
can move risk up **or down**.

1. **Structure:** delete the leaf's `{ k, label }` entry from the right category in `DIMENSION_TREE`
   (`riskModel.js`). This removes it from the lenses, tooltips, detail lists and coverage count in one
   place.
2. **Data:** remove or `null` that leaf across `tanzania-inform-risk.json` (and the council overlay if it
   is a Hazard or Exposure leaf). Leaving stale leaves in the data while the tree no longer lists them is
   harmless to the math (the tree drives aggregation) but is untidy - clean it.
3. **Provenance:** remove its entry from `INDICATOR_SOURCE` in `indicatorSources.js`.
4. **Rebuild and review** (Section 4). Because the category now averages fewer leaves, the dimension
   total and risk **will move**. Confirm the move is intended.

**Review gate before a structural delete:**

- **Do not delete to make a documented hazard disappear.** If removing a leaf would lower a unit's
  documented hazard, that violates the raise-only principle - keep the leaf (set the place to `null`
  instead, per 3A) unless the indicator is genuinely retired model-wide on authority.
- **Keep national official** - a structural delete must not be used to alter the official national value.
- **A category must keep at least one leaf** - an empty category aggregates to `null` and drops out of
  the dimension geomean, which is rarely what you want.

## 3C. What deletion is **not**

- Setting a leaf to `0` is **not** a delete - `0` is a real measured zero and is averaged in. Use `null`.
- Hiding an indicator in the UI is **not** a delete - if it is still in `DIMENSION_TREE` and the data, it
  still drives the math.

---

# 4. Verification after any update or delete (mandatory)

Run all four. An update or delete is not done until these pass.

1. **Build and tests:** `npm run build` and `npx vitest run` - both green (the guard tests assert the
   aggregation stays the exact INFORM engine).
2. **Engine-exactness check (0/195):** confirm every unit's `hazard.total` equals the scaled GEOMEAN of
   its categories and every `risk` equals `H^(1/3)·V^(1/3)·LCC^(1/3)`, at **both** the 170 source units
   and the 195 councils. This is the same check that currently returns **0 mismatches** at both levels;
   keep it at zero.
3. **National unchanged:** the official `NATIONAL_UNIT` value is untouched by the change.
4. **Direction-of-change review:** for a hazard update or any structural delete, confirm no documented
   hazard was silently lowered (raise-only), and that data-coverage changed only where you intended.

Then commit with a message that states the indicator, the source, and the before/after, and deploy by the
normal route.

---

# 5. Quick reference

| You want to ... | Do this | Engine effect |
|---|---|---|
| Correct a value at one place | Data Entry -> edit leaf -> pick authority -> Apply (PMO/Admin direct; sector -> approve) | override stored; category AVERAGE, dimension scaled GEOMEAN, risk ∛ recompute; provenance stamped |
| Refresh a whole indicator from new evidence | Script: raw CSV -> standardise 0-10 (exact pipeline) -> write leaf -> recompute -> raise-only floor -> update source registry -> verify | values change; engine recomputes; national kept official |
| Mark "no data" at one place | Set leaf to `null` (not `0`) | excluded from averages; coverage drops; risk recomputes over remaining leaves |
| Retire an indicator model-wide | Remove `{k,label}` from `DIMENSION_TREE`; null/remove the leaf in data; remove from `INDICATOR_SOURCE`; rebuild; review | category averages fewer leaves; dimension and risk move - confirm intended |

**Files involved:** `riskModel.js` (structure and engine), `overrideStore.js` (live edits and approval),
`indicatorSources.js` (provenance), `DataEntry.jsx` (the officer UI), `tanzania-inform-risk.json` and
`tanzania-councils-data.json` (values), `scripts/*.mjs` (evidence refreshes). The engine math in all of
them is v1-exact to the workbook and is never edited by these procedures.
