import re, json, csv, sys, collections
SC=sys.argv[1]; ROOT='/home/kaijage/model/inform'
idx=json.load(open(f'{ROOT}/src/data/tanzania-councils-index.json'))
REGION_FILE={'Dodoma':'r01','Arusha':'r02','Kilimanjaro':'r03','Tanga':'r04','Morogoro':'r05','Pwani':'r06','Dar es Salaam':'r07','Lindi':'r08','Mtwara':'r09','Ruvuma':'r10','Iringa':'r11','Mbeya':'r12','Singida':'r13','Tabora':'r14','Rukwa':'r15','Kigoma':'r16','Shinyanga':'r17','Kagera':'r18','Mwanza':'r19','Mara':'r20','Manyara':'r21','Njombe':'r22','Katavi':'r23','Simiyu':'r24','Geita':'r25','Songwe':'r26','Kaskazini Unguja':'r51','Kusini Unguja':'r52','Mjini Magharibi':'r53','Kaskazini Pemba':'r54','Kusini Pemba':'r55'}
def key(s): return re.sub(r'[^a-z]','',s.lower())
TYPE=('municipalcouncil','districtcouncil','towncouncil','citycouncil','municipal','district','council','town','city','municipality')
def stem(k):
    for t in TYPE:
        if k.endswith(t): return k[:-len(t)]
    return k
ALIASES={'C053':['ilalamunicipal','ilala','daressalaamcity','daressalaamcitycouncil','ilalacc'],'C065':['mtwaramunicipal','mtwaramikindanimunicipal','mtwaramikindani','mikindanimunicipal'],'C115':['kigomaujijimunicipal','kigomamunicipal','kigomaujiji'],'C120':['kahamamunicipal','kahamatown','kahamamunicipality'],'C090':['busokelodistrict','busekelodistrict','busokelo','busekelo'],'C137':['sengeremadistrict','sengerema'],'C138':['buchosadistrict','buchosa'],'C136':['mwanzacity','nyamaganamunicipal','nyamagana'],'C016':['rombodistrict'],'C004':['kongwadistrict'],'C185':['kaskazinia','kaskaziniatown','kaskaziniadistrict','northa'],'C186':['kaskazinib','kaskazinibtown','kaskazinibdistrict','northb'],'C187':['kati','katitown','katidistrict','central'],'C188':['kusini','kusinidistrict','south'],'C189':['mjini','mjinimunicipal','mjinidistrict','urban'],'C190':['magharibia','magharibiamunicipal','magharibiadistrict','westa'],'C191':['magharibib','magharibibmunicipal','magharibibdistrict','westb'],'C192':['wete','wetetown','wetedistrict'],'C193':['micheweni','michewenidistrict'],'C194':['chakechake','chakechaketown','chakechakedistrict'],'C195':['mkoani','mkoanitown','mkoanidistrict']}
NUM=re.compile(r'\(?-?\d[\d,]*\.?\d*\)?')
def numbers(s):
    out=[]
    for t in NUM.findall(s):
        neg=t.startswith('('); t=t.strip('()').replace(',','')
        try: v=float(t); out.append(-v if neg else v)
        except: pass
    return out
def match_council(label, councils):
    k=key(label)
    for c in councils:
        if k==key(c['name']) or k in ALIASES.get(c['code'],[]): return c
    # stem match when unique among the region's councils
    hits=[c for c in councils if stem(k)==stem(key(c['name'])) and stem(k)]
    if len(hits)==1 and (k.endswith(('district','town','city','municipal')) or not any(key(c['name']).endswith(('town','city','municipal')) for c in councils if stem(key(c['name']))==stem(k) and c is not hits[0])): return hits[0]
    return None
def find_tables(lines, anchor_re, must_re=None, after=1200):
    out=[]
    for i,l in enumerate(lines):
        if i>after and re.search(anchor_re, l) and (must_re is None or re.search(must_re, re.sub(r'\s+',' ', ' '.join(lines[i:i+3])))): out.append(i)
    return out
def council_rows(lines, start, councils, span=160, twoline=False, valid=None):
    found={}; prev_nums=None; pending=None
    for l in lines[start+1:start+span]:
        if pending is not None:
            if re.match(r'^\s{6,}[\d\.,\s\(\)\-]+$', l) and numbers(l):
                nums=numbers(l)
                if pending['code'] not in found and (valid is None or valid(nums)): found[pending['code']]=nums
                pending=None; continue
            if re.match(r'^\s+(District|Town|Municipal|City)\s*$', l): continue
            pending=None
        if re.match(r'^\s*Table \d', l) and found: break
        m=re.match(r'^\s*([A-Za-z][A-Za-z\'\-\. ]+?)\s{2,}(.*\d.*)$', l)
        if not m:
            m2=re.match(r'^\s*([A-Za-z][A-Za-z\'\-\. ]+?)\s*$', l)
            c2=match_council(m2.group(1), councils) if m2 else None
            if c2 and not (twoline and prev_nums and len(prev_nums)>=3): pending=c2; continue
        if not m and twoline and prev_nums and len(prev_nums)>=3:
            m2=re.match(r'^\s*([A-Za-z][A-Za-z\'\-\. ]+?)\s*$', l)
            c2=match_council(m2.group(1), councils) if m2 else None
            if c2 and c2['code'] not in found and (valid is None or valid(prev_nums)): found[c2['code']]=prev_nums
            prev_nums=None; continue
        if not m:
            if twoline and re.match(r'^\s{10,}[\d\.,\s]+$', l): prev_nums=numbers(l)
            continue
        c=match_council(m.group(1), councils)
        if not c: prev_nums=None; continue
        nums=numbers(m.group(2))
        if twoline and len(nums)<=3 and prev_nums and len(prev_nums)>=3: nums=prev_nums+nums
        prev_nums=None
        if nums and c['code'] not in found and (valid is None or valid(nums)): found[c['code']]=nums
    return found
