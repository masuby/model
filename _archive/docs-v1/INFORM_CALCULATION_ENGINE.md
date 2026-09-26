% INFORM Tanzania - The Calculation Engine, Formula by Formula
% Extracted directly from Tanzania - Country Model Template.xlsx (formula mode, hidden sheets included)
% 2026-06-03

# How to read this document

Every formula below was read **directly from the workbook's own cells** (openpyxl, `data_only=False`),
not assumed. The engine is spread across **hidden** sheets - made visible only for this audit:

| Sheet | State | Role |
|---|---|---|
| Data - Subnational Adm2 / Adm1 / National | visible | raw indicator values keyed in per admin unit |
| SADC - Admin2 / Admin1 / National Data | **hidden** | the SADC regional reference data |
| Indicator Data | **hidden** | assembles each indicator's raw values from the right resolution |
| Indicator processing - 12 | **hidden** | denominator + Tukey outlier bounds |
| Indicator processing - 22 | **hidden** | transformation (log/exp) + outlier capping |
| Indicator - processed | visible | min-max normalisation to 0-10 |
| INFORM SADC 2024 | visible | average -> scaled geomean -> cube root |
| Thresholds | **hidden** | risk class breakpoints |
| SUBDIVISIONS / SADC - Subdivisions | **hidden** | denominators + per-indicator reference ranges |

The data flows **left to right**: raw -> denominator -> outlier-capped -> transformed -> normalised 0-10
-> component -> category -> dimension -> risk -> class.

---

# Raw values vs standardised 0-10 - what the model keeps, what it computes on

**The risk maths never uses a raw count.** A population of 40,000 (or a rainfall total, a road length,
a number of clinics) is first turned into a **0-10 standardised score**, and **only the 0-10 score** enters
the component -> category -> dimension -> risk chain. The raw number is kept **for display and
traceability** (our app still shows "Population 195,638"), but it does **not** appear in any risk formula.

### Worked example - five councils, populations 40,000 / 48,000 / 12,000 / 87,000 / 8,000

Min-max takes the smallest to 0 and the largest to 10: `score = 10 * (value - Min) / (Max - Min)`
(here Min = 8,000, Max = 87,000):

| Council | Raw population | Linear min-max -> 0-10 | If "Logarithm" transform first -> 0-10 |
|---|---|---|---|
| A | 40,000 | 4.1 | 6.7 |
| B | 48,000 | 5.1 | 7.5 |
| C | 12,000 | 0.5 | 1.7 |
| D | 87,000 | **10.0** | **10.0** |
| E | 8,000 | **0.0** | **0.0** |

So 40,000 becomes **4.1** (or **6.7** if the indicator is log-transformed because it is right-skewed);
87,000 always becomes 10, 8,000 becomes 0. The raw 40,000 is **never** multiplied or cube-rooted -
only the 4.1 is. (For *exposure* specifically the model divides population by area to get **density**
first, then log-min-max - density is highly skewed, so the log column is the realistic one.)

### Two ways to feed the model - and which one our app uses

1. **Key in the RAW value** (population, count, %, mm). The Excel pipeline standardises it for you:
   `raw  ->  / denominator  ->  Tukey outlier cap  ->  log/exp/linear transform  ->  min-max 0-10`.
2. **Key in the STANDARDISED 0-10 score directly** - for an indicator that is already an index, or when
   you standardised it elsewhere. In the Excel you set `Normalisation = Custom, Min = 0, Max = 10` with no
   transform, so the input passes straight through.

**Our app uses way #2.** Data Entry asks for the **0-10 score** of each indicator (and the 0-10 exposure
index), because the heavy standardisation is done **offline** in the Python compute scripts
(CHIRPS / ERA5 / NBS), which output the finished 0-10 values into the dataset. So a sector officer keys in,
say, `drought = 8.6`, not "rainfall = 1,088 mm" - the rainfall-to-8.6 step already happened in the script.
The raw figures (population, rainfall, facility counts) are stored alongside for display and audit, but the
score is what the engine computes on.

Each formula is shown with: **(a)** the exact Excel formula, **(b)** plain-language meaning, **(c)** how
**this codebase** implements it, **(d)** a **FLAG** for our discussion.

---

# Stage 0-1. Raw data assembly  (Indicator Data, hidden)

**Resolution detection - `Indicator Data!G7`**
```
=IF(COUNTIF('Data - Subnational Adm2'!$E$3:$DI$3,G$3)>0, "Subnational - Adm2",
 IF(COUNTIF('Data - Subnational Adm1'!$G$3:$DF$3,G$3)>0, "Subnational - Adm1",
 IF(COUNTIF('Data - National'!$G$3:$DZ$3,G$3)>0, "National","")))
```
- **Meaning:** for each indicator, find at what resolution its data was entered (council/Adm2, region/Adm1, or national).
- **Us:** all our indicators are Adm2 (council/district). N/A.
- **FLAG:** none.

