# Verified against Tanzania - Country Model Template.xlsx (the real formulas)

Every formula below was **read directly from the workbook's own cells** (openpyxl, formula mode) on
2026-06-03 — not assumed. Most of the engine lives in **hidden sheets** (`Thresholds`,
`Indicator processing - 22`, `Indicator processing - 12`, `Indicator Data`, `SADC - Admin2 Data`,
`admin_analysis` are all `hidden`). Sheet of record for the maths: **`INFORM SADC 2024`**; for
standardisation: **`Indicator - processed`** + the two hidden `Indicator processing` sheets.

## 1. Standardisation of each indicator to 0-10  (sheet: Indicator - processed)

Per-indicator configuration rows: Outlier detection (No/Yes), **Transformation (None / Logarithm /
Exponential)**, **Normalisation (Data Range / Custom)**, Max/Min, **Risk dependency sign
(Increase / Decrease Risk)**.

**Transformation** (hidden `Indicator processing - 22`, the data formula):
```
IF(Transformation = "Logarithm",  LN(0.001 + cappedValue),
IF(Transformation = "Exponential", EXP(cappedValue),
                                    cappedValue))
   where cappedValue = (Outlier="No") ? value : MAX(MIN(value, MaxThresh), MinThresh)
```

**Normalisation to 0-10** (the array formula in `Indicator - processed`):
```
MAX(0, MIN(10, ROUND(
   IF(sign = "Decrease Risk", 10 - 10*(x - Min)/(Max - Min),
                              10*(x - Min)/(Max - Min)),
   1)))
   where Max,Min = (Normalisation="Data Range") ? data-range max,min : custom max,min
```
=> the standardisation **is min-max to 0-10**, with an optional **log/exp** transform first, outlier
capping, and an **inversion** for "Decrease Risk" indicators (e.g. coping resources, where more = safer).

## 2. Indicator -> Component -> Category -> Dimension -> Risk  (sheet: INFORM SADC 2024, row 4)

```
Component  (e.g. X4) = AVERAGEIFS('Indicator - processed'!…, component matches, "Yes")   ← arithmetic mean
Category   (Y4)      = AVERAGE(T4:X4)                                                     ← arithmetic mean
Dimension  (Z4)      = ROUND( (10 - GEOMEAN( (10-S4)/10*9+1 , (10-Y4)/10*9+1 )) /9*10 , 1)   ← SCALED GEOMEAN
Risk       (AV4)     = ROUND( Z4^(1/3) * AK4^(1/3) * AU4^(1/3) , 1 )                      ← CUBE ROOT
```
(Z4 = Hazard&Exposure, AK4 = Vulnerability, AU4 = Lack of Coping; each its own scaled geomean.)

## 3. Risk class  (hidden sheet: Thresholds)
```
class = IF(x < t1, 0, IF(x < t2, 1, IF(x < t3, 2, IF(x < t4, 3, 4))))   → Very Low … Very High
```

## How this codebase matches

| Excel step | Excel formula | This codebase | Match |
|---|---|---|---|
| component | AVERAGE | `mean()` | exact |
| category | AVERAGE | `mean()` | exact |
| dimension | scaled GEOMEAN `(10-GEOMEAN((10-c)/10*9+1))/9*10` | `sgm()` | **exact** |
| risk | cube root `H^⅓·V^⅓·LCC^⅓` | `cbrt()` | **exact** |
| standardise | min-max `10*(x-Min)/(Max-Min)`, clamp 0-10 | min-max in the compute scripts | same method |
| skew handling | `Transformation = Logarithm` (LN) | log min-max for population density | same method |
| good-is-low | `sign = Decrease Risk` -> invert | inverted in the coping/resource scripts | same method |

**The one honest deviation.** The Excel lets each indicator normalise against either **Data Range**
(min/max of the data) **or Custom** (fixed reference values). For the indicators we **re-computed** from
primary data (CHIRPS drought/heavy-rain, ERA5 heat, NBS exposure), we used **Data Range over Tanzania**.
Where official INFORM uses a **Custom global/SADC reference**, our recomputed value is therefore
standardised relative to Tanzania, not to that fixed reference (see limitation #7). The aggregation
(average -> scaled geomean -> cube root) is byte-for-byte the Excel's; the standardisation **method**
(min-max, log, inversion, outlier capping) is the Excel's; only the **reference range** for recomputed
indicators is Tanzania-relative rather than the fixed INFORM reference.

Reproduce: `python3` + openpyxl on `Tanzania - Country Model Template.xlsx`, `data_only=False`
(formulas), sheets `INFORM SADC 2024` / `Indicator - processed` / `Indicator processing - 22` /
`Thresholds`. Engine sheets are hidden — set `ws.sheet_state='visible'` or read by name.
