# Risk communication from the Risk Action Guide Book

Design of 14 October 2026, built the same day. The Guide Book (`docs/RISK_ACTION_GUIDE_BOOK_0222.docx`,
PMO-DMD) is the source of everything the system says about what a risk means for people and what to do;
the INFORM model stays untouched and decides which of the book's statements apply to an area.

## 1. Decision: standing actions, in INFORM's terms

PMO-DMD's decisions of 14 October 2026:

- The system communicates in INFORM's own terms, the risk class ("Medium risk, 3.8 out of 10"). The
  book's level words (advisory, warning, major warning) and colour names are never shown, and no warning
  is derived from the class.
- What the system says to do is what people should **always** be doing about the risks present: actions
  that address the risk all year, at home, on the farm and the water, in the committees and in the
  council. Nothing reads like a warning or a forecast in force; a warning is a separate record the
  committees publish, with its own validity, and the book's warning tables (chapters 1.0 to 9.0) are not
  shown as risk communication.

The book's chapter 13.0, Standing actions by hazard (added 14 October 2026), carries these actions: for
each of the nine hazards, rows by who (households; farmers, herders, fishers; village, mtaa and ward
committees; council and sectors) and, where the hazard's risk is high, the rows that go further.

How the scores select what is shown (the hazard list's display rule, D7: under 4, 4 to under 6, 6 and
above):

| A hazard or group's own score | Shown |
|---|---|
| under 4 | the hazard's standing actions |
| 4 to under 6 | the hazard's standing actions; a vulnerability or coping group's statement and actions |
| 6 and above | the hazard's standing actions and those for high risk; a group's statement and actions |

A row for the coast (tsunami) shows on the coast only. The class thresholds are the SADC workbook's and
do not change; the map keeps the palette of 11 October. The two standing messages of the area's class
(for those who live here, for those who plan here) stay as they were.

## 2. Content: what the book provides

All of it bilingual, extracted by `scripts/build-action-guide.py` from the book in `data-source/`:

- **Hazards (chapters 1.0 to 9.0)**: the warning-level tables (`hazards/<hazard>.json`), kept for the
  warnings the committees publish, not shown as risk communication.
- **Incidents (10.0)**: the rapid-response guide (`incidents.json`).
- **Vulnerability (11.0) and Lack of Coping Capacity (12.0)**: per INFORM group, what the indicator
  measures and what a high score means, the lead sectors, and rows of what helps (`indicators/<group>.json`).
- **Standing actions by hazard (13.0)**: per guide hazard, the rows by who, and the rows for high risk
  (`standing/<hazard>.json`, with `high` and `coastal` flags).
- **Regions (14.0)**: each council's documented hazards and "Know your risk" statements (`regions/`).

The crosswalk (`src/features/guide/crosswalk.ts`) ties the model's hazard groups to the guide's hazards.

## 3. Where it shows

Every surface names the INFORM class, in the reader's language, with the book's own words and no
stories:

| Surface | Class | Standing actions by hazard | Vulnerability and coping |
|---|---|---|---|
| Explorer panel, Risk communication | the class badge and the two standing messages | "What to always do": a chip per hazard present (colour and score, the highest chosen first); the chosen one's rows | "What makes the difference here": a chip per group scoring medium or above; the chosen one's rows |
| Profile | same | the same choosers, folded | the same, with what the group measures and the library's entry |
| One-page risk card | the class badge | top three hazards, one row each | the groups scoring high or above, one row each |
| Detailed risk card | the class badge | every high-scoring hazard group, its rows | every high-scoring group: the book's rows and the committee's library entry when there is one |
| Methodology, Classification | the table of section 1 | | |

## 4. Management: the library in the Data portal

Rows live in two layers: the book (shipped with the site, rebuilt when the book changes) and the
committee records on top of it. A record of kind `guidance` with `topic: 'action'` holds one row:

```
{ topic: 'action', group: 'hazard:flood' | 'vulnerability:livelihoods' | ..., hazard?: 'floods',
  level: null (holds everywhere) | 2 (from medium up) | 3 (high and very high), impact: {en, sw} (who),
  actions: {en: [], sw: []},
  replaces: <book row index> | null }
```

- National rows (unit `TZ`) are written by PMO-DMD, the NDRRC or an administrator and reviewed by the
  NDRRC (as the vulnerability-and-coping library is today); council rows by the council's DDRRC, reviewed by
  the RDRRC; region rows by the RDRRC, reviewed by the NDRRC.
- A row with `replaces` stands in place of that book row; without it, it is added after the book's rows.
- The desk (Data portal → Committee desk → "Standing actions") offers the form: scope, hazard or
  group, where it holds (everywhere, from medium up, at high and very high), who and the actions in both
  languages, the book row it replaces, the source. A row is a standing action, never a warning. The Data
  management tab shows the library's state: book rows and committee rows per level.
- Reviewed records are published at once on every surface; the audit log records them as any committee
  record. No database change is needed: the rows use the existing `committee_records` table, which the live
  database receives with migrations 0006 to 0017.

## 5. Build order

1. The new book replaces the copy in `data-source/`; the build script learns chapters 11.0 and 12.0; the
   hazard, region and incident files are rebuilt from it.
2. The correlation: the mapping and the group rule; tests and the Methodology table.
3. Assembly: `src/features/guide/actions.ts` merges book rows, council rows and committee rows per hazard
   and per group at a level.
4. Surfaces: panel, profile, both cards.
5. Desk form and the management view.
6. Tests, documentation, release notes; verified on the preview and live.
