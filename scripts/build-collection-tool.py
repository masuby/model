#!/usr/bin/env python3
"""
build-collection-tool.py - generate the ONE shared INFORM Tanzania data-collection workbook (NORMAL / v1).

Sent to all sectors. Each finds its rows (filter the Sector column), fills the ACTUAL VALUE in the
indicator's own unit, and the LOCKED standardisation formula shows the 0-10 live - exactly the proven
standardise() (denominator None here, optional log, min-max vs the FROZEN reference, Decrease inversion,
clamp, Excel ROUND). Unfilled rows are fine (the engine uses the foundation / skips them). Only the
ACTUAL VALUE column is unlocked; everything else is protected so the standardiser stays consistent.

The ADVANCED version (v2) is the same tool with extra sector sub-indicator rows (SPEI, soil moisture,
water levels, biomass) in a research tab - built later, on top of this.

Output: public/INFORM_TZ_Collection_Tool.xlsx  (downloadable from the site to send to sectors).
"""
import json, os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.protection import SheetProtection

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = json.load(open(os.path.join(ROOT, 'src/data/inform-indicator-spec.json')))

# responsible Tanzanian sector per component (who fills it locally). Global-foundation indicators are
# pre-filled by the centre; here we tag the sector that would provide LOCAL data.
def norm(s): return ''.join(ch for ch in str(s).lower() if ch.isalpha())
SECTOR = {
    'drought': 'TMA', 'flood': 'PMO-DMD', 'earthquake': 'TMA/GST', 'environmentaldegradation': 'NEMC',
    'soilerosion': 'NEMC', 'wildfire': 'TFS/TMA', 'stormscyclone': 'TMA', 'volcano': 'TMA/GST',
    'coastalhazards': 'TMA', 'landslide': 'TMA', 'conflictrisk': 'PMO-DMD', 'conflictintensity': 'PMO-DMD',
    'internalviolence': 'TPF/PMO-DMD',
    'developmentpoverty': 'NBS', 'economicdependency': 'NBS/MoFP', 'habitat': 'NBS', 'livelihoods': 'MUCHALI/IPC',
    'displacedpeople': 'UNHCR/PMO-DMD', 'healthconditions': 'MoH', 'childrenhealthandnutrition': 'MoH/TFNC',
    'accesstohealthcare': 'MoH', 'economiccapacity': 'NBS/MoFP', 'wash': 'MoW', 'communication': 'TCRA',
    'education': 'MoEST/NBS', 'drrimplementation': 'PMO-DMD', 'governance': 'PMO-DMD',
}
def sector_of(component): return SECTOR.get(norm(component), 'INFORM (global)')

# Tool rows: ALL used indicators - exactly the regional INFORM set, UNTAMPERED. The formula reproduces the
# hidden sheets faithfully (cap -> transform None/Log/Exp -> min-max -> sign -> clamp -> ROUND), wrapped in
# IFERROR -> "No data" exactly as the workbook, so degenerate cases (health-facility density custom[0,0])
# show "No data" like INFORM rather than being dropped.
rows = [s for s in SPEC.values() if s['use'] == 'Yes']
order = {'Hazards & Exposure': 0, 'Vulnerability': 1, 'Coping Capacity': 2}
rows.sort(key=lambda s: (order.get(s['dimension'], 9), s['category'], s['component'], s['name']))

wb = openpyxl.Workbook()

# ---- Sheet 1: How to use ----
how = wb.active; how.title = 'How to use'
how.sheet_view.showGridLines = False
intro = [
    ('INFORM Tanzania - Data Collection Tool (NORMAL / v1)', 14, True),
    ('', 10, False),
    ('1.  Filter the "Sector" column on the Data Entry sheet to find YOUR indicators.', 11, False),
    ('2.  For each, type the ACTUAL VALUE in its own unit (e.g. 18 for 18% underweight, 11 for an', 11, False),
    ('     11-year drought frequency, a count of displaced people). The unit is shown on each row.', 11, False),
    ('3.  The "0-10 (auto)" column standardises it instantly - exactly as the official INFORM workbook.', 11, False),
    ('     You never invent a score; the tool computes it. These cells are locked.', 11, False),
    ('4.  Leave rows you do not have data for BLANK - the model uses the foundation value, nothing breaks.', 11, False),
    ('5.  Save and send the file back. The centre reads only the 0-10 values; your raw stays with you.', 11, False),
    ('', 10, False),
    ('Reference = the fixed Min/Max the value is scaled against (frozen, so a value means the same at', 10, False),
    ('district, region, country, or village). Direction "protective" means higher is better (inverted).', 10, False),
    ('Only the ACTUAL VALUE column is editable. The ADVANCED version adds research rows (SPEI, soil', 10, False),
    ('moisture, water levels...) for sectors to refine an indicator beyond the legacy single source.', 10, False),
]
for i, (txt, sz, bold) in enumerate(intro, 1):
    c = how.cell(i, 1, txt); c.font = Font(size=sz, bold=bold, color='1F3A5F' if bold else '000000')
