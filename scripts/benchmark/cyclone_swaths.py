import csv, json, sys, collections, numpy as np, geopandas as gpd
from shapely.geometry import Point
from shapely.ops import unary_union
ROOT='/home/kaijage/model/inform'; SC=sys.argv[1]
cj=json.load(open(f'{ROOT}/src/data/tanzania-councils.json'))
g=gpd.GeoDataFrame.from_features(cj['features'], crs='EPSG:4326').to_crs('EPSG:32737')
rows=csv.reader(open(f'{SC}/dl/ibtracs/ibtracs.SI.csv', encoding='utf-8', errors='replace')); hdr=next(rows); next(rows); ix={h:i for i,h in enumerate(hdr)}
def num(x):
    try: return float(x)
    except: return None
storms=collections.defaultdict(list)
for r in rows:
    lat=num(r[ix['LAT']]); lon=num(r[ix['LON']]); season=num(r[ix['SEASON']])
    if lat is None or season is None or season<1980: continue
    if not(-14<=lat<=-3 and 36<=lon<=48): continue
    w=num(r[ix['WMO_WIND']]) or num(r[ix['USA_WIND']]) or 0
    r34=[num(r[ix[k]]) for k in ('USA_R34_NE','USA_R34_SE','USA_R34_SW','USA_R34_NW')]
    r34=[x for x in r34 if x]
    storms[r[ix['SID']]].append((season, r[ix['NAME']], lat, lon, w, max(r34) if r34 else None))
pts=gpd.GeoSeries([Point(p[3],p[2]) for s in storms.values() for p in s], crs='EPSG:4326').to_crs('EPSG:32737')
k=0; swaths={}; info={}
for sid,s in storms.items():
    polys=[]; wmax=0
    for p in s:
        P=pts.iloc[k]; k+=1
        if p[4] and p[4]>=34:
            rad=(p[5]*1852) if p[5] else 100000  # R34 in nmi -> m, else 100 km default
            polys.append(P.buffer(rad)); wmax=max(wmax,p[4])
    if polys: swaths[sid]=unary_union(polys); info[sid]=(s[0][0], s[0][1], wmax)
print('storms with >=34 kt points near TZ:', [(v[0],v[1],v[2]) for v in info.values()])
allsw=unary_union(list(swaths.values()))
out=[]
for i,row in g.iterrows():
    a=row.geometry.area; inter=row.geometry.intersection(allsw).area
    hit=[info[s] for s,sw in swaths.items() if row.geometry.intersects(sw)]
    wmax=max([h[2] for h in hit], default=0)
    out.append((row['code'], row['name'], row['reg'], round(100*inter/a,1), len(hit), wmax, '; '.join(f'{h[1]} {int(h[0])}' for h in sorted(hit))))
out=[o for o in out if o[3]>0]
out.sort(key=lambda x:-x[3])
with open(f'{SC}/data/cyclone_exposure.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['code','name','reg','area_in_34kt_swath_pct','storms','max_wind_kt','storms_list']); w.writerows(out)
for o in out: print(o)
