#!/usr/bin/env python3
"""
compute-exposure.py — the EXPOSURE term for INFORM Hazard × Exposure, from REAL
NBS 2022 PHC council populations (via citypopulation.de). For each of the 150
district polygons: population (sum of its 2022 councils) ÷ polygon area = density,
then a 0–10 percentile-ranked exposure index. Region-population fallback (area
share) for any district whose councils don't name-match, so every district is real.

out: data-source/exposure_nbs2022.csv  (dist_name, reg_name, area_km2, pop2022, density, exposure_index)
"""
from __future__ import annotations
import json
from pathlib import Path
from collections import defaultdict
import numpy as np, pandas as pd, geopandas as gpd

ROOT = Path(__file__).resolve().parent.parent
GEO = ROOT / "src/data/tanzania-districts.json"
OUT = ROOT / "data-source/exposure_nbs2022.csv"

# Real 2022 PHC populations, (region, council, population) — NBS, via citypopulation.de
POP = [
 ("Arusha","Arusha City",617631),("Arusha","Arusha Rural",449518),("Arusha","Karatu",280454),
 ("Arusha","Longido",175915),("Arusha","Meru",331603),("Arusha","Monduli",227585),("Arusha","Ngorongoro",273549),
 ("Dar es Salaam","Ilala",1649912),("Dar es Salaam","Kigamboni",317902),("Dar es Salaam","Kinondoni",982328),
 ("Dar es Salaam","Temeke",1346674),("Dar es Salaam","Ubungo",1086912),
 ("Dodoma","Bahi",322526),("Dodoma","Chamwino",486176),("Dodoma","Chemba",339333),("Dodoma","Dodoma City",765179),
 ("Dodoma","Kondoa Rural",244854),("Dodoma","Kondoa Town",80443),("Dodoma","Kongwa",443867),("Dodoma","Mpwapwa",403247),
 ("Geita","Bukombe",407102),("Geita","Chato",584963),("Geita","Geita Rural",1035214),("Geita","Geita Town",361671),
 ("Geita","Mbogwe",362855),("Geita","Nyang'hwale",225803),
 ("Iringa","Iringa Municipal",202490),("Iringa","Iringa Rural",315354),("Iringa","Kilolo",263559),
 ("Iringa","Mafinga Town",122329),("Iringa","Mufindi",288996),
 ("Kagera","Biharamulo",457114),("Kagera","Bukoba Municipal",144938),("Kagera","Bukoba Rural",322448),
 ("Kagera","Karagwe",385744),("Kagera","Kyerwa",412910),("Kagera","Missenyi",245394),("Kagera","Muleba",637659),("Kagera","Ngara",383092),
 ("Kaskazini Pemba","Micheweni",123379),("Kaskazini Pemba","Wete",148712),
 ("Kaskazini Unguja","Kaskazini A",157369),("Kaskazini Unguja","Kaskazini B",99921),
 ("Katavi","Mlele",118818),("Katavi","Mpanda Municipal",245764),("Katavi","Mpimbwe",215438),("Katavi","Nsimbo",201102),("Katavi","Tanganyika",371836),
 ("Kigoma","Buhigwe",240005),("Kigoma","Kakonko",178419),("Kigoma","Kasulu Rural",537767),("Kigoma","Kasulu Town",238321),
 ("Kigoma","Kibondo",362922),("Kigoma","Kigoma Municipal",232388),("Kigoma","Kigoma Rural",222792),("Kigoma","Uvinza",458353),
 ("Kilimanjaro","Hai",240999),("Kilimanjaro","Moshi Municipal",221733),("Kilimanjaro","Moshi Rural",535803),
 ("Kilimanjaro","Mwanga",148763),("Kilimanjaro","Rombo",275314),("Kilimanjaro","Same",300303),("Kilimanjaro","Siha",139019),
 ("Kusini Pemba","Chake Chake",136298),("Kusini Pemba","Mkoani",135052),
 ("Kusini Unguja","Kati",132717),("Kusini Unguja","Kusini",63156),
 ("Lindi","Kilwa",297676),("Lindi","Lindi Municipal",174126),("Lindi","Liwale",136505),("Lindi","Mtama",166493),
 ("Lindi","Nachingwea",233655),("Lindi","Ruangwa",185573),
 ("Manyara","Babati Rural",375200),("Manyara","Babati Town",129572),("Manyara","Hanang",367391),("Manyara","Kiteto",352305),
 ("Manyara","Mbulu Rural",238272),("Manyara","Mbulu Town",138593),("Manyara","Simanjiro",291169),
 ("Mara","Bunda Rural",243822),("Mara","Bunda Town",182970),("Mara","Butiama",281656),("Mara","Musoma Municipal",164172),
 ("Mara","Musoma Rural",266665),("Mara","Rorya",354490),("Mara","Serengeti",340349),("Mara","Tarime Rural",404848),("Mara","Tarime Town",133043),
 ("Mbeya","Busekelo",100123),("Mbeya","Chunya",344471),("Mbeya","Kyela",266426),("Mbeya","Mbarali",446336),
 ("Mbeya","Mbeya City",541603),("Mbeya","Mbeya Rural",371259),("Mbeya","Rungwe",273536),
 ("Mjini Magharibi","Magharibi A",329645),("Mjini Magharibi","Magharibi B",344517),("Mjini Magharibi","Mjini",219007),
 ("Morogoro","Gairo",258205),("Morogoro","Ifakara Town",290424),("Morogoro","Kilosa",617032),("Morogoro","Malinyi",225126),
 ("Morogoro","Mlimba",292536),("Morogoro","Morogoro Municipal",471409),("Morogoro","Morogoro Rural",387736),("Morogoro","Mvomero",421741),("Morogoro","Ulanga",232895),
 ("Mtwara","Masasi Rural",314778),("Mtwara","Masasi Town",137585),("Mtwara","Mtwara Municipal",146772),("Mtwara","Mtwara Rural",158504),
 ("Mtwara","Nanyamba Town",132624),("Mtwara","Nanyumbu",204323),("Mtwara","Newala Rural",136939),("Mtwara","Newala Town",104349),("Mtwara","Tandahimba",299073),
 ("Mwanza","Buchosa",413110),("Mwanza","Ilemela",509687),("Mwanza","Kwimba",480025),("Mwanza","Magu",421119),
 ("Mwanza","Misungwi",467867),("Mwanza","Nyamagana",594834),("Mwanza","Sengerema",425415),("Mwanza","Ukerewe",387815),
 ("Njombe","Ludewa",151361),("Njombe","Makambako Town",146481),("Njombe","Makete",109160),
 ("Njombe","Njombe Rural",109311),("Njombe","Njombe Town",182127),("Njombe","Wanging'ombe",191506),
 ("Pwani","Bagamoyo",205478),("Pwani","Chalinze",316759),("Pwani","Kibaha",123367),("Pwani","Kibaha Town",265360),
 ("Pwani","Kibiti",195638),("Pwani","Kisarawe",159226),("Pwani","Mafia",66180),("Pwani","Mkuranga",533033),("Pwani","Rufiji",159906),
 ("Rukwa","Kalambo",316783),("Rukwa","Nkasi",425420),("Rukwa","Sumbawanga Municipal",303986),("Rukwa","Sumbawanga Rural",494330),
 ("Ruvuma","Madaba",65215),("Ruvuma","Mbinga Rural",285582),("Ruvuma","Mbinga Town",158896),("Ruvuma","Namtumbo",271368),
 ("Ruvuma","Nyasa",191193),("Ruvuma","Songea Municipal",286285),("Ruvuma","Songea Rural",178201),("Ruvuma","Tunduru",412054),
 ("Shinyanga","Kahama",453654),("Shinyanga","Kishapu",335483),("Shinyanga","Msalala",378214),
 ("Shinyanga","Shinyanga Municipal",214744),("Shinyanga","Shinyanga Rural",468611),("Shinyanga","Ushetu",390593),
 ("Simiyu","Bariadi Rural",383385),("Simiyu","Bariadi Town",260927),("Simiyu","Busega",282167),
 ("Simiyu","Itilima",419213),("Simiyu","Maswa",427864),("Simiyu","Meatu",366941),
 ("Singida","Ikungi",411262),("Singida","Iramba",328912),("Singida","Itigi",215947),("Singida","Manyoni",279069),
 ("Singida","Mkalama",255514),("Singida","Singida Municipal",232459),("Singida","Singida Rural",284895),
 ("Songwe","Ileje",125869),("Songwe","Mbozi",510599),("Songwe","Momba",259781),("Songwe","Songwe",229129),("Songwe","Tunduma Town",219309),
 ("Tabora","Igunga",546204),("Tabora","Kaliua",678447),("Tabora","Nzega Rural",574498),("Tabora","Nzega Town",125193),
 ("Tabora","Sikonge",335686),("Tabora","Tabora Municipal",308741),("Tabora","Urambo",260322),("Tabora","Uyui",562588),
 ("Tanga","Bumbuli",159373),("Tanga","Handeni Rural",384353),("Tanga","Handeni Town",108968),("Tanga","Kilindi",398391),
 ("Tanga","Korogwe Rural",272870),("Tanga","Korogwe Town",86551),("Tanga","Lushoto",350958),("Tanga","Mkinga",146802),
 ("Tanga","Muheza",238260),("Tanga","Pangani",75642),("Tanga","Tanga City",393429),
]

