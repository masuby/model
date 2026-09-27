# INFORM Tanzania — Lean Rebuild Plan ("jet engine")

**Date:** 2026-05-30
**Goal:** Cut the "playing portal" down to **three modules that work flawlessly** and
truly reflect the INFORM model — **Education, Risk, Severity** — and *zip the rest
beside* for a future phase. Few features, clearly understandable, fast.

---

## 1. Guiding principles

1. **Protect the brain, cut the body.** The INFORM engines are faithful and tested
   (`informCalculationEngine` = Risk ∛(H×V×LCC), `informSeverityEngine` = IASC
   Severity v6, 76 indicators with PDF citations, and `excelParity.test.js` locks
   numeric parity with the Tanzania Excel). **No engine rewrite.** Everything else
   serves these.
2. **One source of truth for data.** Risk & Severity read **one curated Tanzania
   dataset** derived from the official Excel. No live submissions in the lean app.
3. **Three modules, three nav items.** If a screen isn't Education, Risk, or
   Severity, it gets archived — not deleted.
4. **Every phase ships.** The app builds and the tests stay green after each step.
5. **Archive, never delete.** Cut features move to `_archive/` (kept in-repo, out of
   the build) so they can return later.

---

## 2. Target shape

```
INFORM Tanzania (lean)
├── Education   — guided course (6 sections + quizzes) + indicator guide
├── Risk        — INFORM Risk calculator + visualizer over the curated dataset
└── Severity    — INFORM Severity calculator + visualizer
```

- **No login (CONFIRMED 2026-05-30).** Public tool — the entire auth/role surface is
  archived. Quiz progress saved to `localStorage` (no accounts).
- **Keep** English/Swahili toggle (lightweight, high value for Tanzania).
- Target: **~85 `.jsx` files → ~15–20**; `App-*.js` bundle from 2.6 MB → a fraction.

---

## 3. KEEP vs ARCHIVE

### KEEP (the lean core)
| Area | Files | Role |
|---|---|---|
| INFORM engines | `src/services/informCalculationEngine.js`, `informSeverityEngine.js`, `informIndicatorDefinitions.js`, `informIndicatorDescriptions.js`, `informSeverityDefinitions.js`, `informTransparency.js`, `informFormulas.js` (core only) | Risk/Severity math + indicator metadata |
| Engine tests | `src/services/__tests__/*` | Parity + correctness guardrails |
| Education | `components/landing/Module01*` (→ becomes Education) | Guided course + quizzes |
| Risk | `components/inform-risk/Module02*` | Risk calculator + visualizer |
| Severity | `components/severity/Module04*` | Severity calculator + visualizer |
| One map + few charts | `visualization/components/InformChoroplethMap`, `InformRadarChart`, `InformSunburst` (only those Risk/Severity use) | Risk display |
| Curated data | the Tanzania Excel → a bundled `src/data/tanzania-inform.json` + a thin loader | Single dataset |
| Shell | a **slimmed** `App.jsx`, one nav, `Footer`, `LanguageContext` | 3-route shell |

### ARCHIVE → `_archive/` (zipped beside, for future)
- **Warning system** — `components/warning/`, `components/warning-standalone/`, `pages/WarningModule.jsx` (the single biggest chunk, ~840K)
- **Climate** — `components/climate/`
- **Admin / data hub** — `components/admin/` (8 tabs), `components/dashboard/` (3 dashboards), `components/data-entry/`
- **Auth** — `components/auth/`, `context/AuthContext`, `services/authService` *(if we go public)*
- **~20 unused charts** in `visualization/`
- **Multi-user backend** — `services/committeeSupabaseService.js`, `supabaseDataService.js`, `excelStorageService.js`, `lib/supabase.js`, `utils/supabaseClient.js`.
  > ⚠️ Keep `supabase/setup.sql` + `supabase/` docs in place — they're the validated
  > foundation for the **future multi-user phase**. Just unwire them from the lean app.
