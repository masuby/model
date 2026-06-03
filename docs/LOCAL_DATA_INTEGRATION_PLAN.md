% INFORM Tanzania - Local Data Integration Plan
% Federated, spec-driven, transparent - built from the workbook, not invented
% Version 1.0 (blueprint; build follows)

> **What this document is.** The blueprint for positioning the model to receive authentic Tanzanian
> local data - per indicator, at 195-council scale, with sensitive-data sovereignty and full
> transparency - while keeping the INFORM engine exactly as the workbook. Everything here is grounded
> in the actual *Tanzania - Country Model Template* workbook and proven against it. Nothing is invented.
> This is document 5 of the set (Manual, Exact-formula, Paper/v2, Procedures, **Plan**).

---

# 0. Principles (non-negotiable)

1. **Build from the Excel, do not invent.** Every denominator, transform, reference, sign and Use flag
   is extracted from the workbook (`data-source/inform_indicator_spec.csv`).
2. **The engine stays exactly INFORM.** Aggregation (component AVERAGE, dimension scaled GEOMEAN, risk
   cube-root) is unchanged and remains verified 0/195. We add a *standardiser in front of it*, never
   inside it.
3. **Raw in, engine standardises.** Sectors provide actual values in natural units; the model produces
   the 0-10. Sectors are never asked to hand over a score.
4. **Fixed references.** The reference for each indicator is fixed (self-contained), not a live data
   range - the single decision that unlocks 195, any-unit, and sensitive-safe submission.
5. **Federated and transparent.** Sensitive raw stays at the ministry; the system holds and discloses
   the indicator, its provenance, its standardisation, and its change history.

---

# 1. The foundation we established (proven from the workbook)

## 1.1 The keying-in spec
The workbook keys in **78 raw indicators**, **53 used** (`Use indicator? = Yes`), in natural units:

- **Resolution:** 6 at Adm2 (district), 31 at Adm1 (region), 16 at National.
- **Denominator:** only 1 (health-facility density / population); the rest are already rates/indices.
- **Transform:** 47 None, 6 Logarithm (`LN(0.001 + x)`).
- **Reference:** 36 Data-range (computed Min/Max), 17 Custom (fixed pair).
- **Sign:** Hazard/Vulnerability = Increase; all Coping = Decrease (inverted).
- **Combining:** several raw average into one component (Children Health = 4, Access-to-Health = 6).

Captured verbatim in `data-source/inform_indicator_spec.csv` (every column above).

## 1.2 The standardisation pipeline (exact formulas)
```
①  RAW VALUE        sector keys the actual number (e.g. drought 11 years, underweight 18%)
②  DENOMINATOR      value = raw / denominator        (SUBDIVISIONS pop/area/GDP; mostly None)
③  OUTLIER CAP      if Outlier=Yes: x = MAX(MIN(value, Q3+1.5IQR), Q1-1.5IQR)
④  TRANSFORM        None | Logarithm LN(0.001+x) | Exponential EXP(x)
⑤  MIN-MAX -> 0-10  MAX(0, MIN(10, ROUND(
                      IF(Decrease, 10 - 10*(x-Min)/(Max-Min), 10*(x-Min)/(Max-Min)), 1)))
                      Min/Max = data-range (computed) OR custom (fixed)
⑥  COMPONENT        = AVERAGEIFS(processed indicators, Use="Yes")
⑦  CATEGORY         = AVERAGE(components)
⑧  DIMENSION        = ROUND((10 - GEOMEAN((10-c)/10*9+1 ...))/9*10, 1)
⑨  RISK             = ROUND(H^(1/3) * V^(1/3) * LCC^(1/3), 1)
```
Stages 6-9 are the engine already verified 0/195. Stages 2-5 are the standardiser our live app lacks.

## 1.3 The proof
`standardise(raw, spec)` reproduces the workbook's 0-10 with **zero mismatch across all 170 districts**:

| Indicator | Reference | Transform | Sign | Result |
|---|---|---|---|---|
| Drought frequency | data-range[5,19] | none | Increase | 170/170 |
| Children Underweight | data-range[6.2,20] | none | Increase | 170/170 |
| Flood exposure | data-range[-6.9,-1.15] | Log | Increase | 169/169 |
| Deforestation | data-range[-6.9,-1.0] | Log | Increase | 169/169 |
| Government effectiveness | custom[-1.7,0.8] | none | Decrease | 170/170 |

**Rechecked across all 53 used indicators, every district: 8664/8664 = 100.00%** with Excel half-up
rounding (the 1 degenerate `custom[0,0]` indicator and 1 all-"No data" indicator are caught by the
diagnostics, not failures). The spec is a **provably exact** foundation. Two build requirements surfaced
from the recheck:

- **Excel half-up rounding** (`ROUND(5.25,1)=5.3`) - JS `Math.round` already does this; a naive Python
  `round()` does not.
