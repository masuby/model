# Risk Over Time — Snapshots, Emerging & Improving Areas (Plan)

**Goal.** Make INFORM Risk a *time series*, not a single picture. Each update is a dated
**snapshot** ("risk as of 2026-06"). Comparing snapshots reveals **emerging** areas (risk
rising — act before a disaster) and **improving** areas (risk falling — DRR is working).

This plan is intentionally incremental: a small foundation ships now; each phase is useful
on its own and builds toward seasonal/quarterly risk monitoring.

---

## 1. What a "snapshot" is

A snapshot = the full INFORM state at one time. Stored compactly, per district:

```jsonc
// src/data/snapshots/2026-06.json
{
  "asOf": "2026-06",
  "source": "CHIRPS v3 seasonal + IPC round 12 + sector updates",
  "districts": {
    "TZ0101": { "risk": 3.9, "H": 2.3, "V": 5.5, "C": 4.6,
                "changed": ["hazard:drought","vulnerability:livelihoods"] }
  }
}
```

The live dataset is always the **latest** snapshot (already stamped `metadata.asOf`).

---

## 2. Dynamic vs structural indicators (what actually moves)

| Type | Indicators | Cadence |
|---|---|---|
| **Dynamic** (drives change) | drought (seasonal CHIRPS), flood (events + rainfall), **food security/IPC**, conflict, displacement, DRR implementation, WASH/health access | season / IPC round / on event |
| **Structural** (carried forward) | earthquake, volcano, landslide terrain, coastal geography, baseline poverty | years / census |

A snapshot only re-measures the dynamic ones; structural values carry over. Each indicator
documents its **own cadence** (honesty: a snapshot is only as fresh as its slowest input).

---

## 3. How a snapshot is created

1. **Scheduled climate refresh** — re-run `compute-drought` / `compute-heavy-rain` /
   `apply-climate-hazards` each season → new drought/flood → write `snapshots/<date>.json`.
2. **Authoritative release** — NBS / IPC-MUCHALI / sector data → entered in **Data Entry**
   (already timestamped per indicator with its authority) → folded into the next snapshot.
3. **Manual freeze** — PMO "save current state as <date>".

A tiny script `scripts/snapshot.mjs` writes the current computed state to a dated file and
appends it to a `snapshots/index.json`.

---

## 4. Detecting emerging & improving areas

For two snapshots t and t−1, per district:

> **Δrisk = risk(t) − risk(t−1)**

- **Emerging** — Δrisk ≥ +0.3 **or** a class jump upward (e.g. Medium→High).
- **Improving** — Δrisk ≤ −0.3 **or** a class drop.
- **Attribution** — which indicator moved most (e.g. "Longido: drought 8.6→9.7"), so action
  is targeted.

Output: a **Δrisk choropleth** (diverging red↑ / green↓) and a ranked **watchlist** of the
top emerging districts with their driver.

---

## 5. Views (reuse what exists)

- **Time selector** — "As of: 2026-06 ▾" on the Risk explorer; switching reloads that
  snapshot into the existing map/table/charts (no new map code).
- **Trend mode** — pick a district → risk line across snapshots (reuse `LineChart` /
  `RegionalTrend`, which already draw multi-point series).
- **Change mode** — pick two dates → Δrisk map + watchlist + per-indicator attribution.

---

## 6. Phases (each ships independently)

- **Phase 0 — foundation (DONE):** `metadata.asOf` baseline stamp; every Data-Entry edit
  carries `_ts` + authority; CHIRPS inputs are inherently temporal (1991–2024); trend chart
  components already exist.
- **Phase 1 — snapshot store:** `scripts/snapshot.mjs` + `src/data/snapshots/*.json` +
  `snapshots.js` loader. Write the current state as `baseline` (2026-06).
- **Phase 2 — time selector:** "As of" dropdown loads a snapshot into the explorer.
- **Phase 3 — change detection:** Δrisk map + emerging/improving watchlist + attribution.
- **Phase 4 — automation:** a scheduled (cron) seasonal climate refresh auto-creates
  snapshots; optional "emerging area" alert when a district crosses a class upward.

---

## 7. Backend note

Locally, snapshots are bundled JSON (works with no server). With the Supabase backend, a
`snapshots(date, district, risk, h, v, c, changed, source)` table makes them multi-user and
queryable for trends — the schema is a small addition to `supabase/setup.sql`.

---

## 8. Honest constraints

- A monthly "as of" label does **not** mean every indicator changed monthly — most move
  seasonally (drought/flood) or per release (IPC, census). The snapshot date is the *review*
  date; per-indicator "last updated" is the truth (shown on hover).
- Trends need ≥ 2 comparable snapshots built the **same** way — so freeze the methodology (this
  manual) before starting the series, and note any method change between snapshots.
