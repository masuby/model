# INFORM Tanzania — design language

**Editorial and institutional.** The site should read like a well-made statistical report (think
national statistics offices, The Economist data pages, Our World in Data): content first, structure made
with typography, whitespace and hairline rules — not with boxes, gradients or decoration.

If a pattern is common on AI-generated landing pages, it is probably wrong here.

## 1. Surfaces — few boxes

- The page is the surface. Group content with **section rules** (`border-t border-border`), columns,
  headings and whitespace.
- **Never** lay out static content as a grid of three or more cards. Use instead:
  - a **divided list** (`divide-y divide-border`, rows with generous padding),
  - **columns separated by vertical rules** (`divide-x divide-border` on `md+`),
  - a **definition list** (`<dl>` with label/value rows),
  - a plain **table**.
- A bordered box (`Card`) is allowed only for: an interactive tool or form panel, a floating overlay on a
  map, dialogs/popovers/menus, and at most **one** deliberately highlighted element in a section.
- Boxes are flat: `border border-border bg-card rounded-lg`, **no shadow**. Shadows are reserved for
  things that float (popovers, menus, map overlays, dialogs).
- Radius is small: 6–10 px. Fully rounded pills only for INFORM class badges and tiny status tags.

## 2. Colour encodes data, nothing else

- Colour means something: INFORM classes, dimensions in charts, state (error/success).
- **Banned:** decorative gradients, blurred colour orbs, dotted/grid backgrounds, glass/frosted panels,
  coloured strips or "banners" on top of boxes, tinted icon tiles, gradient text, glowing rings,
  pulsing "live" dots.
- Brand blue is for links, the primary button and the active navigation state only.

## 3. Typography

- Headlines (`h1`, `h2`, large figures in heroes): **Source Serif 4** (`font-display`), semibold, tight.
- Everything else, including numbers and tables: **Inter** with tabular numerals (`num`).
- **No uppercase letter-spaced "eyebrow" labels** (`uppercase tracking-wider`). If a small label is
  needed, use plain sentence case, `text-sm text-muted-foreground`, or a section number ("2 · Regions").
- Table column headers: sentence case, `text-xs font-medium text-muted-foreground`.

## 4. Figures and numbers

- Key numbers sit in a **row of figures separated by vertical rules** (`KeyFigures`), each a large number
  with a short label beneath. No box per number.
- Scores always one decimal (`formatScore`); class shown with `ClassBadge` or a `ClassDot` + word.

## 5. Icons

- Functional only: inside buttons, inline with a status, in inputs. No decorative icons next to every
  heading, list item or card.

## 6. Motion

- No scroll-reveal or entrance animations. Only state transitions (hover, expand/collapse, tab change),
  ≤ 150 ms. Respect reduced motion.

## 7. Charts, tables, maps

- A chart sits directly on the page under a title row (title, one-line caption, export menu) with a
  hairline above it (`ChartCard`) — not inside a card.
- Tables: hairline rows, no zebra, sticky header where long, numbers right-aligned.
- Maps: a floating legend panel (small, bordered, solid background) is fine; nothing else floats.

## 8. Notes and callouts

- A note is a paragraph with a left rule (`border-l-2 border-border pl-4`) or a single line of muted
  text — not a coloured box. Warnings may use `border-l-2 border-warning`.

## Building blocks

`Card` (flat), `ChartCard` (a figure: title row over a hairline, no box), `KeyFigures` (numbers with
vertical rules), `Section` + `SectionHeading` (rule + serif title + lead), `PageHeader` (plain title block),
`Kicker` (plain small label), `Note` (left-rule note), `StaticMap` (lightweight SVG choropleth for
non-interactive or click-only maps) and `RiskMap` (Leaflet, for pan/zoom exploration only).
