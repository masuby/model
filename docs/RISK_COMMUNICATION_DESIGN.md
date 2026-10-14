# Risk communication from the Risk Action Guide Book

Design of 14 October 2026, built the same day. The Guide Book (`docs/RISK_ACTION_GUIDE_BOOK_0222.docx`,
PMO-DMD) is the source of everything the system says about what a risk means for people and what to do;
the INFORM model stays untouched and decides which of the book's statements apply to an area.

## 1. Decision: the book's three levels follow the INFORM risk class

PMO-DMD's decision of 14 October 2026 (it replaces the rule of 11 October that no level wording appears
with a risk class):

| INFORM risk class    | Guide Book level | Colour            | Name (EN / SW)               | Call (EN / SW)                                      |
|----------------------|------------------|-------------------|------------------------------|-----------------------------------------------------|
| Very low, Low        | Level 1          | Yellow / Njano    | Advisory / Tahadhari         | Be prepared / Jiandae                               |
| Medium               | Level 2          | Orange / Machungwa| Warning / Onyo               | Take action / Chukua hatua                          |
| High, Very high      | Level 3          | Red / Nyekundu    | Major warning / Onyo kuu     | Take action immediately / Chukua hatua mara moja    |

The class thresholds are the SADC workbook's (risk 2.5 / 3.4 / 4.3 / 5.9) and do not change. The five
map colours stay a ramp from pale yellow to deep red, nested in the three level colours: very low and low
in yellows, medium the orange, high and very high in reds (the "high" step moves from deep orange to red
so that the map and the level badge belong to the same colour family).

The same three levels apply to **one indicator group** by its own score, with the hazard list's display
rule (decision D7: under 2 very low, 2 to 4 low, 4 to 6 medium, 6 to 8 high, 8 and above very high):
very low and low are Level 1, medium Level 2, high and very high Level 3. So a Medium-risk council whose
drought scores 9.4 shows the Level 3 drought actions and the Level 1 wildfire actions: when a value
reaches a level, the specific action changes with it.

A published warning (a committee record of kind `warning`) remains a separate thing: it has its own
level, areas and validity and is shown while in force. The level shown with the risk class is the standing
level of the area; the Methodology page says so.

## 2. Content: what the book provides

All of it bilingual, extracted by `scripts/build-action-guide.py` from the book in `data-source/`:

- **Hazards (chapters 1.0 to 9.0)**: for each guide hazard, three levels of IMPACT → ACTION rows
  (`src/data/action-guide/hazards/<hazard>.json`). Tabora's councils carry their own rows.
- **Incidents (10.0)**: the rapid-response guide (`incidents.json`).
- **Vulnerability (11.0) and Lack of Coping Capacity (12.0)**, new on 14 October: for each INFORM group a
  statement of what the indicator measures and what a high score means, the lead sectors, and IMPACT →
  ACTION rows that hold at every level (`src/data/action-guide/indicators/<group>.json`).
- **Regions (13.0)**: each council's documented hazards and "Know your risk" statements (`regions/`).

The crosswalk (`src/features/guide/crosswalk.ts`) ties the model's hazard groups to the guide's hazards.

## 3. Where it shows

Every surface names the class and the level together (colour is never the only signal), in the reader's
language, with the book's own words and no stories:

| Surface | Level | Hazard actions | Vulnerability and coping |
|---|---|---|---|
| Explorer panel, Risk communication | class badge + level badge, the two standing messages | the area's top three hazards, each at its own level: three rows, fold to all | the groups at Level 2 or 3: one row each, fold to all |
| Profile, Risk communication and hazard list | same | each hazard in the list carries its level and its rows (folded) | "Reducing risk" carries the book's rows for the groups at Level 2 or 3 |
| One-page risk card | level badge beside the class | top three hazards, two rows each | the groups at Level 3, one row each |
| Detailed risk card | level badge in the header | every hazard group listed, all rows at its level | every high-scoring group: the committee's library entry when there is one, else the book's rows |
| Methodology, Classification | the mapping table of section 1 and the group rule | | |

Council-specific rows (Tabora) replace the national rows of the hazard. Rows that only say "keep following
updates" stay out, as before.

## 4. Management: the library in the Data portal

Rows live in two layers: the book (shipped with the site, rebuilt when the book changes) and the
committee records on top of it. A record of kind `guidance` with `topic: 'action'` holds one row:

```
{ topic: 'action', group: 'hazard:flood' | 'vulnerability:livelihoods' | ..., hazard?: 'floods',
  level: 1 | 2 | 3 | null (every level), impact: {en, sw}, actions: {en: [], sw: []},
  replaces: <book row index> | null }
```

- National rows (unit `TZ`) are written by PMO-DMD, the NDRRC or an administrator and reviewed by the
  NDRRC (as the vulnerability-and-coping library is today); council rows by the council's DDRRC, reviewed by
  the RDRRC; region rows by the RDRRC, reviewed by the NDRRC.
- A row with `replaces` stands in place of that book row; without it, it is added after the book's rows.
- The desk (Data portal → Committee desk → "Risk communication") offers the form: scope, indicator group
  or hazard, level, impact and actions in both languages, the book row it replaces, the source. The Data
  management tab shows the library's state: book rows and committee rows per level.
- Reviewed records are published at once on every surface; the audit log records them as any committee
  record. No database change is needed: the rows use the existing `committee_records` table, which the live
  database receives with migrations 0006 to 0017.

## 5. Build order

1. The new book replaces the copy in `data-source/`; the build script learns chapters 11.0 and 12.0; the
   hazard, region and incident files are rebuilt from it.
2. Levels: the mapping, the names, the palette step, the group rule; tests and the Methodology table.
3. Assembly: `src/features/guide/actions.ts` merges book rows, council rows and committee rows per hazard
   and per group at a level.
4. Surfaces: panel, profile, both cards.
5. Desk form and the management view.
6. Tests, documentation, release notes; verified on the preview and live.