- **Freeze the *resolved* reference** - for data-range indicators that is the proc-22 data range
  (drought `[5,19]`), *not* the leftover "custom Max/Min" cells. Now recorded as `resolved_min` /
  `resolved_max` in `inform_indicator_spec.csv` (this would have silently broken 36 indicators if we had
  built on the raw custom columns).

---

# 2. The honest current state (the multi-agent audit)

Of the **32 engine indicators**: **8 genuine local** (drought, flood, heatwave, exposure,
healthConditions, displaced, wash, earthquake), **9 authored overlays** (storms, landslide, coastal,
wildfire, volcano, lightning, zoonoses, hazmat, vehicle - hand-assigned grades, no dataset), **14 still
the global foundation**, **1 missing**. The engine reads only a pre-standardised JSON baked offline plus
a single-device localStorage override - **no live sector feed**. Several provenance chips overstate local
sourcing (accessHealth/education/habitat claim NBS/MoH but are byte-identical to the global baseline). No
CRITICAL math defects (engine is exact); every issue is provenance, ingestion, or resolution. This plan
closes all of it.

---

# 3. The core decision: fixed references (the linchpin)

A data-range reference is bound to the unit set: drought's [5,19] is the min/max of the **170** units;
recompute it over **195** councils and every score shifts, silently leaving INFORM. A fixed reference
gives the same 0-10 at 170, 195, or any resolution. Fixing the references is what simultaneously unlocks:

