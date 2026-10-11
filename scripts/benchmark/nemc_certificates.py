#!/usr/bin/env python3
"""NEMC environmental certificates (EIA and environmental audit) for the Benchmark 2026 hazardous-material indicator.

NEMC publishes every month the list of the environmental certificates it issued, with the project, its owner, its
location (plot, ward, council, region) and the registration number. The lists in text form on www.nemc.or.tz
(Matangazo) cover July, August and September 2026:
  https://www.nemc.or.tz/uploads/announcements/6a6c503e79a22.pdf   July 2026 (also uploaded as 6a6c503e79ef7.pdf)
  https://www.nemc.or.tz/uploads/announcements/6a9572095fc14.pdf   August 2026
  https://www.nemc.or.tz/uploads/announcements/6abcf6ca575e9.pdf   September 2026
(earlier lists are scanned images or carry no location and are not used). The tables are read with pdfplumber;
each certificate is placed in its council from its ward, district and region (the 2022 PHC ward layer, with the
council registry codes), and projects that produce, store, process or dispose of hazardous materials are
classified (fuel and gas; mining and mineral processing with cyanide, mercury or tailings; chemicals, plastics and
heavy industry; waste; thermal power; hospitals). Surrendered certificates are left out.

Usage: python3 scripts/benchmark/nemc_certificates.py july.pdf:2026-07 august.pdf:2026-08 september.pdf:2026-09
Writes data-source/benchmark_2026/nemc_certificates_2026.csv. The 2022 PHC geodatabase path can be set with PHC_GDB."""
import collections, csv, difflib, os, pathlib, re, site, sys
sys.path.append(site.getusersitepackages())
import fiona
import pdfplumber

def clean(s):
    return re.sub(r'\s+', ' ', (s or '').replace('\n', ' ')).strip()

def parse(files):
    rows = []
    for arg in files:
        path, _, label = arg.partition(':')
        section = None
        with pdfplumber.open(path) as pdf:
            for pi, page in enumerate(pdf.pages):
                for table in page.extract_tables():
                    for r in table:
                        cells = [clean(c) for c in r]
                        joined = ' '.join(c for c in cells if c)
                        m = re.match(r'^([A-H])\.\s*(.+)$', joined)
                        if m and not re.match(r'^\d', cells[0] or ''):
                            section = clean(m.group(2))
                            continue
                        if not cells or not re.match(r'^\d+\.?$', cells[0] or ''):
                            # continuation of the previous row across a page break
                            if rows and rows[-1]['file'] == label and any(cells):
                                prev = rows[-1]
                                extra = [c for c in cells if c]
                                if len(cells) >= 5:
                                    for k, c in zip(('project', 'owner', 'location', 'reg'), cells[1:5]):
                                        if c: prev[k] = clean(prev[k] + ' ' + c)
                            continue
                        if len(cells) < 5:
                            cells += [''] * (5 - len(cells))
                        rows.append({'file': label, 'page': pi + 1, 'section': section, 'no': cells[0].rstrip('.'),
                                     'project': cells[1], 'owner': cells[2], 'location': cells[3], 'reg': cells[4]})
    return rows


ROOT = pathlib.Path(__file__).resolve().parents[2]
G = os.environ.get('PHC_GDB', str(ROOT.parent / 'tcvmp/TANZANIA_2022_POST_PHC_GEODATABASE/commondata/tanzania_2022phc_geodatabase.gdb'))
key = lambda s: re.sub(r'[^a-z0-9]', '', str(s or '').lower())
SPELL = {'nyangwale': 'nyanghwale', 'nyang’hwale': 'nyanghwale'}