how.column_dimensions['A'].width = 100

# ---- Sheet 2: Data Entry ----
ws = wb.create_sheet('Data Entry')
ws.sheet_view.showGridLines = False
headers = ['Sector', 'Dimension', 'Component', 'Indicator', 'Unit', 'Level', 'Transform',
           'Ref Min', 'Ref Max', 'Direction', 'ACTUAL VALUE', '0-10 (auto)']
HEAD = PatternFill('solid', fgColor='1F3A5F'); thin = Side(style='thin', color='D0D7E2')
for j, h in enumerate(headers, 1):
    c = ws.cell(1, j, h); c.font = Font(bold=True, color='FFFFFF', size=10)
    c.fill = HEAD; c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    c.border = Border(left=thin, right=thin, top=thin, bottom=thin)

INPUT = PatternFill('solid', fgColor='FFF7E6'); AUTO = PatternFill('solid', fgColor='EAF3EA')
for i, s in enumerate(rows, start=2):
    direction = 'protective' if str(s['sign']).startswith('Dec') else 'risk'
    vals = [sector_of(s['component']), s['dimension'], s['category'] + ' / ' + s['component'], s['name'],
            s.get('unit') or 'value', s.get('keyed_at') or '', s.get('transform') or 'None',
            s.get('resolved_min'), s.get('resolved_max'), direction]
    for j, v in enumerate(vals, 1):
        c = ws.cell(i, j, v); c.font = Font(size=10); c.border = Border(left=thin, right=thin, top=thin, bottom=thin)
    # ACTUAL VALUE (unlocked input)
    cin = ws.cell(i, 11); cin.fill = INPUT; cin.protection = openpyxl.styles.Protection(locked=False)
    cin.border = Border(left=thin, right=thin, top=thin, bottom=thin)
    # 0-10 (locked formula) - the standardiser, in Excel, referencing this row's ref/transform/direction
    g, h, k, sgn = f'G{i}', f'H{i}', f'I{i}', f'J{i}'  # transform, min, max, direction
    av = f'K{i}'
    # outlier cap (Tukey fence), embedded per row for the few indicators with outlier detection on
    if s.get('outlier') == 'Yes' and isinstance(s.get('fence_lo'), (int, float)) and isinstance(s.get('fence_hi'), (int, float)):
        av = f'MAX(MIN(K{i},{s["fence_hi"]}),{s["fence_lo"]})'
    x = f'IF({g}="Logarithm",LN(0.001+{av}),IF({g}="Exponential",EXP({av}),{av}))'  # transform None/Log/Exp
    base = f'10*(({x})-{h})/({k}-{h})'                   # min-max
    expr = f'IF({sgn}="protective",10-{base},{base})'    # Decrease inversion
    formula = f'=IF(K{i}="","",IFERROR(MAX(0,MIN(10,ROUND({expr},1))),"No data"))'
    cf = ws.cell(i, 12, formula); cf.fill = AUTO; cf.font = Font(size=10, bold=True, color='1F6F3D')
    cf.border = Border(left=thin, right=thin, top=thin, bottom=thin)

ws.freeze_panes = 'A2'
ws.auto_filter.ref = f'A1:L{len(rows) + 1}'
widths = [16, 18, 30, 30, 12, 10, 11, 9, 9, 11, 14, 11]
for j, w in enumerate(widths, 1):
    ws.column_dimensions[openpyxl.utils.get_column_letter(j)].width = w
# protect everything except the ACTUAL VALUE column
ws.protection = SheetProtection(sheet=True, autoFilter=False, formatCells=False, selectLockedCells=True, selectUnlockedCells=True)

out = os.path.join(ROOT, 'public/INFORM_TZ_Collection_Tool.xlsx')
wb.save(out)
print('wrote', out)
print('indicators (rows):', len(rows))
from collections import Counter
print('by sector:')
for k, v in Counter(sector_of(s['component']) for s in rows).most_common():
    print('  %-16s %d' % (k, v))
