# Changelog

## 2.0.0 — Advanced rebuild (2026-09)

A ground-up rebuild of the web app on a typed, tested foundation, with a new design, English/Kiswahili,
day/night themes, a shared data backend and several methodological corrections.

### Methodology corrections

- **Per-dimension class thresholds.** Hazard, Vulnerability and Lack of Coping Capacity are classified
  with their own thresholds from the workbook's `Thresholds` sheet (e.g. Hazard 1.3 / 2.0 / 3.3 / 4.7).
  Previously every dimension was coloured with the risk thresholds, which misclassified most of them.
- **Edits now propagate everywhere.** Council risk is computed live as ∛(H × V × LCC) (it equals the
  stored value for all 195 councils when nothing is edited), so approved data changes reach the council
  map, regions and every sibling council that shares a source unit. Previously council hazard and risk
  were frozen and ignored edits.
- **Regions aggregate from councils** with the INFORM method (indicator means → categories → scaled
  geometric mean → cube root). Relative to the previous source-unit aggregation, 8 of 31 regions move
  by ±0.1 (Morogoro, Pwani, Mtwara, Iringa, Rukwa, Njombe +0.1; Mbeya, Shinyanga −0.1); none by more. Dar es Salaam's council-to-region name join is fixed.
- **Dimension totals can no longer be overridden** by hand; they are always derived from indicators.
- **Crisis severity follows the official INFORM Severity Index method** (JRC/ACAPS 2020): Severity =
  70% × G(Impact ⅓, Conditions ⅔) + 30% × Complexity, with INFORM's inverted weighted geometric
  aggregation, the official category structure, categories by ROUNDUP (Very low, Low, **Medium**, High,
  Very high) and a separate reliability index. The previous calculator used a plain average and a
  non-standard class scale ("Extreme", no "Medium").
- **Single source of truth for numbers.** The course, home page and profiles read the model; the old
  hard-coded national score (4.2) and course-specific class bands are gone. The national value is the
  official INFORM figure (4.1).
- Indicator lenses use an absolute 0–10 colour ramp instead of relative quintiles, so maps are
  comparable across indicators.

### Platform

- TypeScript (strict), Tailwind CSS v4, Radix UI, React Router 7, TanStack Query, Recharts, Motion.
- Engine ported to TypeScript with all golden tests (8,664/8,664 standardised workbook values; full
  raw → risk pipeline for all 170 units; workbook cell parity) plus model, severity and UI tests.
- Data layer with two backends: browser-local demo mode (clearly labelled; migrates old edits) and
  Supabase (accounts, roles, approval queue, audit log, row-level security, server-side approval).
- Installable, offline-capable app (PWA): the app and data work without a connection once visited.
- Code-split routes and vendor chunks (the old app shipped a single 2.1 MB bundle).
- Security headers (CSP, HSTS, frame denial), CI quality gate (typecheck, lint, tests, build);
  Vercel is the single host. Obsolete GitHub Pages / Netlify / self-host configs archived.

### New experience

- Home, Risk explorer (shareable URL state, compare, ranking table, CSV), Area profiles (print-ready),
  Insights (national analytics with PNG/CSV export), Crisis severity (council picker using census
  population and area), Learn (7 lessons, quizzes, progress saved), Methodology (live worked example,
  source register, limitations), Data portal (scores, measured values, bulk paste, review, audit).
- Full English and Kiswahili; day, night and system themes; ⌘K search for any council or region.

### Housekeeping

- Previous UI archived in `_archive/lean-v1`; stale 2024 specification documents and deployment
  guides archived in `_archive/docs-v1` and `_archive/ops-v1`.