# geojson district name -> council-name fragments to sum when a plain substring won't match
ALIAS = {
  ("arusha","arumeru"): ["meru"],
  ("dar es salaam","ilala"): ["ilala"],
  ("mwanza","nyamagana"): ["nyamagana"],
  ("morogoro","kilombero"): ["ifakara town", "mlimba"],
  ("iringa","mufindi"): ["mufindi", "mafinga town"],
  ("njombe","njombe"): ["njombe rural", "njombe town", "makambako town"],
  ("katavi","mpanda"): ["mpanda municipal", "mpimbwe", "nsimbo"],
  ("tabora","nzega"): ["nzega rural", "nzega town"],
}

def norm(s): return "".join(ch for ch in str(s).lower() if ch.isalnum())

councils = defaultdict(list); reg_pop = defaultdict(float)
for r, c, p in POP:
    councils[norm(r)].append((norm(c), p)); reg_pop[norm(r)] += p

def match_pop(reg, dist):
    rn, dn = norm(reg), norm(dist)
    if (reg.lower(), dist.lower()) in ALIAS:
        frs = [norm(x) for x in ALIAS[(reg.lower(), dist.lower())]]
        return sum(p for cf, p in councils.get(rn, []) if any(fr in cf for fr in frs)), True
    tot = sum(p for cf, p in councils.get(rn, []) if dn in cf)
    return tot, tot > 0