**Pull the raw value - `Indicator Data!G10`**
```
=IFERROR(IF(G$7="Subnational - Adm2", INDEX('Data - Subnational Adm2'!…, MATCH(unit), MATCH(indicator)),
        IF(G$7="Subnational - Adm1", INDEX('Data - Subnational Adm1'!…),
        IF(G$7="National", INDEX('Data - National'!…), "No data"))), "No data")
```
- **Meaning:** look up the raw value for this unit + indicator from whichever Data sheet holds it. Missing -> "No data".
- **Us:** our dataset already stores per-council values; "No data" = our `null` (excluded from means/geomean).
- **FLAG:** good - confirms **missing data is "No data", never 0** (matches our null rule).

# Stage 2. Denominator + outlier bounds  (Indicator processing - 12, hidden)

**Denominator-normalise - `G11`**
```
=IF('Indicator Data'!G10="No data","No data",
   IFERROR('Indicator Data'!G10 / IF(G$6="None",1, INDEX(SUBDIVISIONS!…denominator…)),""))
```
- **Meaning:** divide the raw value by a **denominator** (population, area, households…) from the SUBDIVISIONS sheet, so a count becomes a *rate* (per-capita / per-km²). If denominator = "None", divide by 1 (use the value as-is).
- **Us:** we build rates directly (population density = population / area; facilities per area). Same idea, computed in the Python scripts.
- **FLAG #A:** confirm each of **our** indicators uses the **same denominator** INFORM uses (e.g., is exposure pop/area, or pop-in-hazard-zone / total pop?).

**Upper outlier bound - `G8`** and **Lower - `G9`** (Tukey fence)
```
G8 = QUARTILE.INC(values,3) + 1.5*(QUARTILE.INC(values,3) - QUARTILE.INC(values,1))     # Q3 + 1.5*IQR
G9 = QUARTILE.INC(values,1) - 1.5*(QUARTILE.INC(values,3) - QUARTILE.INC(values,1))     # Q1 - 1.5*IQR
```
- **Meaning:** the standard **Tukey 1.5×IQR fence**. Anything above Q3+1.5·IQR or below Q1−1.5·IQR is an outlier and will be **capped** to the fence (next stage), so one freak value can't dominate the min-max.
- **Us:** **we do NOT compute or apply a Tukey fence** in our CHIRPS/ERA5/NBS scripts - we min-max on the raw range.
- **FLAG #B (important):** *our recomputed indicators skip INFORM's outlier capping.* A single extreme council (e.g. one very dense or very dry unit) can stretch our min-max. **Candidate improvement: add the Q1−1.5·IQR / Q3+1.5·IQR cap before min-max.**

# Stage 3. Transformation + capping  (Indicator processing - 22, hidden)

