# Changelog

## Unreleased

### What to do: the Risk Action Guide Book

Every area now says what people can do about its hazards, from the Risk Action Guide Book (based on the
National Disaster Management Strategy 2022 to 2027 and the National Disaster Preparedness and Response
Plan 2022), in English and Kiswahili as the guide publishes it.

- **A "What to do" section on every area profile**, second after the overview:
  - the emergency numbers (190 Emergency, 114 Fire and Rescue) as tap-to-call links;
  - **Know your risk**: where the danger lies in the council and what helps, as the guide states it (a
    region or source unit lists each of its councils, with links to their profiles);
  - **When a warning is issued**: the hazards the guide documents for the area first and any other
    hazard one step away; for each of the three alert levels (Advisory: be prepared, Warning: take
    action, Major warning: take action immediately), what people may see and what to do. Tabora's
    councils lead with their own council plan;
  - **Incidents and accidents**: the guide's rapid-response actions, folded until opened (all open when
    printing).
- **In the risk explorer**, the area panel shows the local advice and the main hazards, with a link
  straight to the full guidance on the profile (`/area/<id>#actions`).
- All 195 councils are covered (councils the guide names by an older name, such as Ilala or Kilombero,
  are matched to their current names). The guide's per-council alert tables are not shown: their
  generated sentences repeat one flood template and differ between English and Kiswahili, so the
  national hazard tables are used, except for Tabora's hand-written council plans.
- The guidance loads on demand (one small file per region and per hazard); the first page load is
  unchanged. Data: `python scripts/build-action-guide.py` from `data-source/RISK_ACTION_GUIDE_BOOK_0222.docx`.

### Explorer: indicator groups under their dimension

- Choosing Hazard & Exposure, Vulnerability or Lack of Coping Capacity lists that dimension's
  indicator groups right under it, by category, each with its score for the selected area. Choosing a
  group colours the map by it and keeps the list open, so moving to the next group is one click. On
  phones the groups are a second row of chips under the lens tabs. This replaces the separate
  indicator search.

### Institutional data workflow

Data entry now runs through the institutions that own the data, in the figures they already publish.

- **Every indicator has a responsible institution.** Reviewers assign each of the 78 workbook
  indicators (53 in the INFORM score, 25 advanced) to a Tanzanian institution or a global source, in
  bulk or with suggested owners, and send update or validation requests with a due date and a message.
- **Institutions enter measured figures, not scores.** An officer sees their institution's indicators
  and open requests, and enters figures in natural units for the whole country, any region and any
  council, typed or pasted from a spreadsheet (names matched, header rows skipped, "n/a" read as no
  data). A live 0–10 preview and range checks catch unit mistakes; the dataset is required. They can
  also confirm that the current values still hold.
- **Data at any level.** For each council the most local figure applies (council, else its region, else
  the country, else the INFORM baseline) and only indicator groups with a new figure are recomputed,
  with the workbook's own standardisation and weights.
- **Review with consequences in view.** Reviewers see today's value and where it comes from, the
  proposal, the 0–10 scores and the councils whose scores would move, then approve or reject. Approved
  figures can be reverted one area at a time.
- **Sources everywhere.** Tables say whether each source is a Tanzanian institution or a global dataset,
  and area profiles list the figures behind a recomputed score with the level they were recorded at.
- **People.** Administrators set each person's role and institution in the portal.
- Database: migrations `0004_data_workflow.sql` and `0005_one_live_request.sql` (row-level security;
  every change goes through functions that re-check the caller's role and institution).

### Other changes

- No em dashes anywhere in the site, the documents or the code comments; missing values read "n/a".
- Night mode: text on green and red buttons (Approve, Revert) meets contrast requirements.
- The Data portal's tab row no longer shows a stray scrollbar on Windows.
- `npm run dev:demo` runs the browser-only demo alongside a configured backend.

## 2.0.0: Advanced rebuild (2026-09)

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

### Data corrections

- **Census population for three councils.** The climate pipeline's name matcher missed Ilala
  (Dar es Salaam City), Mwanza City and Busokelo and fell back to area-apportioned estimates
  (e.g. Mwanza City 58,096 instead of 594,834). All 195 councils now carry the NBS 2022 figures
  (total 61,741,120 = the official PHC total) and exposure is recomputed
  (`scripts/fix-council-population.py`). Exposure index: Mwanza City 5.3 → 8.2, Dar es Salaam City
  8.2 → 8.6, Busokelo 3.3 → 4.3; no risk class changed.
- **Region facilities** no longer double-count districts that were split into several councils.
- Removed `subnational.adm1`, a stale, unused per-region copy of the district data (every record
  differed from the canonical `adm2`).
- Documented a drought-season artefact in bimodal highlands (Lushoto = 10.0).

### Platform

- TypeScript (strict), Tailwind CSS v4, Radix UI, React Router 7, TanStack Query, Recharts, Motion.
- Engine ported to TypeScript with all golden tests (8,664/8,664 standardised workbook values; full
  raw → risk pipeline for all 170 units; workbook cell parity) plus model, severity and UI tests.
- Data layer with two backends: browser-local demo mode (clearly labelled; migrates old edits) and
  Supabase (accounts, roles, approval queue, audit log, row-level security, server-side approval).
- Installable, offline-capable app (PWA): the app and data work without a connection once visited.
- Code-split routes and vendor chunks; translations loaded per page and language; map boundaries
  fetched per level; Supabase SDK loaded only when configured. First load: 134 KB gzip of app code
  (the old app shipped a single 2.1 MB bundle).
- Accessibility: axe-core WCAG 2.1 AA audit of every page in both themes: no serious or critical
  violations; keyboard navigation; labelled controls; no horizontal overflow at 360 px.
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
