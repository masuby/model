# INFORM Risk — a worked example with real data

A complete walk-through of how one place gets its INFORM Risk score, using **real shipped numbers**
for **Rufiji** (Pwani region) — a documented flood district — its split council **Kibiti**, and the
**Pwani** region. Every value here is produced by `scripts/build-worked-example.mjs` from the live
dataset, so it cannot drift from what the app shows.

Companion data (open in any spreadsheet):
- `docs/worked_example_indicators.csv` — every indicator: raw value -> standardisation -> 0-10 -> aggregation
- `docs/worked_example_levels.csv` — council -> district -> region -> national harmonisation

The model is built in four moves: **standardise each indicator to 0-10**, **average indicators into a
category**, **scaled-geomean categories into a dimension**, **cube-root the three dimensions into risk**.

```
indicator (raw)  --standardise-->  0-10
0-10 indicators  --arithmetic mean-->  category
categories       --scaled geomean-->   dimension  (Hazard&Exposure, Vulnerability, Lack-of-Coping)
3 dimensions     --cube root-->        INFORM Risk
```

---

## Step 1 — Raw data becomes a 0-10 score (standardisation)

Each indicator starts as a real measurement and is rescaled to 0-10 (10 = worst). Three concrete cases:

| Indicator | Raw measurement (Rufiji / Kibiti) | Source | How it becomes 0-10 | Score |
|---|---|---|---|---|
| **Heavy rainfall** | 1.2 days/yr above 50 mm | CHIRPS v3 daily 2015-2024 | min-max of (days>50mm + 2 x days>100mm) | 0.9 |
| **Flood (hazard)** | documented river floods 2018, 2020 | DesInventar / PMO-DMD | documented floor, raised by heavy-rain, then Hazard x Exposure | **9.0** |
| **Exposure (population)** | 195,638 people / 3,722 km² = 53/km² | NBS 2022 PHC council census | log min-max of population density | 3.1 |

**Key point:** flood hazard is **not** just local rain. Kibiti's own heavy-rain is low (0.9) because the
delta floods come from the **Rufiji river** (rain upstream), not local downpours — so the **documented
flood record** sets the score to 9.0. Vulnerability and Coping indicators are standardised the same way
(poverty from the Household Budget Survey, stunting from TDHS 2022, WASH from the 2022 census, and so on)
— see the CSV for all 32.

## Step 2 — Hazard meets Exposure (H x E)

INFORM hazard is "how bad x how many people are in the way". For flood:

```
flood = max( hazard , sqrt( hazard x exposure ) )         hazard = 9.0 , exposure = 3.1
      = max( 9.0 , sqrt(9.0 x 3.1) )  = max(9.0, 5.3) = 9.0
```

Exposure can only **raise** a hazard, never hide it — a documented flood district stays flagged even if
exposure is modest.

## Step 3 — Indicators average into a category (arithmetic mean)

Rufiji's twelve **Natural-hazard** indicators (drought 5.8, flood 9.0, earthquake 0.7, landslide 5.2,
wildfire 4.5, storms 7.0, coastal 7.5, heatwave 6.5, lightning 3.0, env. degradation 5.4, volcano 0,
zoonoses = no data) average to:

```
Natural hazards = mean(5.8, 9.0, 0.7, 5.2, 4.5, 7.0, 7.5, 6.5, 3.0, 5.4, 0) = 5.0      (zoonoses null is excluded)
Human hazards   = mean(0, 0.7, 6.8, 4.0) = 2.9                                          (hazardous-material null excluded)
```

Missing data (`null`) is **excluded**, never counted as 0 — "no data" must not look like "no problem".

## Step 4 — Categories combine into a dimension (scaled geometric mean)

The two categories are combined with the INFORM scaled geometric mean, so a high category is **not**
cancelled out by a low one:

```
dimension = ( 10 - GEOMEAN( (10-c)/10 x 9 + 1  for each category c ) ) / 9 x 10

Hazard & Exposure = sgm(Natural 5.0, Human 2.9) = 4.0
Vulnerability     = sgm(Socio-economic 3.9, Vulnerable groups 3.7) = 3.8
Lack of Coping    = sgm(Infrastructure 6.6, Institutional 4.4) = 5.6
```

## Step 5 — The three dimensions become Risk (cube root)

```
Risk = ( Hazard&Exposure x Vulnerability x Lack-of-Coping ) ^ (1/3)
     = ( 4.0 x 3.8 x 5.6 ) ^ (1/3)  =  85.1 ^ (1/3)  =  4.4
```

**Interlinkage:** all three dimensions matter equally and multiply. Rufiji's risk (4.4) is driven up by
**high coping difficulty** (5.6 — remote delta, weak services) even though hazard (4.0) and vulnerability
(3.8) are only moderate. Cut any one dimension and the risk falls; that is why reducing vulnerability or
strengthening coping capacity lowers real risk.

---

## Harmonisation across the four levels

The same four moves run at each level; only the **input units** change.

| Level | Unit | How it is built | H&E | V | LCC | Risk |
|---|---|---|---|---|---|---|
| Council (195) | **Kibiti** | Hazard computed on Kibiti's own polygon (raise-only vs district); Vulnerability & Coping = Rufiji district | 4.1 | 3.8 | 5.6 | **4.4** |
| District (170) | **Rufiji** | the five steps above | 4.0 | 3.8 | 5.6 | **4.4** |
| Region (31) | **Pwani** (7 districts) | average each indicator across the region's districts, then re-run scaled-geomean + cube root | 3.4 | 3.8 | 5.8 | **4.2** |
| National | **Tanzania** | the **official INFORM country value** (not a unit mean) | 2.2 | 5.5 | 5.9 | **4.1** |

How each level links to the next:
- **Council -> district:** a council carries its **own** Hazard & Exposure (computed on its polygon) but
  shares the district's Vulnerability & Coping, because those come from district-level surveys (HBS, TDHS,
  IPC) that have no council breakdown. Kibiti's hazard (4.1) edges above Rufiji's (4.0) — its own delta
  exposure — so it is never shown safer than the documented district.
- **District -> region:** Pwani's value is built by averaging each indicator across its seven districts,
  then **re-running** the scaled-geomean and cube root — not by averaging the district risks. (Averaging
  risks directly would quietly drop the geometric penalty.)
- **Region -> national:** the national figure is the **official INFORM Tanzania country value (4.1)**, kept
  as published rather than re-aggregated, so the headline always matches the global INFORM release.

Every number above is regenerated from the shipped data by `scripts/build-worked-example.mjs`; the two CSVs
are the full tables behind this page.