def pick_phone(n): return (n[3] if len(n)>=4 and n[0]>1000 else n[0]) if n else None
def pick_light(n): return round(n[1]+n[2]+n[3],1) if len(n)>=4 else None
def pick_fem(n): return n[3] if len(n)>=4 else (n[1] if len(n)>=2 else None)
def pick_lit(n): return n[3] if len(n)>=6 else (n[0] if len(n)>=3 else None)
def pick_dis(n): return n[3] if len(n)>=4 else None
def within(pick, lo, hi):
    def ok(n):
        try: v=pick(n)
        except Exception: return False
        return v is not None and lo<=v<=hi
    return ok
TABLES={
 'phone': dict(anchor=r'Table 13\.\s?[1-4]\b', must=r'Mobile Phone', pick=pick_phone, twoline=True, valid=within(pick_phone,50,100)),
 'lighting': dict(anchor=r'Table 12\.\s?(9|10|11)\b', must=r'Lighting', pick=pick_light, extra=lambda n: n[1] if len(n)>=2 else None, valid=within(pick_light,1,100)),
 'femhh': dict(anchor=r'Table 4\.\s?[4-6]\b', must=r'Percentage Distribution of Household\s?s by [Ss]ex of Household Head.*Council', pick=pick_fem, valid=within(pick_fem,15,55)),
 'literacy': dict(anchor=r'Table 8\.\s?[3-8]\b', must=r'Literacy Rate.*Council', pick=pick_lit, valid=within(pick_lit,30,100)),
 'disability': dict(anchor=r'Table 10\.\s?2\b', must=r'Disability', pick=pick_dis, valid=within(pick_dis,2,30)),
}
results=collections.defaultdict(dict); src=collections.defaultdict(dict); report=[]
for reg,fn in REGION_FILE.items():
    lines=open(f'{SC}/dl/phc/{fn}.txt',encoding='utf-8',errors='replace').read().split('\n')
    councils=[c for c in idx if c['reg']==reg]
    for name,t in TABLES.items():
        rows={}
        for start in find_tables(lines, t['anchor'], t.get('must')):
            rows.update({k:v for k,v in council_rows(lines, start, councils, twoline=t.get('twoline', False), valid=t.get('valid')).items() if k not in rows})
            if len(rows)>=len(councils): break
        if name=='lighting' and len(rows)<len(councils):
            # fallback: the grid-only table "... Grid for Lighting by Council" (2012, 2022): take 2022 (last number)
            for start in find_tables(lines, r'Grid for Lighting by Council|Grid .* by Council'):
                for k,v in council_rows(lines, start, councils).items():
                    if k not in rows and v and 1<=v[-1]<=100: rows[k]=[None, v[-1], 0, 0]; src['lighting'][k]='grid only'
        for code,nums in rows.items():
            try: val=t['pick'](nums)
            except Exception: val=None
            if val is not None: results[name][code]=val; src[name].setdefault(code,'table')
            if name=='lighting' and 'extra' in t and nums and nums[1] is not None: results['tanesco'][code]=nums[1]
        report.append((reg,name,f'{len(rows)}/{len(councils)}'))
for name in TABLES:
    miss=[f"{c['name']} ({c['reg']})" for c in idx if c['code'] not in results[name]]
    print(name, 'found', len(results[name]), 'missing', len(miss), miss[:10])
with open(f'{SC}/data/census2022_councils.csv','w',newline='') as f:
    w=csv.writer(f); keys=['phone','lighting','tanesco','femhh','literacy','disability']; w.writerow(['code','name','reg']+keys+['lighting_source'])
    for c in idx: w.writerow([c['code'],c['name'],c['reg']]+[results[k].get(c['code'],'') for k in keys]+[src['lighting'].get(c['code'],'')])
print('sample Dodoma:', [(c['name'], {k: results[k].get(c['code']) for k in ['phone','lighting','femhh','literacy','disability']}) for c in idx[:4]])
print('sample Dar:', [(c['name'], {k: results[k].get(c['code']) for k in ['phone','lighting','femhh','literacy','disability']}) for c in idx if c['reg']=='Dar es Salaam'])
print('sample Zanzibar:', [(c['name'], {k: results[k].get(c['code']) for k in ['phone','lighting','femhh']}) for c in idx if c['reg']=='Mjini Magharibi'])
