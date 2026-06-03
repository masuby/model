% Advancing the INFORM Hazard Evidence for Tanzania while Preserving the INFORM Engine: a CHIRPS/ERA5/NBS multi-criteria drought case study
% INFORM Tanzania (inform.co.tz)
% 2026-06-03

> **Status - proposal for INFORM Calc Engine v2.** The operational model (**v1**) keeps the INFORM
> aggregation engine **exactly** as the official Excel workbook - verified formula-by-formula, written in
> the code in the workbook's own literal form (product `GEOMEAN`, product of cube roots, `AVERAGE`,
> min-max). The advancements documented in this paper are a **proposal**; once validated ("when it
> passes") they are implemented as **INFORM Calc Engine v2**. In short: **v1 = exact INFORM now; v2 =
> these advancements next**. This is one of three documents - (1) the operational **Manual**, (2) the
> **Exact-formula reference** (`INFORM_CALCULATION_ENGINE.docx`, what v1 runs), and (3) this **Paper**
> (the v2 proposal).

# Abstract

The INFORM Subnational Risk Index aggregates standardised (0-10) hazard, vulnerability and lack-of-coping
indicators into a comparable risk score. Its aggregation **engine** - min-max standardisation (with
logarithmic transformation and Tukey outlier capping), arithmetic averaging of indicators into categories,
the **scaled geometric mean** of categories into dimensions, and the **cube root** of the three dimensions
into risk - is a fixed methodology we **preserve exactly** as implemented in the official
*Tanzania - Country Model Template* workbook (verified formula-by-formula from its hidden sheets). What we
**advance** is the *evidence* behind individual hazard indicators where authoritative national data exist.
This paper documents the advancement of the **drought hazard** from a coarse INFORM SADC value to a
transparent four-component index computed from CHIRPS v3 rainfall (1991-2024) and ERA5 temperature -
aridity, interannual variability, SPEI drought depth, and growing-season failure - together with the
**initial vs advanced** comparison, the **impact**, and the **gap** the advancement closes. We show the
initial drought layer was spatially incoherent (the central semi-arid zone under-rated at ~4/10, a coastal
city over-rated at 10/10), whereas the advanced layer tracks observed rainfall and the food-security
geography. The flood, heatwave and exposure advancements are summarised. Finally we open a **living, four-tier v2
issue register** (Section 8) - engine-fidelity, hazard-evidence, exposure/vulnerability resolution, and
validation - and the three cross-cutting insights (stable references, hazard-specific exposure, outcome
validation) that anchor it (Section 9). Every item is a proposal for a future, separately-validated INFORM
Calc Engine v2; none changes the v1 engine running today.

# 1. Introduction

INFORM (the Index for Risk Management; DRMKC/JRC, European Commission) provides a transparent, reproducible
composite risk model [1]. For Tanzania, the operational instrument is the *Tanzania - Country Model
Template* workbook, whose engine standardises each indicator to 0-10 and aggregates them. The engine is
deliberately conservative and globally comparable; it must not be silently altered.

Our work separates two concerns:

1. **The engine** (how numbers combine). This stays **identical** to the workbook - we verified every
   formula directly from the (hidden) engine sheets (see the companion `INFORM_CALCULATION_ENGINE.docx`):
   component = `AVERAGE`, category = `AVERAGE`, dimension = `ROUND((10-GEOMEAN((10-c)/10*9+1...))/9*10,1)`
   (scaled geometric mean), risk = `ROUND(H^(1/3)*V^(1/3)*LCC^(1/3),1)` (cube root), and standardisation =
   min-max to 0-10 with optional log/exp transform, Tukey (Q1-1.5*IQR, Q3+1.5*IQR) outlier capping, and an
   inversion for "Decrease Risk" indicators.
2. **The evidence** (the value of each indicator). Where the INFORM SADC layer is coarse, dated, or
   incoherent for Tanzania, and authoritative national data exist, we **recompute the indicator** from
   primary data using the **same standardisation method** the engine prescribes, and we apply it
   **raise-only** (the computed value may raise a documented hazard but never silently lower it).

This paper makes the second concern explicit and auditable, using **drought** as the worked case, because
drought is the hazard most consequential for Tanzanian food security and the one for which the densest
observational record exists.

# 2. The preserved INFORM engine

We reproduced a unit end-to-end against the workbook: for Kondoa, the workbook's own Hazard dimension is
`scaled-geomean(Natural 3.544, Human 0.683) = 2.2`, and our implementation returns the same 2.2 for the
same inputs; the national value matches the workbook to the decimal (Hazard 2.2, Vulnerability 5.5,
Lack-of-Coping 5.9, Risk 4.1). The engine is therefore **unchanged**; only indicator *inputs* differ where
we advanced them. Two engine-level options the workbook supports but our recompute scripts do not yet apply
- **Tukey IQR capping** of recomputed series, and **custom (fixed) reference ranges** instead of the
Tanzania data range - are recorded as **future work** (Section 7) and are not changed here.

# 3. The drought advancement - method

## 3.1 Rationale and the gap in the initial layer

The initial INFORM SADC drought scores for Tanzania are spatially incoherent (Section 5, Table 2): several
central **semi-arid** councils (Kondoa 771 mm yr^-1, Singida 749 mm, Manyoni 760 mm) scored only 3.6-4.3/10,
while a wet coastal city (Dar es Salaam / Ilala, 1,253 mm) scored 10/10. Semi-arid central Tanzania is a
recurrent drought- and food-insecurity hotspot (IPC/MUCHALI classifications), so an index that rates it
below 5 while maxing out a coastal city is not credible. This is the **gap**: the *initial* relevance of the
drought layer was, in places, simply not true.

## 3.2 Data

- **CHIRPS v3** monthly precipitation, 0.05 deg, 1991-2024, the same product validated for Tanzanian
  rainfall classification [2]. Zonal-mean rainfall is extracted per administrative unit.
- **CHIRPS v3 daily** (2015-2024) for the companion heavy-rain/flood layer (Section 6).
- **ERA5** 2 m temperature, used to estimate potential evapotranspiration (PET) for SPEI [3].

## 3.3 The four-component index and its criteria

Drought relevant to communities is more than a single statistic; following the drought-index literature
[4,5] we combine four physically distinct, individually justified components, each min-max scaled to 0-1:

| Component | Weight | What it captures | Computation | Basis |
|---|---|---|---|---|
| **Aridity** | 0.30 | inherent dryness of the climate | min-max of **(-mean annual rainfall)** | UNEP aridity gradient; semi-arid = ~0.2-0.5 P/PET [6,7] |
| **Interannual variability** | 0.20 | year-to-year rainfall instability | min-max of the **coefficient of variation** of annual rainfall | East-African rainfall is among the world's most variable [8,9] |
| **SPEI drought depth** | 0.15 | severity of water-balance deficits | mean magnitude of **SPEI-12 < -1**, PET via Thornthwaite [10] from ERA5 | SPEI = standardised precipitation-evapotranspiration index [3,11] |
| **Growing-season failure** | 0.35 | crop-failure / food-security driver | 0.5*CV + 0.5*frequency of the main 4-month season below 80% of normal | season failure -> IPC food crises (highest weight) |

The blended score `0.30*aridity + 0.20*variability + 0.15*SPEI-depth + 0.35*season-failure` is then
**min-max standardised to 0-10** - exactly the INFORM normalisation - and applied **raise-only** (the
advanced value replaces the initial only where it is higher, so no documented drought area is downgraded).

**Weighting rationale.** Aridity is the baseline (a dry climate is intrinsically drought-exposed);
variability and SPEI add the *dynamic* deficit; **growing-season failure carries the largest weight (0.35)**
because, for an operational risk index feeding humanitarian planning, the decision-relevant outcome is
failure of the main cropping season, which is what triggers IPC/MUCHALI food-insecurity phases. The weights
are an explicit modelling choice; a sensitivity analysis is listed as future work.

**Why SPI/SPEI *frequency* is not used to rank.** Drought *frequency* (the share of months below a
threshold) is approximately stationary by construction across a fixed record and therefore discriminates
poorly between districts; we use SPEI **depth** (how deep deficits go) rather than frequency, and rank on
aridity + variability + season-failure, which are the spatially-informative signals.

# 4. Standardisation and integration (unchanged engine)

The four raw components are combined and the result is min-max scaled to 0-10 using the **same** formula the
workbook applies to every indicator (`10*(x-Min)/(Max-Min)`, clamped, rounded to 0.1). The drought score
then enters the **unchanged** chain: it averages with the other natural-hazard components into the
*Natural* category, which scaled-geometric-means with *Human* hazards into the *Hazard & Exposure*
dimension, which cube-roots with Vulnerability and Lack-of-Coping into Risk. No engine constant is altered.

# 5. Results - initial vs advanced

**Table 2.** Initial (INFORM SADC) vs advanced (CHIRPS/ERA5) drought score, with the raw evidence.

| District | Rainfall (mm yr^-1) | Rain CV | Season-fail freq | SPEI depth | **Initial** | **Advanced** |
|---|---|---|---|---|---|---|
| Longido (pastoral) | 668 | 0.26 | 0.27 | 1.60 | 8.6 | **9.7** |
| Monduli (pastoral) | 694 | 0.26 | 0.27 | 1.56 | 8.6 | **9.2** |
| Singida (semi-arid) | 749 | 0.24 | 0.24 | 1.68 | **3.6** | **8.7** |
| Manyoni (semi-arid) | 760 | 0.20 | 0.18 | 1.63 | **3.6** | **7.0** |
| Kondoa (semi-arid) | 771 | 0.24 | 0.24 | 1.64 | **4.3** | **8.6** |
| Rufiji (sub-humid) | 1,088 | 0.21 | 0.21 | 1.50 | 2.9 | 5.8 |
| Kilombero (wet) | 1,598 | 0.17 | 0.21 | 1.45 | 0.7 | 2.9 |
| Kyela (wettest) | 1,996 | 0.16 | 0.21 | 1.48 | 0.0 | 2.2 |
| Ilala / Dar (coastal city) | 1,253 | 0.26 | 0.24 | 1.49 | **10** | 10* |

\*Dar es Salaam retains 10 under the raise-only floor; the computed value is ~6-7. This is a flagged
artifact (the initial 10 is documented-but-wrong) queued for correction via Data Entry, *not* an advancement
outcome.

**Pattern.** The advanced layer is **monotone in rainfall**: the five driest councils (Longido, Monduli,
Singida, Manyoni, Kondoa, all 668-771 mm) score 7.0-9.7; the wettest (Kyela, Kilombero, 1,600-2,000 mm)
score 2.2-2.9. The initial layer was not monotone - it under-rated Singida/Manyoni/Kondoa (3.6-4.3) despite
their identical semi-arid climate to the (correctly high) pastoral districts.

# 6. Other advancements (summary)

The same *initial -> advanced (same standardisation) -> raise-only* discipline was applied to:

- **Flood / heavy rainfall.** Advanced from a static INFORM value to **CHIRPS v3 daily** counts of days
  > 50 mm and > 100 mm (2015-2024), combined with documented flood events and the INFORM **Hazard x
  Exposure** form `flood = max(hazard, sqrt(hazard * exposure))` so population exposure can only amplify a
  flood hazard, never hide it. Heavy-precipitation thresholds follow the ETCCDI extreme-rainfall indices.
- **Heatwave.** Advanced from blank/baseline to an **ERA5** temperature-climatology exposure proxy
  (mean + hottest-quarter), min-max capped - hot lowlands high, cool highlands low.
- **Exposure.** Advanced to **NBS 2022 PHC** population density (population / area), **log** min-max
  standardised - the workbook's own "Logarithm" transformation for the right-skewed density distribution.

Vulnerability (poverty, stunting, HIV+malaria, displacement, food insecurity) and parts of coping (WASH,
health/education access, DRR) were similarly refreshed from NBS/TDHS/IPC/UNHCR sources. All used the
engine's standardisation unchanged.

# 7. Discussion: initial vs advanced, impact, and the gap

**Initial vs advanced.** The advancement does not change *how* drought enters risk; it changes *what value*
drought has, from a coarse/incoherent layer to one grounded in 34 years of observed rainfall and the
water balance.

**Impact / outcome.** Risk rises where the evidence supports it (the central semi-arid belt and the
pastoral north), in line with IPC/MUCHALI food-insecurity classifications, and the change is auditably
raise-only. Because risk is a cube root of three dimensions, a drought rise of several points lifts the
Hazard dimension modestly and the risk score by a fraction - appropriately, since drought is one of twelve
natural hazards.

**The gap.** The advancement is justified precisely where **the initial relevance was not true**: Kondoa
and Singida are textbook semi-arid, food-insecure districts that the initial layer scored below 5. The
advancement closes that gap with transparent, reproducible evidence. Where the initial layer was already
correct (pastoral Longido/Monduli), the advancement merely confirms and slightly raises it; where the
initial layer was wrong-high (the Dar artifact), raise-only deliberately does **not** advance it down - that
case is handled separately as a documented correction.

# 8. The v2 roadmap - a structured issue register

The advancements above open a **living register** of issues to resolve in INFORM Calc Engine v2. Each is
recorded with the same discipline: what the workbook (or INFORM) does, what v1 does today, the proposed v2
method, and the expected impact. The register runs in four tiers, from "make the standardisation literally
match the workbook" to "advance the science of the hazard layers" to "prove the index predicts reality".
Nothing here changes the v1 engine; each item is implemented only after separate validation.

## Tier 1 - Engine fidelity (close the last standardisation gap with the workbook)

v1 reproduces the workbook's **aggregation** exactly - mean, scaled geomean, cube root, verified 0/195. The
remaining gap is in the **standardisation** of our *recomputed* indicators (the companion
`INFORM_CALCULATION_ENGINE.docx` flags A-G). v2 closes it:

| # | Issue | Workbook | v1 today | v2 method | Impact |
|---|---|---|---|---|---|
| B | **Outlier capping** | Tukey Q1-1.5·IQR / Q3+1.5·IQR before min-max, a **per-indicator toggle** | no cap on recomputed series | replicate the workbook's exact outlier-detection set; cap to the fence | stops one extreme unit stretching a Tanzania-relative min-max |
| D/I | **Reference range and temporal stability** | Data Range **or Custom fixed** reference | Data Range over Tanzania | adopt the per-indicator Custom references; use **fixed** references for anything tracked over time | a unit's score stops drifting when *other* units update - the key to trend monitoring |
| A | **Denominators** | explicit per-capita / per-area denominator | rates built directly | verify each denominator matches the workbook | small, indicator-specific |
| C | **Transform set** | per-indicator Log / Exp / None | Log for density only | match Log/Exp/None indicator-by-indicator | corrects skew handling per layer |
| F | **Indicator use-set** | `useIndicator = Yes/No` filter | null-exclusion | reconcile the exact included-indicator list per dimension | which leaves count in a category |
| G | **Class breakpoints** | per-dimension threshold table | global risk bands | confirm the exact per-dimension breakpoints | class/colour only, not the score |

### Tier 1b - sparse-data fidelity and engine convergence (June 2026 audit)

A code audit of the two engines - the live `riskModel` and the formal `informCalculationEngine` -
surfaced four fidelity points on sparse or degenerate data. Two were aligned to the workbook
immediately (behaviour-neutral on the fully-populated dataset); two remain v2 decisions.

| Finding | Workbook | Was | Now / v2 |
|---|---|---|---|
| **Dimension = 0 -> risk** | 0 (`0^(1/3)=0`) | formal engine returned null via a `>0` guard; the live engine already returned 0 | **Resolved** - guard dropped, both engines now return 0 |
| **Category weighting** | unweighted (equal) | formal engine passed 0.5/0.5 weights into the geomean (identical at equal, divergent if changed) | **Resolved** - dimension geomean hardwired unweighted; weighting is a flagged v2 deviation only |
| **Missing whole category** | category `AVERAGE` errors, dimension blanks | both engines degrade to the single present category | **v2 decision** - replicate the blank (strict) or keep the graceful fallback and document it |
| **Two engines of record** | one workbook | live `riskModel` and formal `informCalculationEngine` agree on populated data, diverge on edge cases | **Partly** - the workbook-golden fixture now guards **both**; converging to one engine is v2 |

Equal weights and full data masked all four; only an explicit audit against the workbook's own
sparse-data behaviour exposes them. The golden fixture (the workbook's cached rows) is now the
regression guard pinning **both** engines to the workbook.

## Tier 2 - Hazard evidence (apply the drought template to every documented overlay)

Several hazards are still **documented overlays** (expert-placed, not computed). v2 advances each the way
drought was advanced - computed from an authoritative observational product, standardised by the unchanged
engine, applied **raise-only**:

| Hazard | v1 overlay | v2 evidence | Standard metric | Source |
|---|---|---|---|---|
| **Earthquake** | rift-proximity | probabilistic seismic hazard | PGA at 475-yr return period | USGS / GEM / GSHAP [13] |
| **Flood** | event counts × exposure | return-period inundation | 1-in-100-yr flood extent/depth | JRC GloFAS / global flood maps [14] |
| **Wildfire** | miombo dry-season | active-fire + burned-area climatology | annual fire density | MODIS/VIIRS MCD64 [15] |
| **Conflict / violence** | documented | event intensity and fatalities | ACLED event rate | ACLED [16] |
| **Lightning** | Lake Victoria overlay | flash-density grid | flashes km^-2 yr^-1 | NASA LIS/OTD [17] |
| **Storms / cyclone** | documented coastal | track density / return period | cyclone passage frequency | IBTrACS [18] |
| **Heatwave** | ERA5 climatology, capped | heat-health threshold days | days > 90th-pct Tmax; WBGT | ERA5 + heat-health [19] |

## Tier 3 - Exposure and vulnerability resolution

| Issue | v1 today | v2 method |
|---|---|---|
| **Hazard-specific exposure** | one population-density layer multiplies every hazard | pair each hazard with its own exposure - drought with cropland, livestock and rural population; flood with floodplain population - not generic density |
| **Council-resolution vulnerability** | 195 councils inherit district survey values | small-area estimation (model-based) for council-level vulnerability where surveys allow |
| **Live food security** | IPC/MUCHALI entered per round | automated IPC-round ingestion so livelihoods refreshes itself |

## Tier 4 - Methodology and validation (scientific credibility)

| Issue | v1 today | v2 method |
|---|---|---|
| **Reliability gating** | data-coverage % shown, not enforced | a confidence tier per unit; annotate or suppress scores below a minimum coverage |
| **Uncertainty** | point scores | propagate input uncertainty (CHIRPS error, survey sampling) to a risk **band** |
| **Validation** | face validity vs IPC geography | quantitative validation against observed losses and displacement (EM-DAT, DesInventar Tanzania) [20] |
| **Sensitivity** | drought weights an explicit choice | full sensitivity analysis of which indicators and weights move risk |
| **Weighting (deviation-flagged)** | equal weights within a category (INFORM default) | explore expert/data-driven weights as a **separate, validated** option - never silently |

# 9. Cross-cutting insights for v2

Three insights run across the register and shape the v2 design.

**1. Temporal comparability is a reference-range problem.** A Data-Range min-max re-standardises *every*
unit whenever *any* unit's data changes, so a district's score can move even when its own reality did not.
For a model meant to answer "is this place getting riskier?", that is a defect. v2's adoption of **fixed
reference ranges** (Tier 1, #D/I) is therefore not cosmetic - it is what makes year-on-year and
pre/post-intervention comparison valid. This is the single most consequential engine-fidelity decision.

**2. Exposure must be hazard-specific or it misleads.** v1 multiplies hazards by one population-density
layer. But drought's exposure is **agricultural** - cropland, livestock, rural livelihoods - not urban
population; a dense coastal city is highly *flood* and *heat* exposed but not *drought* exposed. Using a
single exposure layer is exactly what produced the Dar-es-Salaam drought artifact (Table 2). Hazard-specific
exposure (Tier 3) is the structural fix behind that symptom, not a cosmetic one.

**3. A risk index is only as credible as its validation.** The drought advancement is justified by face
validity against IPC/MUCHALI geography; that is necessary but not sufficient. v2 must validate the risk
score **quantitatively** against independent outcomes - recorded disaster losses, displacement,
food-insecurity caseloads - so "risk" is demonstrably predictive, not merely plausible. Without this, every
advancement is an assertion; with it, the model earns operational trust.

Stable references, hazard-specific exposure, and outcome validation are the backbone of INFORM Calc
Engine v2.

# 10. Limitations of this proposal

- **Weights** for the drought blend (0.30/0.20/0.15/0.35) are an explicit modelling choice; the sensitivity
  analysis (Tier 4) is what will defend or revise them.
- **Raise-only** is honest but asymmetric: it cannot correct a documented-but-too-high value (the Dar
  artifact), which is handled separately as a Data-Entry correction, not an advancement.
- The **register is not exhaustive** and is expected to grow; it is a working backlog, not a finished spec.
- Every Tier-2/3/4 item is **unvalidated** until its own evidence passes review - listing it here is a
  commitment to test it, not a claim that it is already right.

# References

[1] INFORM (2024). *INFORM Subnational Risk Index - SADC*. Disaster Risk Management Knowledge Centre / Joint Research Centre, European Commission.
[2] Funk, C. et al. (2015). The climate hazards infrared precipitation with stations - a new environmental record for monitoring extremes. *Scientific Data* 2, 150066.
[3] Hersbach, H. et al. (2020). The ERA5 global reanalysis. *Quarterly Journal of the Royal Meteorological Society* 146, 1999-2049.
[4] Zargar, A. et al. (2011). A review of drought indices. *Environmental Reviews* 19, 333-349.
[5] WMO (2012). *Standardized Precipitation Index User Guide* (WMO-No. 1090).
[6] UNEP (1992). *World Atlas of Desertification*. United Nations Environment Programme.
[7] Middleton, N. & Thomas, D. (1997). *World Atlas of Desertification*, 2nd ed. UNEP.
[8] Nicholson, S. E. (2017). Climate and climatic variability of rainfall over eastern Africa. *Reviews of Geophysics* 55, 590-635.
[9] Lyon, B. & DeWitt, D. G. (2012). A recent and abrupt decline in the East African long rains. *Geophysical Research Letters* 39, L02702.
[10] Thornthwaite, C. W. (1948). An approach toward a rational classification of climate. *Geographical Review* 38, 55-94.
[11] Vicente-Serrano, S. M., Begueria, S. & Lopez-Moreno, J. I. (2010). A multiscalar drought index sensitive to global warming: the SPEI. *Journal of Climate* 23, 1696-1718.
[12] McKee, T. B., Doesken, N. J. & Kleist, J. (1993). The relationship of drought frequency and duration to time scales. *Proc. 8th Conf. on Applied Climatology*, 179-184.
[13] Pagani, M. et al. (2018). Global Earthquake Model (GEM) seismic hazard map; Giardini, D. et al. (1999). The GSHAP global seismic hazard map. *Annali di Geofisica* 42, 1225-1230.
[14] Dottori, F. et al. (2016). Development and evaluation of a framework for global flood hazard mapping. *Advances in Water Resources* 94, 87-102 (JRC GloFAS).
[15] Giglio, L. et al. (2018). The Collection 6 MODIS burned area mapping algorithm and product (MCD64A1). *Remote Sensing of Environment* 217, 72-85.
[16] Raleigh, C. et al. (2010). Introducing ACLED: an Armed Conflict Location and Event Dataset. *Journal of Peace Research* 47, 651-660.
[17] Albrecht, R. I. et al. (2016). Where are the lightning hotspots on Earth? *Bulletin of the American Meteorological Society* 97, 2051-2068 (LIS/OTD).
[18] Knapp, K. R. et al. (2010). The International Best Track Archive for Climate Stewardship (IBTrACS). *Bulletin of the American Meteorological Society* 91, 363-376.
[19] Mora, C. et al. (2017). Global risk of deadly heat. *Nature Climate Change* 7, 501-506.
[20] Guha-Sapir, D., Below, R. & Hoyois, P. EM-DAT: The CRED/OFDA International Disaster Database; UNDRR DesInventar Sendai disaster-loss database.
