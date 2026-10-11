# INFORM Risk: a worked example with the workbook data

A complete walk-through of how one place gets its INFORM Risk score, using the **INFORM Sub-national
SADC 2024 workbook values** for **Rufiji** (workbook unit TZ0605, Pwani region), its two councils
**Rufiji District** and **Kibiti District** (carved out of Rufiji after the workbook's boundaries were
drawn), the **Pwani** region and the nation. Every value here is produced by
`scripts/build-worked-example.mjs` from the engine (`src/engine/risk`), so it cannot drift from what the
site shows. Data as of 2024-12, the workbook release.

Companion data (open in any spreadsheet):
- `docs/worked_example_indicators.csv`: every workbook indicator in use for Rufiji, from raw value ->
  specification -> 0-10 score -> indicator group -> category -> dimension -> risk
- `docs/worked_example_levels.csv`: council -> workbook unit -> region -> nation

The model is built in five moves: **standardise each indicator to 0-10**, **average the indicators of an
indicator group**, **average the groups into a category**, **scaled-geomean the categories into a
dimension**, **cube-root the three dimensions into risk**.

```
indicator (raw)      --standardise (workbook specification)-->  0-10
0-10 indicators      --arithmetic mean-->                        indicator group (workbook "component")
indicator groups     --arithmetic mean-->                        category
categories           --ROUND(scaled geomean, 1)-->               dimension  (Hazard & Exposure, Vulnerability, Lack of Coping)
3 dimensions         --ROUND(cube root, 1)-->                    INFORM Risk
```

> **What changed in October 2026.** The June 2026 version of this example used a dataset that had been
> adjusted after the workbook (a computed flood index with a "raise-only" floor, flood amplified by
> exposure, a council hazard computed on Kibiti's own polygon, and the Kondoa district row quoted as the
> "official national value 4.1"). The integrity assessment (`docs/assessment/`) removed all of that from
> the Core. The numbers below are the workbook's own, and the national figure is the INFORM aggregate of
> the councils.

---

## Step 1: Raw data becomes a 0-10 score (standardisation)

Each indicator starts as a measurement in its own unit and is rescaled to 0-10 (10 = worst) by the
workbook's specification for that indicator: an optional denominator, an optional outlier fence, an
optional logarithm, a min-max against the indicator's reference range, and the direction of effect.
Three of Rufiji's 53 indicators:

| Indicator (workbook id) | Raw value | Specification | Calculation | Score |
|---|---|---|---|---|
| **Historic drought frequency** (HA.NAT.DR-FRE) | 9 years | reference 5 to 19, increases risk | 10 x (9 - 5) / (19 - 5) = 2.857 | **2.9** |
| **Flood exposure** (HA.NAT.FL-EXP) | 0.177 % of population | logarithm LN(0.001 + x), reference -6.908 to -1.149, increases risk | LN(0.178) = -1.726; 10 x (-1.726 + 6.908) / (-1.149 + 6.908) = 8.998 | **9.0** |
| **Life expectancy** (VU.VG.HC-LEXP) | 65.01 years | reference 63.94 to 72.08, **decreases** risk | 10 x (65.01 - 63.94) / (72.08 - 63.94) = 1.314; inverted: 10 - 1.314 = 8.686 | **8.7** |

Two cases that produce no score, and are treated as no data rather than as zero:

- **Internet access** (CC.INF.COM-INT) has no workbook value for any Tanzanian unit, so it is excluded
  from the Communication group, which is then the mean of electricity access (9.3) and cellphone
  ownership (2.6) alone.
- **Density of health facilities** (CC.INF.HC-FAC) is a per-capita indicator whose reference range in the
  workbook is 0 to 0, so it can never produce a score (a documented limitation reported to the SADC and
  INFORM partners).

The reference ranges are the workbook's own (17 fixed pairs, 36 data ranges over the 170 units), frozen
at the 2024 release; a new institutional value outside its range is clamped to 0 or 10 and flagged.

## Step 2: Indicators average into an indicator group (workbook "component")