reg = {(r['reg_code'], r['dist_code'], r['counc_code']): r for r in csv.DictReader(open(ROOT / 'data-source/council_registry.csv'))}
wards = []
with fiona.open(G, layer='Wards') as src:
    for f in src:
        p = f['properties']
        code = reg.get((p['reg_code'], p['dist_code'], p['counc_code']))
        wards.append({'reg': p['reg_name'], 'dist': p['dist_name'], 'ward': p['ward_name'], 'code': code['code'] if code else None, 'council': code['name'] if code else p['counc_name'], 'type': code['type'] if code else ''})
by_reg = collections.defaultdict(list)
for w in wards: by_reg[key(w['reg'])].append(w)
councils = list(reg.values())
REG_ALIAS = {'darsalaam': 'daressalaam', 'daressalam': 'daressalaam', 'pemba north': 'kaskazinipemba', 'unguja': 'mjinimagharibi'}

def region_of(loc):
    # the region is named last: "..., X District in Y Region" (a location can hold several "in")
    for part in re.split(r'\bin\b', loc)[::-1]:
        m = re.search(r'([A-Za-z’\' -]+?)\s+Regions?\b', part)
        if m:
            k = key(m.group(1))
            if k in by_reg: return k
    for r in sorted({key(w['reg']) for w in wards}, key=len, reverse=True):
        if r and re.search(r'\b' + re.escape(r), key(loc)) and r in key(loc): return r
    return None

URBAN = r'(City|Municipality|Municipal|Town|Township)'
def district_phrase(loc):
    m = re.findall(r'([A-Z][A-Za-z’\' -]+?)\s+(City Council|City|Municipal Council|Municipality|Municipal|Town Council|Town|District Council|District|Rural District|Urban District)\b', loc)
    return m[-1] if m else None

def ward_of(loc):
    m = re.findall(r'([A-Z][A-Za-z’\'()/ -]+?)\s+Ward', loc)
    return m[-1].strip() if m else None

def locate(loc):
    r = region_of(loc)
    r = REG_ALIAS.get(r, r)
    cands = by_reg.get(r, []) if r else wards
    if not cands: cands = wards
    dp = district_phrase(loc)
    wd = ward_of(loc)
    pool = cands
    if dp:
        dn, kind = key(dp[0].split(',')[-1].replace('Mtaa', '')), dp[1]
        dn = SPELL.get(dn, dn)
        sub = [w for w in cands if key(w['dist']) == dn or dn in key(w['council'])]
        if sub: pool = sub
    if wd:
        wk = key(wd)
        exact = [w for w in pool if key(w['ward']) == wk]
        if not exact:
            names = list({key(w['ward']) for w in pool})
            close = difflib.get_close_matches(wk, names, n=1, cutoff=0.82)
            exact = [w for w in pool if close and key(w['ward']) == close[0]]
        if len({w['code'] for w in exact}) == 1:
            return exact[0]['code'], 'ward'
        if exact and dp:
            urb = re.match(URBAN, dp[1])
            pick = [w for w in exact if (w['type'] in ('City', 'Municipal', 'Town')) == bool(urb)]
            if len({w['code'] for w in pick}) == 1: return pick[0]['code'], 'ward+kind'
    if dp:
        codes = {w['code'] for w in pool}
        if len(codes) == 1: return codes.pop(), 'district'
        urb = re.match(URBAN, dp[1])
        pick = {w['code'] for w in pool if (w['type'] in ('City', 'Municipal', 'Town')) == bool(urb)}
        if len(pick) == 1: return pick.pop(), 'district+kind'
        # several councils of the same kind in the district: the one named after it (Manyoni DC, not Itigi DC)
        named = {w['code'] for w in pool if (w['type'] in ('City', 'Municipal', 'Town')) == bool(urb) and key(w['council']).startswith(dn)}
        if len(named) == 1: return named.pop(), 'district+name'
    # a project across several districts ("Nachingwea and Liwale Districts"): the first one named
    m = re.search(r'([A-Z][A-Za-z’\' -]+?)(?:,| and)[^,]*Districts', loc)
    if m:
        dn = SPELL.get(key(m.group(1)), key(m.group(1)))
        codes = {w['code'] for w in cands if key(w['dist']) == dn and key(w['council']).startswith(dn)}
        if len(codes) == 1: return codes.pop(), 'first-district'
    return None, 'unmatched'

