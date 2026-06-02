#!/usr/bin/env python3
"""compute-heatwave.py — heat exposure proxy per district from ERA5 t2m (cached cube).
Blends mean annual temperature with the hottest-quarter mean, min-max to 0-10. (Proxy:
true heatwave needs daily extremes; this captures the hot lowlands vs cool highlands pattern.)
out: data-source/heatwave_era5.csv"""
import json, warnings; warnings.filterwarnings('ignore')
from pathlib import Path
import numpy as np, pandas as pd
ROOT=Path(__file__).resolve().parent.parent
cube=np.load(ROOT/'data-source/_drought_cube.npz', allow_pickle=True)
T=cube['T']; names=list(cube['names']); regs=list(cube['regs'])   # T: (months, district) deg C
mean_annual=np.nanmean(T,axis=0)
TA=T.reshape(-1,12,T.shape[1])                     # years x 12 x district
clim=np.nanmean(TA,axis=0)                         # 12 x district climatology
hot3=np.sort(clim,axis=0)[-3:].mean(axis=0)        # mean of 3 hottest months
score=0.5*mean_annual+0.5*hot3
mm=(score-np.nanmin(score))/(np.nanmax(score)-np.nanmin(score))
df=pd.DataFrame({'dist_name':names,'reg_name':regs,'mean_temp_c':mean_annual.round(1),
                 'hot3_c':hot3.round(1),'heatwave_index':(mm*6.5).round(2)})
df.to_csv(ROOT/'data-source/heatwave_era5.csv',index=False)
print('wrote heatwave_era5.csv; hottest:'); print(df.sort_values('heatwave_index',ascending=False).head(6).to_string(index=False))
print('coolest:'); print(df.sort_values('heatwave_index').head(4)[['dist_name','reg_name','mean_temp_c','heatwave_index']].to_string(index=False))