- **Demo/dead** — `warning-standalone/demo/DemoApp.jsx`, `Module03InformWarning.jsx` (old iteration), `DeleteData`, `SearchBar`, root `DataEntry.jsx` if unused.

---

## 4. Module specifications

### 4.1 Education — *guided course with quizzes*
- Rebuild from Module 01's six sections: **Hazard → Exposure → Sensitivity →
  Vulnerability → Coping Capacity → Risk**, each ending in a short comprehension quiz
  (must pass to advance; progress in `localStorage`).
- Add a **7th "Severity" lesson** so the course covers both indices.
- **Indicator Guide** sub-view: browse all 76 indicators by Dimension → Category →
  Component, each showing the plain-language description, source, and PDF reference
  straight from `informIndicatorDescriptions.js`.
- A **"see the math" panel** that runs one real example through the engine so learners
  watch raw values → normalize → aggregate → classify.

### 4.2 Risk — *calculator + visualizer*
- Load the curated Tanzania dataset; run it through `informCalculationEngine` to get
  per-region/district Hazard, Vulnerability, Coping, and Risk + class.
- **Visualize:** choropleth map of Tanzania (risk class colour), a region/district
  drill-down with the 3-dimension breakdown (radar), and a ranked table.
- **Calculator mode:** let a user adjust indicator inputs for a location and watch the
  Risk recompute live (same engine) — the "interactive" heart of the module.
- Guardrail: results must match `excelParity.test.js`.

### 4.3 Severity — *calculator + visualizer*
- `informSeverityEngine` over curated sample event scenarios (since no live events).
- **Calculator mode:** enter an event's Impact / Conditions / Complexity indicators →
  get the 0–5 Severity score + class, with the breakdown shown.
- Visualize a few worked example crises so the module isn't empty without live data.
- Links back to Risk via the `baseline_inform_risk` indicator the engine already supports.

---

## 5. Phased execution (each phase builds + tests pass)

**Phase 0 — Safety net**
- Branch `lean-rebuild`. Run the suite; confirm `excelParity` + engine tests green.
- Create `_archive/` and add it to the build's ignore (Vite won't bundle it).

**Phase 1 — Carve the 3-route shell**
- Rewrite `App.jsx` routing to exactly: `/education`, `/risk`, `/severity` (+ redirect
  `/` → `/education`). New minimal top nav (3 items + language toggle).
- Move every non-core area into `_archive/` (Warning, Climate, admin, dashboard,
  data-entry, auth, extra charts, supabase services). Fix imports. **App builds, 3
  modules reachable.** ← first shippable lean cut.

**Phase 2 — Curated dataset**
- Convert the Tanzania Excel to `src/data/tanzania-inform.json` (build-time script,
  using the existing `EXCEL_CODE_MAP`). Thin loader replaces the old data services.
- Risk reads only this. Delete the approved-committee-merge path.

**Phase 3 — Polish Risk** (spec 4.2): map + drill-down + calculator; verify parity.

**Phase 4 — Polish Severity** (spec 4.3): calculator + sample scenarios.

**Phase 5 — Polish Education** (spec 4.1): 7 lessons + quizzes + indicator guide +
"see the math" panel.

**Phase 6 — Strip & shrink**
- Remove now-unused npm deps (leaflet extras, unused chart libs, supabase-js if auth
  archived). Measure bundle. Final QA pass on the 3 modules in the browser.

---

## 6. Definition of done
- Exactly **3 modules**, 3 nav items, no dead links, no login wall.
- Risk & Severity numbers **match the Excel parity test**.
- A newcomer understands each module in under a minute.
- Bundle and file count cut by the large majority.
- Archived features sit in `_archive/` (+ the Supabase backend preserved) ready for a
  future multi-user phase.

---

## 7. Decisions resolved
- **Login removed — public tool (confirmed 2026-05-30).** Auth/roles archived; quiz
  progress in `localStorage`.