# --- hazardous-material classification (first matching class wins) ------------------------------------------
CLASSES = [
    ('fuel', r'fuel|petrol|filling station|service station|oil depot|oil terminal|petroleum|\blpg\b|liquefied petroleum|liquefied natural gas|\blng\b|gas filling|gas cylinder|gas storage|bulk storage of oil|lubricant|diesel|kerosene|bitumen (?:plant|storage|depot|emulsion|processing)|asphalt (?:\w+ )?plant|natural gas|\bcng\b|gas plant|gas processing|gas field|tank farm'),
    ('mining', r'gold|carbon[- ]in[- ]pulp|\bcip\b|\bcil\b|carbon[- ]in[- ]leach|tailings|\btsf\b|elution|vat leach|heap leach|cyanide|mercury|mineral processing|ore processing|copper (?:mining|processing|mine)|nickel|graphite|uranium|\bcoal\b|rare earth|tanzanite|smelt|refinery|explosive|detonator|\banfo\b'),
    ('chemical', r'chemical|chemi and cotex|fertili[sz]er|pesticide|agro-?chemical|insecticide|herbicide|acaricide|paint|detergent|soap|\bacid\b|chlorine|ammonia|industrial gas|oxygen|o2 gas|nitrogen gas|carbon dioxide|pharmaceutic|cosmetic|toothpaste|\bink\b|ink factory|resin|adhesive|\bglue\b|solvent|plastic|polymer|polythene|polytherene|\bpvc\b|polyvinyl|rubber|\btyres?\b|\btires?\b|foam|mattress|batter(?:y|ies)|lead acid|cables? and wires|aerial bundled cables'),
    ('heavy', r'cement|clinker|\blime\b|steel|\biron\b|rolling mill|foundry|galvani[sz]|metal (?:works|fabrication|recycling)|scrap|aluminium|aluminum|tannery|tanning|leather|dyeing|pulp and paper|paper mill|\bglass\b|ceramic|sugar factory|distiller|ethanol|brewery'),
    ('waste', r'landfill|dump ?site|incinerat|medical waste|health ?care waste|hazardous waste|waste management|waste treatment|waste oil|used oil|e-?waste|waste plastics? recycling|sewage|waste ?water treatment|wastewater|faecal sludge|oxidation pond|sludge'),
    ('energy', r'thermal power|diesel power|gas[- ]fired|heavy fuel oil|power station(?! .*(?:solar|wind|hydro))|biomass power|co-?generation'),
    ('health', r'hospital'),
]

def classify(project):
    p = project.lower()
    if re.search(r'\broad\b|upgrading of .*km|bridge|bus terminal|bus stand', p) and not re.search(r'fuel|petrol|filling station|asphalt (?:\w+ )?plant', p):
        return None  # roads, bridges and terminals named after a place are not sites
    if re.search(r'solar|wind power|hydro ?power|small hydro', p):
        return None
    for cls, rx in CLASSES:
        if re.search(rx, p):
            return cls
    return None



if __name__ == '__main__':
    rows = parse(sys.argv[1:])
    out = []
    for r in rows:
        sec = (r['section'] or '').upper()
        if 'SURRENDER' in sec:
            continue  # surrendered certificates: the project is closed or abandoned
        code, how = locate(r['location'])
        out.append({**r, 'code': code or '', 'match': how, 'class': classify(r['project']) or ''})
    dest = ROOT / 'data-source/benchmark_2026/nemc_certificates_2026.csv'
    with open(dest, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
    print(f"{dest.name}: {len(out)} certificates, {sum(1 for x in out if x['code'])} placed in a council; classes", dict(collections.Counter(x['class'] or '-' for x in out)))
