"""Heatwave days per council from ERA5-Land daily Tmax (1991-2024): days in runs of >=3 days above the
calendar-day 90th percentile of 1991-2020 (15-day window), WMO/ETCCDI-style; plus hot days > 35 C."""
import csv, glob, sys, numpy as np
SC=sys.argv[1]
files=sorted(glob.glob(f'{SC}/gee/tmax/tmax_*.csv'))
dates=[]; rows=[]
codes=None
for f in files:
    r=list(csv.reader(open(f)))
    if codes is None: codes=r[0][1:]
    for line in r[1:]:
        dates.append(line[0]); rows.append([float(x) if x else np.nan for x in line[1:]])
T=np.array(rows); print('days', T.shape, 'from', dates[0], 'to', dates[-1])
years=np.array([int(d[:4]) for d in dates]); doy=np.array([int(np.datetime64(d).astype('datetime64[D]').astype(int)-np.datetime64(d[:4]+'-01-01').astype('datetime64[D]').astype(int)) for d in dates])
base=(years>=1991)&(years<=2020)
# calendar-day 90th percentile with a 15-day window over the base period
thr=np.full((366, T.shape[1]), np.nan)
for d in range(366):
    win=np.zeros(len(dates), bool)
    for off in range(-7,8):
        dd=(d+off)%366; win|=(doy==dd)
    sel=win&base
    thr[d]=np.nanpercentile(T[sel], 90, axis=0)
above=T>thr[doy]
# runs >= 3 days
hw=np.zeros_like(T, dtype=bool)
for j in range(T.shape[1]):
    a=above[:,j]; run=0
    for i in range(len(a)):
        if a[i]: run+=1
        else:
            if run>=3: hw[i-run:i,j]=True
            run=0
    if run>=3: hw[len(a)-run:,j]=True
out=[]
for j,c in enumerate(codes):
    yrs=range(1991,2025)
    per_year=[hw[years==y,j].sum() for y in yrs]
    recent=[hw[years==y,j].sum() for y in range(2015,2025)]
    hot35=[(T[years==y,j]>35).sum() for y in range(2015,2025)]
    out.append((c, round(float(np.mean(per_year)),1), round(float(np.mean(recent)),1), round(float(np.mean(hot35)),1), round(float(np.nanmean(thr[:,j])),1), round(float(np.nanmax(T[:,j])),1)))
with open(f'{SC}/data/heatwave_councils.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['code','hw_days_1991_2024','hw_days_2015_2024','hot35_days_2015_2024','p90_threshold_mean_c','tmax_record_c']); w.writerows(out)
import json
names={c['code']:(c['name'],c['reg']) for c in json.load(open('/home/kaijage/model/inform/src/data/tanzania-councils-index.json'))}
top=sorted(out, key=lambda x:-x[2])[:15]; print('TOP recent heatwave days:', [(names[o[0]][0], o[2], o[3]) for o in top])
bot=sorted(out, key=lambda x:x[2])[:8]; print('BOTTOM:', [(names[o[0]][0], o[2]) for o in bot])
for key in ('Kinondoni','Temeke','Tanga City','Pangani','Mkinga','Lindi Municipal','Mtwara Mikindani','Mafia','Kilwa','Kaskazini A','Mjini Municipal','Dodoma City','Mbeya City','Arusha City','Kigoma Ujiji','Bukoba Municipal'):
    for o in out:
        if names[o[0]][0].startswith(key): print(names[o[0]][0], o[1:])