Where a group has several indicators, the group value is their arithmetic mean over the indicators with
data (the workbook's `AVERAGEIFS` over `Use = Yes`):

```
Environmental degradation = mean(deforestation 8.3, soil erosion 2.5)          = 5.4
Wildfire                  = mean(burned area 3.9, fire weather index 5.1)      = 4.5
Internal violence         = mean(events 5.1, fatalities 8.5)                   = 6.8
Development & poverty     = mean(HDI 8.3, MPI 0.3, GDI 10, inequality 7.1)     = 6.425
```

Groups with one indicator take its score (drought 2.9, flood 9.0, landslide 5.2). Six groups have no
indicator with data in the workbook for any Tanzanian unit (heatwave, lightning, zoonoses, hazardous
material, vehicle accidents and the economic vulnerable-groups indicator); they do not enter any score.

## Step 3: Indicator groups average into a category (arithmetic mean)

```
Natural hazards   = mean(coastal 0, drought 2.9, earthquake 0.7, env. degradation 5.4, flood 9.0,
                         landslide 5.2, storms 0, volcano 0, wildfire 4.5)                 = 27.7 / 9 = 3.08
Human hazards     = mean(conflict intensity 0, conflict risk 0.7, internal violence 6.8)   = 2.50
Socio-economic    = mean(poverty 6.425, dependency 3.467, habitat 5.75, livelihoods 0)     = 3.91
Vulnerable groups = mean(displaced 0, health conditions 4.733, children 6.35)              = 3.69
Infrastructure    = mean(health 5.32, economic 8.667, WASH 7.0, communication 5.95, education 6.0) = 6.59
Institutional     = mean(DRR implementation 6.5, governance 4.2)                           = 5.35
```

Missing groups (`null`) are **excluded**, never counted as 0: "no data" must not look like "no problem".
A real 0 (coastal hazards 0 in a unit the workbook scores at the bottom of the range) **is** included.

## Step 4: Categories combine into a dimension (scaled geometric mean)

The two categories of a dimension are combined with INFORM's scaled geometric mean, so a high category
is not cancelled out by a low one, and the result is rounded to one decimal as in the workbook:

```
dimension = ROUND( ( 10 - GEOMEAN( (10 - c) / 10 x 9 + 1  for each category c ) ) / 9 x 10 , 1 )

Hazard & Exposure : scaled 7.228 and 7.750 -> GEOMEAN 7.4845 -> (10 - 7.4845) / 9 x 10 = 2.795 -> 2.8
Vulnerability     : scaled 6.481 and 6.679 -> GEOMEAN 6.5793 -> 3.801                      -> 3.8
Lack of Coping    : scaled 4.069 and 5.185 -> GEOMEAN 4.5932 -> 6.008                      -> 6.0
```

## Step 5: The three dimensions become Risk (cube root)

```
Risk = ROUND( ( Hazard & Exposure x Vulnerability x Lack of Coping ) ^ (1/3) , 1 )
     = ( 2.8 x 3.8 x 6.0 ) ^ (1/3)  =  63.84 ^ (1/3)  =  3.995  ->  4.0
```

**Interlinkage:** all three dimensions multiply, so none can be ignored. Rufiji's risk (4.0, Medium on
the SADC thresholds) is driven up by **lack of coping capacity** (6.0: low household income, little
electricity, few physicians) while hazard (2.8) and vulnerability (3.8) are moderate. Cut any one
dimension and the risk falls; that is why strengthening coping capacity lowers real risk even where the
hazard cannot be changed.

---

## Harmonisation across the levels

The same five moves run at each level; only the **input values** change.

| Level | Unit | How it is built | H&E | V | LCC | Risk |
|---|---|---|---|---|---|---|
| Council (195) | **Rufiji District** | the values of its workbook unit, Rufiji | 2.8 | 3.8 | 6.0 | **4.0** |
| Council (195) | **Kibiti District** | created after the workbook's boundaries: carries Rufiji's values, flagged as inherited, until council values are approved | 2.8 | 3.8 | 6.0 | **4.0** |
| Workbook unit (170) | **Rufiji** | the five steps above | 2.8 | 3.8 | 6.0 | **4.0** |
| Region (31) | **Pwani** (9 councils) | mean of each indicator over the region's councils, then steps 2 to 5 | 2.4 | 3.8 | 6.0 | **3.8** |
| National | **Tanzania** (195 councils) | mean of each indicator over all councils, then steps 2 to 5; **not an official INFORM figure** | 2.4 | 3.8 | 6.2 | **3.8** |

How each level links to the next:

- **Workbook unit -> council:** a council carries the values of the workbook unit it belongs to. 25 units
  back two councils each, and 20 councils created after the workbook's boundaries (Kibiti among them)
  inherit their parent's values and are flagged, never fabricated. A value an institution enters for a
  council through the Data portal (a measured value, or a 0-10 score by the INFORM method with a citable
  source) replaces the workbook value **for that council alone**, once approved.
- **Council -> region:** Pwani's value is built by averaging each indicator across its nine councils and
  then **re-running** steps 2 to 5, not by averaging the councils' risks (averaging risks directly would
  drop the geometric penalty). Pwani's vulnerability and coping equal Rufiji's because the workbook's
  vulnerability and coping indicators are regional or national in resolution, so every Pwani unit carries
  the same values; only the hazard indicators, keyed at district level, differ between them.
- **Council -> national:** the national figure is built the same way over all 195 councils. INFORM
  publishes no national figure for a subnational model and subnational models are not comparable with
  INFORM Global, so the national value is labelled an aggregate of the councils and never set beside the
  INFORM Global country score as if comparable.
- **The Advancement layer** (council climate and terrain indices from CHIRPS, ERA5, MODIS, SMAP and SRTM)
  is computed beside this chain from its own inputs and shown on each profile under "Advancement"; it
  never changes a value above.

Every number above is regenerated from the shipped data by `scripts/build-worked-example.mjs`; the two
CSVs are the full tables behind this page.