- **195-council scaling** - a council's score does not depend on which units are present.
- **Any-unit indicators** - each self-standardises against its own fixed reference.
- **Sensitive-safe submission** - a sector can standardise locally (no need for the whole country's data),
  so it can submit a bare 0-10 and keep its raw at home.

**Action:** the references to freeze are already extracted - `resolved_min` / `resolved_max` in
`inform_indicator_spec.csv`: the **17 custom** pairs verbatim, and the **36 data-range** pairs frozen at
the proc-22 data range (e.g. drought `[5,19]`). At 195, a council standardises against the *frozen*
reference, giving the same 0-10 independent of how many units are present - and this is **proven**, since
those exact references reproduce the 170 workbook at 100.00%. This is the one place we move beyond "copy
the workbook" verbatim (a data-range becomes a fixed pair); it is required by the 195 mandate and
documented as such. (Where a policy/literature bound is more defensible than the frozen data range - e.g.
0-100% for a rate - it can replace the frozen pair per indicator, recorded in the spec.)

---

# 4. The architecture

## 4.1 The standardisation engine (spec-driven)
- `indicatorSpec` loaded from `inform_indicator_spec.csv` (denominator, transform, reference, sign, Use,
  resolution) - the engine reads it, never hardcodes.
- `standardise(raw, spec)` = stages 2-5 (proven exact).
- `AVERAGEIFS(Use="Yes")` rebuilds the **raw (78) -> component (32)** layer in-app, then the existing
  engine (7-9) runs unchanged.

## 4.2 Data entry: federated, two layers
```
LAYER 1 - HARMONISE (inside the ministry, on their data)
  raw/sensitive records -> the DATA TOOL we ship (their indicators + the proven spec)
    -> aggregate to the indicator at its resolution -> validate type/range
    -> (optionally) standardise to 0-10 against the FIXED reference
  => the indicator value (or score). Sensitive raw NEVER leaves the ministry.

LAYER 2 - SUBMIT (to the central system, authenticated)
  ministry submits the indicator + provenance (source, method, date, resolution)
    -> role-scoped: a sector submits ONLY its own indicators
    -> PMO-DMD reviews -> approves -> engine recomputes
  => the model updates, fully attributed.
```
Sectors **harmonise their own data with the tool and are given role-scoped access to submit** - not to
key raw national data into a shared database.

## 4.3 The transparency model
**Fully transparent (public, auditable):** the value; the provenance (which sector, when, source/method);
the standardisation (raw value + spec + the resulting 0-10 - re-derivable because the spec is published
and proven to reproduce INFORM); the change log (every update/add/delete, attributed and reversible).

**Sovereign (never in the system):** the sensitive raw records - aggregated into the indicator before
submission; the most sensitive submit only as a 0-10 (the least-revealing form, possible because the
reference is fixed).

> Total transparency of method, provenance, and result; full sovereignty of the sensitive source.

## 4.4 Roles and access
| Role | Can | Cannot |
|---|---|---|
| Sector officer (TMA, MoH, MoW, MoA, NBS, ...) | submit/update only their own indicators, with provenance | edit another sector's data or the engine |
| PMO-DMD (coordinator) | assign indicator ownership; review/approve/reject; publish | author values; hold the raw |
| Public / planners | view the model, methodology, and every value's provenance | submit |

---

# 5. The issue-catching layer (replicate the Excel + close its gap)

The workbook catches issues by **post-hoc diagnostics**; its entry sheets have **zero input validation**.
We replicate the diagnostics and add validation at entry (the one place we improve on the Excel):

| Layer | Mechanism | Catches |
|---|---|---|
| **Input validation (new)** | enforce `data_type` + `valid_range` at entry | bad input before it enters |
| No-data sentinel | `null` excluded from averages | missing handled cleanly |
| Data-Collected | `COUNT(raw) > 0` | indicator has any data |
| Data-Processed / ERROR | collected but unprocessed -> "ERROR" | claimed-but-empty (the audit catch) |
| Outlier cap | Tukey Q1-1.5IQR / Q3+1.5IQR | one freak value can't stretch the scale |
| Skew / Kurtosis | post-normalisation diagnostics | a transform is needed |
| Bounds clamp | `MAX(0, MIN(10, ...))` | 0-10 can't overflow |
| Graceful degrade | `IFERROR` equivalent | a broken cell becomes "No data", never an error |

---

# 6. The indicator lifecycle - delete / add / amend

The workbook's own mechanism is the `Use` flag feeding `AVERAGEIFS(Use="Yes")`; the component averages
whatever is switched on, so the set flexes without touching a formula.

| Scenario | Mechanism | Effect | Governance |
|---|---|---|---|
| Delete | set `Use = No` (data kept) | drops from the component average | review (moves the score) |
| Add | new indicator + spec + data + `Use = Yes` | joins the component average | review; must come at its resolution |
| Amend a value | re-key the raw | re-standardise -> re-average | routine (sector) - **but see the rule below** |
| Amend the spec | change transform/reference/sign | re-standardise | flag (deviation if it changes the INFORM reference) |
| No data (a unit) | `"No data"` sentinel | excluded from that unit's average only | automatic |

**Three rules that follow:**
1. **Add/Delete are not raise-only** - they re-weight the component average up or down, so they are
   governed (approval + logged reason). The `Use` flag makes them auditable and reversible (data is
   switched, never destroyed).
2. **A value amendment is local or global by reference type** - with a fixed reference it changes only
   that unit; with a (legacy) data-range it would re-pool and move everyone. Fixing references (Section 3)
   makes every amendment local and stable - essential at 195.
3. **The diagnostics are the safety net** - the Data-Collected / ERROR flags fire exactly when an
   indicator is switched on but empty (the audit's claimed-but-empty state).

---

# 7. Build phases (the honest, authentic sequence)

| Phase | What | Proves / closes |
|---|---|---|
| **0. Lock the spec** | extract the 17 custom references verbatim; document the 36 data-range -> fixed basis | the foundation is exact and fixed |
| **1. Standardiser** | `indicatorSpec` (from CSV) + `standardise(raw, spec)` (stages 2-5) | reproduces INFORM 0-10 per indicator (golden test) |
| **2. Raw -> component layer** | the 78 sub-indicators + `AVERAGEIFS(Use="Yes")` -> 32 components | the missing raw layer exists in-app; engine unchanged (0/195) |
| **3. Data entry, per indicator** | enter the actual value in the unit at the resolution; validate; show live 0-10; stamp sector + date | the inverted "enter a score" is gone |
| **4. Federated submission + persistence** | authenticated per-sector submission; Supabase replaces localStorage; PMO-DMD approval | real multi-user feed; no snapshot trap |
| **5. Transparency surfacing** | show provenance, the spec, the raw->0-10 derivation, and the change log on every value | the trust layer |
| **6. The sector tool** | a distributable harmoniser (carries each sector's indicators + spec) for offline aggregation of sensitive data | sensitive raw stays at source |

Each phase is independently verifiable and behaviour-neutral on the engine. We build in order, prove each,
and only then move on - honestly and authentically.

---

# 8. What stays exactly as INFORM (guardrails)

- The aggregation engine (AVERAGE / scaled GEOMEAN / cube-root) - unchanged, 0/195.
- The standardisation formulas (stages 2-5) - proven to reproduce the workbook.
- National figures kept official; raise-only respected where it applies; missing = excluded.
- The golden fixture (the workbook's own cached rows) remains the regression guard for both engines.

# 9. Verification (how each phase earns trust)

1. **Golden test** - `standardise + aggregate` reproduces the workbook's cached 0-10 / category / risk.
2. **0/195 engine check** - every council's hazard.total and risk equal the literal Excel formulas.
3. **Spec-reproduces-INFORM** - the all-170 proof, extended to every used indicator before Phase 2 ships.
4. **Per-indicator validation** - type/range/resolution enforced at entry; ERROR flags surfaced.
5. **Provenance audit** - no value claims a sector it was not submitted by (closes the audit's
   false-provenance catches).

---

*This plan is the contract: nothing beyond the workbook is invented; the engine is untouched; local data
enters the authentic way - raw in, standardised centrally or at a fixed reference, aggregated by Use flag,
fully attributed, with sensitive sources sovereign. Build follows, phase by phase.*