gdf = gpd.read_file(GEO)
gdf["area_km2"] = gdf.to_crs(6933).area / 1e6
reg_area = gdf.groupby("reg_name")["area_km2"].sum().to_dict()

pops, matched = [], []
for _, row in gdf.iterrows():
    p, ok = match_pop(row["reg_name"], row["dist_name"])
    if not ok:  # region-population fallback by area share
        rn = norm(row["reg_name"]); share = row["area_km2"] / max(reg_area.get(row["reg_name"], 1), 1e-9)
        p = reg_pop.get(rn, 0) * share
    pops.append(p); matched.append(ok)

gdf["pop2022"] = np.round(pops).astype(int)
gdf["density"] = gdf["pop2022"] / gdf["area_km2"]
# Standardise to 0–10 by LOG min-max (population density is highly skewed: a few dense
# cities vs sparse rural). idx = (log10(d) - log10(min)) / (log10(max) - log10(min)) * 10
ld = np.log10(gdf["density"].clip(lower=1))
gdf["exposure_index"] = ((ld - ld.min()) / (ld.max() - ld.min()) * 10).round(2)
out = gdf[["dist_name", "reg_name", "area_km2", "pop2022", "density", "exposure_index"]].copy()
out["area_km2"] = out["area_km2"].round(1); out["density"] = out["density"].round(1)
out.to_csv(OUT, index=False)
print(f"wrote {OUT}  ({len(out)} districts, matched {sum(matched)}/{len(matched)} directly)")
print("unmatched (region fallback):", [n for n, m in zip(gdf['dist_name'], matched) if not m])
print("\nTop exposure (densest):")
print(out.sort_values("exposure_index", ascending=False).head(8).to_string(index=False))
