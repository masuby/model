# INFORM Tanzania — Frontend guide

How the web app is put together, and the rules every page follows. Read this before adding a feature.

## Stack

React 19 · TypeScript (strict) · Vite 7 · Tailwind CSS v4 · Radix UI (via `radix-ui`) · React Router 7 ·
TanStack Query · Zustand · i18next · Recharts 3 · Leaflet / react-leaflet · Motion · Supabase (optional).

## Layout of `src/`

```
app/            App.tsx (router, providers), layout/ (AppShell, header, footer, theme, language, ⌘K search)
components/
  ui/           design-system primitives: Button, Card, Badge, primitives.tsx (Tabs, Select, Tooltip,
                Dialog, SheetContent, DropdownMenu, Popover, Switch, Slider, Segmented, Progress, Input…)
  layout/       Page.tsx → PageContainer, PageHeader, SectionHeading, Stat
  risk/         ClassBadge, ClassDot, ScoreGauge, ClassLegend, RampLegend, DimensionBars, ScoreBar
  map/          RiskMap (the only Leaflet map — lazy-load it with React.lazy)
  charts/       ChartCard (PNG/CSV export), theme.tsx (useChartTheme, ChartTooltip, DIMENSION_COLORS)
data-layer/     DataProvider (useModel, useData, useSubmit, useReview…), local + Supabase repositories
engine/risk/    INFORM Risk engine: math, classes, hierarchy, standardise, model, metrics, sources
engine/severity INFORM Severity Index engine: definitions, engine, scenarios
features/<x>/   one folder per page (owns its components)
i18n/           i18next setup + locales/<en|sw>/<namespace>.json
state/prefs.ts  theme, language, learning progress (persisted)
```

## Non-negotiable rules

1. **Every user-visible string is translated.** Add keys to `src/i18n/locales/en/<ns>.json` **and**
   `src/i18n/locales/sw/<ns>.json` (natural Kiswahili, not word-for-word). Use `useTranslation('<ns>')`.
   Shared words live in `common` (classes, dimensions, categories, levels, actions, labels);
   indicator names/descriptions in `indicators` (`t('indicators:flood')`, `t('indicators:desc.flood')`).
2. **Never hard-code INFORM numbers or classes.** Read them from the model (`useModel()`), classify with
   `classify(value, scale)` from `@/engine/risk/classes`. Each dimension has its OWN thresholds
   (`scale = 'hazard' | 'vulnerability' | 'coping' | 'risk'`).
3. **Day and night.** Use semantic tokens only: `bg-background`, `bg-card`, `bg-muted`, `bg-elevated`,
   `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`, `bg-primary/10`,
   `text-success|warning|danger`. Never raw `bg-white`/`text-gray-*`. Charts use `useChartTheme()`.
4. **Accessible.** Radix primitives for interactive widgets; buttons have labels; icons in buttons get
   `aria-label` when there is no text; colour is never the only signal (pair with text/score).
5. **Responsive.** Mobile first; check 375 px, 768 px and 1440 px layouts. Use `PageContainer`.
6. **Typed.** No `any`. `npx tsc -p tsconfig.app.json --noEmit` and `npx vitest run` must pass.
7. **Honest.** Illustrative content is labelled as such; data provenance is shown where values appear.

## Visual language

- Cards: `Card` (rounded-2xl, soft shadow). Sections: `SectionHeading` with an eyebrow.
- Headline numbers: `font-display font-extrabold num` (tabular numerals).
- Scores always with one decimal via `formatScore`; populations via `formatNumber`/`formatCompact`.
- Class colours via `ClassBadge`/`ClassDot`; the INFORM ramp is green → yellow → red.
- Motion: subtle `motion` fade/slide on section entry; respect reduced motion (global CSS handles it).
- Icons: `lucide-react`, size 4 (16 px) in buttons.

## Engine API (quick reference)

```ts
const model = useModel();                 // RiskModel with approved edits applied
model.councils / regions / sources / national; model.byId.get(id)
unit.dims.hazard.score; unit.dims.hazard.categories.natural.indicators.flood; unit.risk
parseMetric('risk' | 'dim:hazard' | 'ind:hazard:flood') → { get(u), classOf(v), scale, labelKey }
metricColor(metric, value)                // map/table colour
topDrivers(unit, n, dim?), dataCoverage(unit), indicatorValue(unit, dim, key)
DIMENSIONS / ALL_INDICATORS (hierarchy), sourceFor(dim, key), sourceLabel(src), AUTHORITIES
computeFromRaw(rawById) / standardise(raw, spec) / SPECS / usedSpecs()
computeSeverity(input) → { severity, category, level, dimensions tree, indicators, reliability }
```

Unit ids: councils `C001…`, regions `R-<placekey>`, INFORM source units `TZ0101…`, national `TZ`.
Routes: `/area/:id` renders any unit's profile.