**Transform - `G13`**
```
=IF(noData,"No data",
   IF(Transformation="Logarithm",  LN(0.001 + cappedValue),
   IF(Transformation="Exponential", EXP(cappedValue),
                                     cappedValue)))
   where cappedValue = (Outlier="No") ? value : MAX(MIN(value, UpperBound), LowerBound)
```
- **Meaning:** first **cap** to the Tukey fence (only if outlier detection is on), then apply the chosen **transform**: `LN(0.001+x)` for right-skewed indicators (so a few huge values don't dominate), `EXP` rarely, or none (linear).
- **Us:** we apply **log min-max to population density** (right-skewed) and linear to the rest - the *same* logic, chosen per indicator.
- **FLAG #C:** list which indicators INFORM marks "Logarithm" vs our choices, so the **skew handling matches** indicator-for-indicator (we currently only log density).

`G8/G9/G10` = AVERAGE / MAX / MIN of the transformed series (used by the next stage).

# Stage 4. Normalise to 0-10  (Indicator - processed)

Per-indicator config rows: `Outlier detection`, `Transformation`, `Normalisation (Data Range | Custom)`,
`Max/Min (if custom)`, `Risk dependency sign (Increase | Decrease Risk)`.

**Min/Max used for scaling - `G19/G20`**
```
G19 (Max) = IF(Normalisation="Data Range", data max, customMax)
G20 (Min) = IF(Normalisation="Data Range", data min, customMin)
```

**The 0-10 value - `G24`**
```
= MAX(0, MIN(10, ROUND(
     IF(sign="Decrease Risk", 10 - 10*(x - Min)/(Max - Min),
                              10*(x - Min)/(Max - Min)),
     1)))
```
- **Meaning:** **min-max to 0-10**, clamped and rounded to 0.1. For **"Decrease Risk"** indicators (more = safer, e.g. coping resources, GDP) it **inverts** so that 10 is always "worst".
- **Us:** our compute scripts min-max to 0-10; coping/resource indicators are inverted. **Same method.**
- **FLAG #D (the known one):** INFORM can scale against a **Custom** fixed reference (the example indicator uses Max=0.0, Min=−0.3) rather than the **Data Range**. For our re-computed hazards we used **Data Range over Tanzania** - so where INFORM uses a fixed global/SADC reference, our 0-10 is *Tanzania-relative*. This is limitation #7; it changes absolute values, not the spatial pattern.

`G21/G22` = Skewness / Kurtosis of the normalised series - **diagnostics** INFORM watches to decide whether a log transform was needed. We don't report these.
- **FLAG #E:** add skew/kurtosis diagnostics so we *justify* each transform choice the way INFORM does.

# Stage 5. Aggregate  (INFORM SADC 2024, row 4)

```
Component (G4)  = AVERAGEIFS('Indicator - processed'!…, component match, useIndicator="Yes")   # mean
Category  (S4)  = AVERAGE(components)                                                           # mean
Dimension (Z4)  = ROUND( (10 - GEOMEAN( (10-S)/10*9+1 , (10-Y)/10*9+1 )) /9*10 , 1)             # scaled geomean
Risk      (AV4) = ROUND( Z^(1/3) * AK^(1/3) * AU^(1/3) , 1 )                                    # cube root
```
- **Meaning:** indicators average into a component; components average into a category; the two categories combine with the **scaled geometric mean** (a low category drags the dimension down, unlike a plain average); the three dimensions combine with the **cube root**.
- **Us:** `mean()`, `mean()`, `sgm()`, `cbrt()` - **byte-for-byte identical**. (`AVERAGEIFS … "Yes"` = only indicators flagged *use* are counted - same as our null-exclusion.)
- **FLAG #F:** confirm our `useIndicator` set matches INFORM's (do we count any indicator INFORM excludes, or vice-versa?).

# Stage 6. Risk class  (Thresholds, hidden)

```
class = IF(x<t1, 0, IF(x<t2, 1, IF(x<t3, 2, IF(x<t4, 3, 4))))     # 0..4 = Very Low..Very High
```
- **Meaning:** the 0-10 risk maps to a 5-class band by fixed breakpoints (separate breakpoints for Hazard, Vulnerability, Capacity, Risk).
- **Us:** `classifyRisk()` uses the INFORM risk bands.
- **FLAG #G:** confirm our class breakpoints equal the Thresholds sheet's exactly (Hazard/Vuln/Capacity may use *different* breakpoints than Risk).

---

# Summary of flags to discuss (then append/improve the engine)

| # | Flag | Excel does | We do | Action to consider |
|---|---|---|---|---|
| A | Denominator | divides by a chosen denominator (per-capita/area) | build rates directly | verify each denominator matches |
| **B** | **Outlier capping** | **Tukey Q1−1.5·IQR / Q3+1.5·IQR before min-max** | **none** | **add the IQR cap to our compute scripts** |
| C | Transform choice | per-indicator Log/Exp/None | log only for density | match the log/exp set indicator-by-indicator |
| **D** | **Reference range** | Data Range **or Custom fixed** | Data Range over Tanzania | decide per indicator: Tanzania range vs INFORM fixed reference |
| E | Diagnostics | skew/kurtosis reported | not reported | add to justify transforms |
| F | Indicator use-set | `useIndicator="Yes"` filter | null-exclusion | reconcile the included-indicator list |
| G | Class breakpoints | per-dimension thresholds | risk bands | confirm exact breakpoints |
| H | Missing whole category | dimension blanks (AVERAGE errors) | falls back to the present category | v2: replicate the blank, or document the fallback |
| I | Dimension = 0 | risk = 0 (0^(1/3)=0) | **aligned** (was null via a >0 guard) | **resolved Jun 2026** - guard dropped |
| J | Category weighting | hardwired unweighted | **aligned** (was a 0.5 pass-through in the formal engine) | **resolved Jun 2026** - dimension geomean unweighted; weighting = flagged v2 deviation |
| K | Two engines of record | one workbook | golden fixture now guards both `riskModel` + `informCalculationEngine` | v2: converge to one engine |

**Already confirmed identical:** component/category **mean**, dimension **scaled geomean**, risk **cube
root**, min-max **method**, log-transform **method**, risk-sign **inversion**, "No data" = **null**.

The two substantive engine improvements on the table are **#B (IQR outlier capping)** and **#D (custom vs
data-range references)**. Everything else is wording/verification.
