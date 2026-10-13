# Where the model’s first hazard contradicts the Guide Book: the hunt of 14 October 2026

For each of the 195 councils, the hazard group the live model ranks first (its highest-scoring INFORM hazard group) was compared with the hazards the Risk Action Guide Book records for the council. A row is marked ✗ when the first group is not among the Guide Book’s hazards (heavy rainfall counts for flood and landslide).

**Result: 111 of 195 councils contradict the Guide Book.** The first groups: earthquake 77, wildfire 31, flood 25, stormsCyclone 17, environmentalDegradation 16, hazardousMaterial 7, heatwave 7, landslide 6, vehicleAccidents 5, coastalHazards 2, volcano 1, lightning 1.

## The causes

1. **Earthquake exposure saturated in the workbook (77 councils).** The workbook’s GEM exposure index (HA.NAT.EQ-EXP, a share of area where the 475-year peak ground acceleration reaches 0.12 g) sits at its ceiling in 49 of the 170 workbook units, so 54 councils score 10.0 on earthquake. In 35 of them the Guide Book does not record earthquake at all (Dodoma, Singida, Manyara, Shinyanga Municipal, Same, Lushoto, Kasulu …). Data note DN-10 explained the ceiling on 10 October and kept the values. The USGS catalogue, already in the repository (data-source/earthquake_councils.csv: maximum felt intensity and events within 50 km, 1960–2024), ranks the councils instead: Mbulu 7.6 MMI with 12 events, Kigoma and Rukwa 7.0, Kondoa 6.6 with 8 events, Shinyanga Municipal 6.3 with none, Same 6.0 with 3.
2. **Drought flattened in the semi-arid centre.** The workbook’s FAO drought frequency (HA.NAT.DR-FRE, one value per region, cropland based) gives Simiyu and Mwanza its minimum, Tabora 6 and Shinyanga 7 of a 5–19 range, so drought scores 1.4 in every Shinyanga council and 0 in Mbeya, Kyela and Kagera, while the Guide Book records drought for the whole of Shinyanga, Simiyu, Dodoma and Singida. Data note DN-02 queried this, FAO’s stress index was consulted and the values were kept. The repository holds a council-level alternative: CHIRPS/ERA5 drought members per council (data-source/drought_members_councils.csv: SPEI frequency and depth, 1991–2024).
3. **Environmental degradation, hazardous material, vehicle accidents and heatwave as “the first hazard” (35 councils).** These are INFORM hazard groups and score honestly, but a reader expects the first hazard to be a disaster hazard. Karagwe, Biharamulo, Ngara and Kyerwa (Kagera) lead with environmental degradation (deforestation, a national workbook value); Kahama Municipal with hazardous-material sites; Bukoba Municipal with lightning (true of the Lake Victoria shore).
4. **Wildfire from the workbook (31 councils).** The workbook’s wildfire group (national and regional values) leads in Geita’s Nyang’hwale, Mbogwe and Bukombe, the Shinyanga districts and others where the Guide Book records heavy rainfall and floods first; it is right for Mlele (9.4) and the miombo belt.

## The cases named on 14 October

| Council | Model’s first group | Model’s next groups | Guide Book hazards | What you named |
|---|---|---|---|---|
| Same District (Kilimanjaro) | earthquake 10 | landslide 8.2, flood 7.1 | drought, floods, landslide, strongWinds, heavyRainfall | landslide |
| Mbeya District (Mbeya) | earthquake 10 | landslide 7.1, wildfire 6.6 | heavyRainfall, landslide, floods, earthquake | landslide |
| Kyela District (Mbeya) | earthquake 10 | flood 10, lightning 8.4 | floods, largeWaves, heavyRainfall, earthquake, publicHealth | flood |
| Rungwe District (Mbeya) | earthquake 10 | landslide 7.4, wildfire 6.6 | heavyRainfall, landslide, floods, earthquake | landslide |
| Kishapu District (Shinyanga) | earthquake 9.9 | flood 7.4, wildfire 4.55 | drought, strongWinds, floods, heavyRainfall | drought |
| Shinyanga District (Shinyanga) | earthquake 5.9 | flood 5.1, wildfire 4.55 | drought, strongWinds, wildfire, floods, heavyRainfall | drought |
| Shinyanga Municipal (Shinyanga) | earthquake 10 | flood 7.4, hazardousMaterial 6 | drought, strongWinds, floods, heavyRainfall | drought (Guide Book: drought, strong winds, floods, heavy rainfall) |
| Bukoba District (Kagera) | flood 8.1 | environmentalDegradation 6.85, heatwave 6.7 | floods, largeWaves, heavyRainfall, publicHealth, earthquake, landslide | earthquake (Kagera) |
| Bukoba Municipal (Kagera) | lightning 8.4 | flood 8.1, heatwave 7.7 | floods, largeWaves, heavyRainfall, publicHealth, earthquake | flood |
| Missenyi District (Kagera) | heatwave 7.6 | flood 7.1, environmentalDegradation 6.55 | floods, largeWaves, heavyRainfall, earthquake | earthquake (Kagera) |
| Mlele District (Katavi) | wildfire 9.4 | earthquake 8.8, flood 7.5 | drought, wildfire, floods, heavyRainfall | wildfire |
| Geita District (Geita) | flood 6.1 | wildfire 5.1, environmentalDegradation 4.05 | heavyRainfall, floods, publicHealth, largeWaves | flood |
| Geita Town (Geita) | flood 6.1 | wildfire 5.1, hazardousMaterial 4.9 | floods, largeWaves, heavyRainfall, publicHealth | flood |
| Chato District (Geita) | flood 7.2 | wildfire 5.1, environmentalDegradation 4.2 | floods, largeWaves, heavyRainfall, publicHealth | mudslide/landslide |

Kawetire/Kawetele: no place of that name occurs in the system’s data (the Guide Book files, the committee records, the benchmark evidence or the thesis data under the repository). The Mbeya file records Busokelo (Rungwe slopes), Kyela (Lake Nyasa flood plain) and Rungwe (Tukuyu and the volcanic slopes); nothing is attributed to Mbeya District that belongs to Rungwe.

## Resolution of 14 October 2026 (same day)

Three changes were made, by programme decision, and the audit was run again:

1. **Earthquake.** The workbook's GEM exposure index is withheld for every unit (data note DN-10 became a known artefact with a hold) and the Earthquake group carries, for every council, the maximum felt intensity recorded by the USGS catalogue (magnitude 4.5 and above, 1960–2024; 1.5 M − 1.5 log10(R + 15) at the council centroid), ranged over the councils. Mbulu, Tanganyika, Uvinza, Mkalama and Hanang lead; Shinyanga Municipal scores 3.2, Same 1.8.
2. **Drought.** The workbook's FAO regional frequency is withheld for every unit (DN-02 became a programme decision with a hold) and the Drought group carries the Benchmark 2026 drought hazard index: 0 where PMO-DMD's Risk Action Guide Book records no drought, and where it does, the council's mean annual CHIRPS rainfall (1991–2024) on the span of all councils, the driest scoring 10. Validation against the Guide Book's 83 drought councils: annual rainfall alone separates them best of the council measures on file (AUC 0.84; aridity 0.78; SPEI depth 0.58; season-failure frequency 0.51), but alone it ranks the humid coast and the lake shore in the middle, so the documentation gates it. An aridity index without the gate was tried first and rejected: it put drought first in 106 councils, Dar es Salaam and Kibiti among them.
3. **Conflict intensity, conflict risk and internal violence** are withheld everywhere (DN-12 to DN-14).

**Result: 72 of 195 councils still contradict the Guide Book (111 before).** The first groups now: drought 58, wildfire 26, flood 25, stormsCyclone 18, environmentalDegradation 17, landslide 15, hazardousMaterial 9, volcano 6, lightning 6, heatwave 6, vehicleAccidents 5, coastalHazards 2, earthquake 2.

What remains, honestly: environmental degradation (the workbook's deforestation value) still heads nine councils in Kagera and elsewhere; the workbook's wildfire heads Geita's Nyang'hwale, Mbogwe and Bukombe and the Shinyanga districts where the Guide Book records heavy rainfall and floods first; lightning (WWLLN) heads Bukoba Municipal and Kasulu, which is true of the lake shore; hazardous-material sites head Kahama and other mining towns. Same District reads drought first (the Guide Book lists drought first for Same) with landslide 8.2 second, and Bunda drought 7.4 with flood 7.1 second. Kagera's earthquake (the 2016 Bukoba event) scores 4.0 on the recorded intensity, below its floods and heat.

The national picture after the three changes: INFORM Risk 4.3 (High on the SADC thresholds; 3.9 Medium before), councils 2 low, 92 medium, 101 high (14, 144, 37 before). The rise comes from the human-hazard category, which is now the mean of hazardous-material sites and road crashes alone, and from drought scoring 7 to 10 across the semi-arid centre.

## The named cases after the resolution

| Council | First three hazard groups now |
|---|---|
| Kondoa District (Dodoma) | drought, landslide, floods, strongWinds, wildfire, heavyRainfall |
| Same District (Kilimanjaro) | drought, floods, landslide, strongWinds, heavyRainfall |
| Mbeya District (Mbeya) | heavyRainfall, landslide, floods, earthquake |
| Kyela District (Mbeya) | floods, largeWaves, heavyRainfall, earthquake, publicHealth |
| Rungwe District (Mbeya) | heavyRainfall, landslide, floods, earthquake |
| Kishapu District (Shinyanga) | drought, strongWinds, floods, heavyRainfall |
| Shinyanga Municipal (Shinyanga) | drought, strongWinds, floods, heavyRainfall |
| Bukoba Municipal (Kagera) | floods, largeWaves, heavyRainfall, publicHealth, earthquake |
| Missenyi District (Kagera) | floods, largeWaves, heavyRainfall, earthquake |
| Musoma District (Mara) | floods, largeWaves, heavyRainfall, publicHealth |
| Bunda District (Mara) | floods, largeWaves, heavyRainfall, publicHealth, drought |
| Rorya District (Mara) | floods, largeWaves, heavyRainfall, publicHealth |
| Mlele District (Katavi) | drought, wildfire, floods, heavyRainfall |
| Geita District (Geita) | heavyRainfall, floods, publicHealth, largeWaves |
| Chato District (Geita) | floods, largeWaves, heavyRainfall, publicHealth |

## Every council (before the resolution)

| Council | ✗ | Model: first three hazard groups (0–10) | Guide Book hazards |
|---|---|---|---|
| Kondoa District (Dodoma) | ✗ | earthquake 10, wildfire 4.75, landslide 4.7 | drought, landslide, floods, strongWinds, wildfire, heavyRainfall |
| Kondoa Town (Dodoma) | ✗ | earthquake 10, wildfire 4.75, landslide 4.7 | drought, strongWinds, floods, landslide |
| Mpwapwa District (Dodoma) | ✗ | earthquake 8.7, landslide 7.1, wildfire 4.75 | drought, strongWinds, wildfire, floods, landslide, heavyRainfall |
| Kongwa District (Dodoma) | ✗ | earthquake 8, landslide 4.8, wildfire 4.75 | drought, strongWinds, wildfire, floods, heavyRainfall |
| Chamwino District (Dodoma) | ✗ | earthquake 9.9, environmentalDegradation 4.9, flood 4.8 | drought, strongWinds, wildfire, floods, heavyRainfall |
| Dodoma City (Dodoma) | ✗ | earthquake 10, hazardousMaterial 5.4, wildfire 4.75 | drought, heavyRainfall, strongWinds, wildfire, floods |
| Bahi District (Dodoma) | ✗ | earthquake 10, flood 7.4, wildfire 4.75 | drought, strongWinds, wildfire, floods |
| Chemba District (Dodoma) | ✗ | earthquake 10, flood 5.7, environmentalDegradation 5 | drought, strongWinds, wildfire, floods, landslide |
| Monduli District (Arusha) | ✗ | earthquake 10, volcano 10, drought 8.6 | drought, strongWinds, wildfire, floods |
| Meru District (Arusha) |  | earthquake 10, volcano 10, drought 8.6 | heavyRainfall, landslide, floods, earthquake, strongWinds |
| Arusha District (Arusha) |  | earthquake 10, volcano 10, drought 8.6 | heavyRainfall, landslide, floods, earthquake, drought |
| Longido District (Arusha) | ✗ | earthquake 10, volcano 10, drought 8.6 | drought, heavyRainfall, strongWinds, wildfire, floods |
| Karatu District (Arusha) | ✗ | earthquake 10, volcano 10, drought 8.6 | heavyRainfall, landslide, floods, strongWinds |
| Ngorongoro District (Arusha) | ✗ | volcano 10, drought 8.6, earthquake 7.2 | drought, floods, landslide, earthquake, wildfire |
| Arusha City (Arusha) |  | earthquake 10, volcano 10, drought 8.6 | floods, heavyRainfall, strongWinds, earthquake |
| Rombo District (Kilimanjaro) |  | earthquake 10, environmentalDegradation 5.2, landslide 4.2 | heavyRainfall, landslide, floods, earthquake |
| Mwanga District (Kilimanjaro) | ✗ | earthquake 10, flood 7, landslide 6.3 | drought, floods, strongWinds, landslide |
| Same District (Kilimanjaro) | ✗ | earthquake 10, landslide 8.2, flood 7.1 | drought, floods, landslide, strongWinds, heavyRainfall |
| Moshi Municipal (Kilimanjaro) |  | earthquake 10, hazardousMaterial 7.8, vehicleAccidents 7.1 | floods, heavyRainfall, earthquake, strongWinds |
| Moshi District (Kilimanjaro) |  | earthquake 10, landslide 6.8, flood 6 | floods, landslide, heavyRainfall, earthquake |
| Hai District (Kilimanjaro) |  | earthquake 10, landslide 6.1, flood 4.8 | heavyRainfall, landslide, floods, earthquake, drought |
| Siha District (Kilimanjaro) | ✗ | earthquake 10, environmentalDegradation 5, landslide 5 | heavyRainfall, landslide, floods, strongWinds, wildfire |
| Lushoto District (Tanga) | ✗ | earthquake 10, landslide 7.4, environmentalDegradation 5.25 | heavyRainfall, landslide, floods, strongWinds |
| Bumbuli District (Tanga) | ✗ | earthquake 10, landslide 7.4, heatwave 5.4 | heavyRainfall, landslide, floods |
| Korogwe District (Tanga) |  | flood 8, earthquake 7.9, landslide 7.8 | floods, heavyRainfall, landslide |
| Korogwe Town (Tanga) |  | flood 8.9, landslide 6.1, hazardousMaterial 5.9 | floods, heavyRainfall, landslide |
| Muheza District (Tanga) | ✗ | environmentalDegradation 6.65, heatwave 5.6, flood 5.2 | heavyRainfall, landslide, largeWaves, floods, strongWinds |
| Tanga City (Tanga) | ✗ | environmentalDegradation 6.4, flood 6.3, hazardousMaterial 6 | largeWaves, floods, strongWinds, heavyRainfall, publicHealth |
| Pangani District (Tanga) |  | flood 9.8, environmentalDegradation 6.1, heatwave 6 | floods, largeWaves, strongWinds, publicHealth |
| Handeni District (Tanga) | ✗ | environmentalDegradation 6.3, drought 4.3, heatwave 4.2 | floods, heavyRainfall, drought, strongWinds |
| Handeni Town (Tanga) | ✗ | environmentalDegradation 6.05, drought 4.3, heatwave 4.3 | floods, heavyRainfall, drought, landslide |
| Kilindi District (Tanga) | ✗ | environmentalDegradation 6.15, landslide 6.1, drought 4.3 | drought, strongWinds, floods, wildfire, heavyRainfall |
| Mkinga District (Tanga) |  | coastalHazards 6.6, environmentalDegradation 4.9, drought 4.3 | largeWaves, floods, heavyRainfall, publicHealth |
| Kilosa District (Morogoro) |  | landslide 7.3, flood 6.9, wildfire 6.1 | floods, heavyRainfall, drought |
| Morogoro District (Morogoro) |  | landslide 7.8, earthquake 7.3, flood 6.2 | floods, landslide, heavyRainfall |
| Morogoro Municipal (Morogoro) | ✗ | hazardousMaterial 6.5, wildfire 6.1, vehicleAccidents 5.2 | floods, landslide, heavyRainfall |
| Mlimba District (Morogoro) |  | flood 6.8, landslide 6.8, wildfire 6.1 | floods, heavyRainfall, publicHealth |
| Ifakara Town (Morogoro) |  | flood 6.8, landslide 6.8, wildfire 6.1 | floods, heavyRainfall, publicHealth |
| Ulanga District (Morogoro) |  | flood 7.9, wildfire 6.1, lightning 5.6 | floods, heavyRainfall, strongWinds, publicHealth |
| Malinyi District (Morogoro) |  | flood 7.9, wildfire 6.1, environmentalDegradation 5.3 | floods, heavyRainfall, strongWinds |
| Mvomero District (Morogoro) |  | landslide 7.9, flood 7.2, wildfire 6.1 | floods, landslide, heavyRainfall |
| Gairo District (Morogoro) |  | landslide 6.8, wildfire 6.1, environmentalDegradation 5.35 | floods, drought, strongWinds, landslide |
| Bagamoyo District (Pwani) |  | coastalHazards 10, flood 5.8, environmentalDegradation 5.35 | largeWaves, floods, heavyRainfall, publicHealth |
| Chalinze District (Pwani) |  | flood 5.8, coastalHazards 5.7, environmentalDegradation 5.35 | floods, heavyRainfall, strongWinds, largeWaves |
| Kibaha District (Pwani) |  | flood 6.8, environmentalDegradation 5.65, wildfire 4.5 | floods, heavyRainfall, publicHealth, drought |
| Kibaha Town (Pwani) | ✗ | hazardousMaterial 6.5, environmentalDegradation 5.45, vehicleAccidents 4.8 | largeWaves, floods, heavyRainfall, strongWinds, publicHealth |
| Kisarawe District (Pwani) | ✗ | stormsCyclone 10, environmentalDegradation 5.45, flood 4.7 | heavyRainfall, floods, largeWaves, landslide, wildfire |
| Mkuranga District (Pwani) | ✗ | stormsCyclone 10, environmentalDegradation 5.95, coastalHazards 5.3 | largeWaves, floods, heavyRainfall, publicHealth |
| Rufiji District (Pwani) | ✗ | stormsCyclone 10, flood 9, environmentalDegradation 5.4 | floods, heavyRainfall, largeWaves, publicHealth |
| Mafia District (Pwani) |  | stormsCyclone 10, heatwave 9.5, coastalHazards 7.3 | largeWaves, strongWinds, earthquake, heavyRainfall, publicHealth |
| Kibiti District (Pwani) | ✗ | stormsCyclone 10, flood 9, coastalHazards 7.3 | floods, largeWaves, heavyRainfall, publicHealth |
| Kinondoni Municipal (Dar es Salaam) | ✗ | hazardousMaterial 8.7, vehicleAccidents 8.2, environmentalDegradation 6.3 | floods, heavyRainfall, largeWaves, strongWinds, publicHealth |
| Dar es Salaam City (Dar es Salaam) |  | stormsCyclone 10, hazardousMaterial 8.2, vehicleAccidents 7.4 | floods, heavyRainfall, strongWinds, largeWaves, publicHealth, wildfire |
| Temeke Municipal (Dar es Salaam) | ✗ | stormsCyclone 10, hazardousMaterial 9, vehicleAccidents 8.4 | floods, heavyRainfall, largeWaves, publicHealth |
| Kigamboni Municipal (Dar es Salaam) |  | stormsCyclone 10, environmentalDegradation 6.6, hazardousMaterial 6.6 | largeWaves, floods, strongWinds, heavyRainfall |
| Ubungo Municipal (Dar es Salaam) | ✗ | vehicleAccidents 8.2, hazardousMaterial 7.9, environmentalDegradation 6.3 | floods, heavyRainfall, landslide |
| Kilwa District (Lindi) | ✗ | wildfire 7.9, flood 7.5, stormsCyclone 6.5 | largeWaves, strongWinds, earthquake, heavyRainfall, publicHealth, floods |
| Mtama District (Lindi) |  | stormsCyclone 10, wildfire 7.9, flood 7.1 | largeWaves, floods, heavyRainfall, publicHealth, drought, strongWinds, landslide |
| Lindi Municipal (Lindi) | ✗ | wildfire 7.9, flood 6.8, coastalHazards 5.3 | largeWaves, floods, strongWinds, heavyRainfall, publicHealth |
| Nachingwea District (Lindi) |  | wildfire 7.9, flood 4.6, lightning 4.4 | drought, floods, wildfire, strongWinds, heavyRainfall |
| Liwale District (Lindi) |  | wildfire 7.9, flood 6.6, lightning 4.4 | drought, wildfire, floods, heavyRainfall |
| Ruangwa District (Lindi) |  | wildfire 7.9, flood 4.5, environmentalDegradation 4.1 | drought, floods, wildfire, strongWinds, heavyRainfall |
| Mtwara District (Mtwara) | ✗ | stormsCyclone 10, flood 8.2, coastalHazards 6 | largeWaves, floods, heavyRainfall, publicHealth |
| Nanyamba Town (Mtwara) | ✗ | stormsCyclone 10, flood 8.2, earthquake 5.7 | largeWaves, floods, heavyRainfall, publicHealth |
| Mtwara Mikindani Municipal (Mtwara) | ✗ | earthquake 10, stormsCyclone 10, hazardousMaterial 6.6 | largeWaves, floods, strongWinds, heavyRainfall, publicHealth |
| Newala District (Mtwara) |  | stormsCyclone 10, wildfire 5.5, environmentalDegradation 5.1 | drought, heavyRainfall, strongWinds, floods |
| Newala Town (Mtwara) |  | stormsCyclone 10, wildfire 5.5, environmentalDegradation 5.1 | drought, heavyRainfall, strongWinds, landslide |
| Masasi District (Mtwara) |  | stormsCyclone 10, wildfire 5.5, environmentalDegradation 4.25 | drought, floods, wildfire, strongWinds, heavyRainfall |
| Masasi Town (Mtwara) |  | stormsCyclone 10, wildfire 5.5, hazardousMaterial 4.5 | floods, drought, strongWinds, wildfire |
| Tandahimba District (Mtwara) |  | stormsCyclone 10, wildfire 5.5, environmentalDegradation 5.15 | heavyRainfall, floods, drought, strongWinds, wildfire |
| Nanyumbu District (Mtwara) | ✗ | stormsCyclone 10, wildfire 5.5, flood 4.6 | drought, wildfire, floods, publicHealth |
| Tunduru District (Ruvuma) |  | wildfire 7.5, lightning 5.8, flood 4.2 | heavyRainfall, floods, wildfire |
| Songea District (Ruvuma) | ✗ | wildfire 7.5, landslide 5.9, lightning 5.3 | heavyRainfall, floods, strongWinds, drought |
| Songea Municipal (Ruvuma) | ✗ | wildfire 7.5, hazardousMaterial 5.7, vehicleAccidents 4.7 | heavyRainfall, floods, strongWinds, landslide |
| Madaba District (Ruvuma) |  | wildfire 7.5, landslide 5.9, lightning 5.8 | heavyRainfall, floods, strongWinds, wildfire |
| Mbinga District (Ruvuma) | ✗ | earthquake 9.4, landslide 7.8, wildfire 7.5 | heavyRainfall, landslide, floods |
| Mbinga Town (Ruvuma) | ✗ | earthquake 9.4, landslide 7.8, wildfire 7.5 | heavyRainfall, landslide, floods |
| Nyasa District (Ruvuma) |  | earthquake 9.9, wildfire 7.5, lightning 6.9 | floods, largeWaves, heavyRainfall, earthquake, strongWinds, landslide |
| Namtumbo District (Ruvuma) |  | wildfire 7.5, lightning 6.4, heatwave 3.8 | heavyRainfall, floods, wildfire |
| Iringa District (Iringa) |  | flood 6.7, wildfire 6, landslide 5.1 | heavyRainfall, floods, landslide, drought |
| Iringa Municipal (Iringa) |  | landslide 8.1, flood 6.7, hazardousMaterial 6.7 | heavyRainfall, floods, strongWinds, landslide |
| Mafinga Town (Iringa) | ✗ | environmentalDegradation 6.9, wildfire 6, hazardousMaterial 4.9 | heavyRainfall, strongWinds, floods, wildfire |
| Mufindi District (Iringa) | ✗ | environmentalDegradation 6.2, wildfire 6, landslide 5.3 | heavyRainfall, strongWinds, floods, wildfire, landslide |
| Kilolo District (Iringa) |  | landslide 7.5, wildfire 6, environmentalDegradation 5.4 | heavyRainfall, landslide, floods, strongWinds |
| Chunya District (Mbeya) |  | wildfire 6.6, earthquake 5.6, environmentalDegradation 5.6 | floods, heavyRainfall, wildfire |
| Mbeya District (Mbeya) |  | earthquake 10, landslide 7.1, wildfire 6.6 | heavyRainfall, landslide, floods, earthquake |
| Mbeya City (Mbeya) |  | earthquake 10, hazardousMaterial 7.6, wildfire 6.6 | heavyRainfall, floods, landslide, earthquake, strongWinds |
| Kyela District (Mbeya) |  | earthquake 10, flood 10, lightning 8.4 | floods, largeWaves, heavyRainfall, earthquake, publicHealth |
| Rungwe District (Mbeya) |  | earthquake 10, landslide 7.4, wildfire 6.6 | heavyRainfall, landslide, floods, earthquake |
| Busokelo District (Mbeya) | ✗ | earthquake 10, landslide 7.4, wildfire 6.6 | heavyRainfall, landslide, floods |
| Mbarali District (Mbeya) |  | flood 8.4, wildfire 6.6, volcano 5 | floods, heavyRainfall |
| Iramba District (Singida) | ✗ | earthquake 10, wildfire 7.65, flood 6.2 | drought, strongWinds, wildfire, floods, heavyRainfall, landslide |
| Singida District (Singida) | ✗ | earthquake 10, wildfire 7.65, flood 4 | drought, strongWinds, wildfire, floods |
| Singida Municipal (Singida) | ✗ | earthquake 10, wildfire 7.65, hazardousMaterial 5.8 | drought, strongWinds, wildfire, floods |
| Manyoni District (Singida) | ✗ | earthquake 9.2, wildfire 7.65, flood 7.4 | drought, wildfire, strongWinds, floods |
| Itigi District (Singida) | ✗ | earthquake 9.2, wildfire 7.65, flood 7.4 | drought, wildfire, strongWinds, floods |
| Ikungi District (Singida) | ✗ | earthquake 10, wildfire 7.65, flood 6.1 | drought, strongWinds, wildfire, floods |
| Mkalama District (Singida) | ✗ | earthquake 10, wildfire 7.65, flood 5.4 | drought, strongWinds, wildfire, floods |
| Nzega Town (Tabora) | ✗ | earthquake 8.4, wildfire 7.15, hazardousMaterial 5 | drought, heavyRainfall, strongWinds, floods, publicHealth |
| Nzega District (Tabora) | ✗ | earthquake 8.4, wildfire 7.15, flood 4.9 | drought, heavyRainfall, floods, strongWinds, publicHealth |
| Igunga District (Tabora) | ✗ | earthquake 10, wildfire 7.15, flood 6.6 | heavyRainfall, floods, drought, publicHealth |
| Uyui District (Tabora) |  | wildfire 7.15, flood 6.2, environmentalDegradation 4.2 | heavyRainfall, drought, strongWinds, floods, wildfire |
| Urambo District (Tabora) |  | wildfire 7.15, lightning 4.1, environmentalDegradation 3.9 | heavyRainfall, drought, strongWinds, wildfire, floods |
| Sikonge District (Tabora) |  | wildfire 7.15, flood 4.3, lightning 3.8 | wildfire, strongWinds, floods, drought, heavyRainfall |
| Tabora Municipal (Tabora) |  | wildfire 7.15, hazardousMaterial 4.9, environmentalDegradation 3.1 | strongWinds, heavyRainfall, publicHealth, floods, drought, wildfire |
| Kaliua District (Tabora) |  | wildfire 7.15, flood 5.7, environmentalDegradation 4.35 | heavyRainfall, floods, strongWinds, drought, wildfire, publicHealth |
| Kalambo District (Rukwa) |  | earthquake 10, landslide 6.3, environmentalDegradation 5.85 | earthquake, largeWaves, heavyRainfall, landslide, floods |
| Sumbawanga District (Rukwa) |  | earthquake 10, flood 7.2, wildfire 5.5 | earthquake, heavyRainfall, strongWinds, floods, drought |
| Sumbawanga Municipal (Rukwa) |  | earthquake 10, wildfire 5.5, environmentalDegradation 5 | earthquake, heavyRainfall, strongWinds, floods |
| Nkasi District (Rukwa) |  | earthquake 10, landslide 6.2, flood 6.1 | earthquake, largeWaves, floods, publicHealth, drought, strongWinds |
| Kibondo District (Kigoma) |  | wildfire 6.25, lightning 5.7, environmentalDegradation 3.1 | heavyRainfall, floods, wildfire |
| Kasulu District (Kigoma) | ✗ | earthquake 8.9, lightning 7, wildfire 6.25 | heavyRainfall, landslide, floods, publicHealth |
| Kasulu Town (Kigoma) | ✗ | earthquake 10, lightning 7.5, wildfire 6.25 | heavyRainfall, floods, strongWinds, landslide |
| Kigoma District (Kigoma) |  | earthquake 10, lightning 8.8, landslide 7.7 | earthquake, largeWaves, heavyRainfall, floods, publicHealth |
| Kigoma Ujiji Municipal (Kigoma) |  | earthquake 10, lightning 10, hazardousMaterial 7.2 | earthquake, largeWaves, heavyRainfall, publicHealth, landslide, floods |
| Uvinza District (Kigoma) |  | earthquake 9.7, flood 8.1, lightning 7.1 | earthquake, floods, largeWaves, heavyRainfall |
| Buhigwe District (Kigoma) | ✗ | earthquake 10, lightning 7.8, wildfire 6.25 | heavyRainfall, landslide, floods |
| Kakonko District (Kigoma) |  | wildfire 6.25, flood 5.8, environmentalDegradation 4.2 | heavyRainfall, floods, wildfire, drought, publicHealth |
| Ushetu District (Shinyanga) |  | wildfire 4.55, flood 4, environmentalDegradation 3.6 | drought, strongWinds, floods, wildfire, heavyRainfall |
| Kahama Municipal (Shinyanga) | ✗ | hazardousMaterial 5.4, wildfire 4.55, vehicleAccidents 3.6 | drought, floods, strongWinds |
| Msalala District (Shinyanga) | ✗ | wildfire 4.55, flood 4, hazardousMaterial 4 | drought, floods, strongWinds |
| Kishapu District (Shinyanga) | ✗ | earthquake 9.9, flood 7.4, wildfire 4.55 | drought, strongWinds, floods, heavyRainfall |
| Shinyanga District (Shinyanga) | ✗ | earthquake 5.9, flood 5.1, wildfire 4.55 | drought, strongWinds, wildfire, floods, heavyRainfall |
| Shinyanga Municipal (Shinyanga) | ✗ | earthquake 10, flood 7.4, hazardousMaterial 6 | drought, strongWinds, floods, heavyRainfall |
| Karagwe District (Kagera) | ✗ | environmentalDegradation 6.35, heatwave 5.5, flood 4.7 | heavyRainfall, landslide, floods, strongWinds |
| Bukoba District (Kagera) |  | flood 8.1, environmentalDegradation 6.85, heatwave 6.7 | floods, largeWaves, heavyRainfall, publicHealth, earthquake, landslide |
| Bukoba Municipal (Kagera) | ✗ | lightning 8.4, flood 8.1, heatwave 7.7 | floods, largeWaves, heavyRainfall, publicHealth, earthquake |
| Muleba District (Kagera) |  | flood 8, environmentalDegradation 6.95, landslide 6.5 | heavyRainfall, floods, largeWaves, landslide, publicHealth |
| Biharamulo District (Kagera) | ✗ | environmentalDegradation 6.95, wildfire 3.75, heatwave 3.3 | heavyRainfall, floods, wildfire |
| Ngara District (Kagera) | ✗ | environmentalDegradation 6.1, flood 5.3, wildfire 3.75 | heavyRainfall, floods, strongWinds, landslide, publicHealth |
| Kyerwa District (Kagera) | ✗ | environmentalDegradation 6.35, flood 6.1, heatwave 5.5 | heavyRainfall, floods, landslide |
| Missenyi District (Kagera) | ✗ | heatwave 7.6, flood 7.1, environmentalDegradation 6.55 | floods, largeWaves, heavyRainfall, earthquake |
| Ukerewe District (Mwanza) |  | flood 8.5, environmentalDegradation 5.05, hazardousMaterial 4.7 | largeWaves, floods, heavyRainfall, publicHealth |
| Magu District (Mwanza) |  | flood 6.4, hazardousMaterial 4.6, heatwave 4.1 | floods, largeWaves, publicHealth |
| Mwanza City (Mwanza) | ✗ | hazardousMaterial 8.2, vehicleAccidents 6.4, heatwave 3.6 | floods, largeWaves, heavyRainfall, publicHealth |
| Kwimba District (Mwanza) | ✗ | heatwave 3.4, flood 3.1, hazardousMaterial 3.1 | drought, floods, heavyRainfall, strongWinds |
| Sengerema District (Mwanza) |  | flood 7.9, landslide 7, environmentalDegradation 5 | floods, largeWaves, heavyRainfall, publicHealth |
| Buchosa District (Mwanza) |  | flood 7.9, landslide 7, environmentalDegradation 5 | floods, largeWaves, heavyRainfall, publicHealth |
| Ilemela Municipal (Mwanza) | ✗ | hazardousMaterial 7.4, flood 7, vehicleAccidents 5.9 | floods, largeWaves, heavyRainfall, publicHealth, landslide |
| Misungwi District (Mwanza) |  | flood 4.6, hazardousMaterial 4, environmentalDegradation 3.55 | floods, heavyRainfall, drought |
| Tarime District (Mara) | ✗ | earthquake 6.2, wildfire 5.55, environmentalDegradation 4.55 | heavyRainfall, floods, landslide |
| Tarime Town (Mara) | ✗ | earthquake 6.2, hazardousMaterial 5.8, wildfire 5.55 | heavyRainfall, floods, publicHealth |
| Serengeti District (Mara) |  | wildfire 5.55, heatwave 4.4, flood 3.8 | drought, wildfire, floods |
| Musoma District (Mara) |  | flood 6.9, wildfire 5.55, hazardousMaterial 4.2 | floods, largeWaves, heavyRainfall, publicHealth |
| Musoma Municipal (Mara) |  | flood 9.3, hazardousMaterial 7.7, vehicleAccidents 6.1 | floods, largeWaves, heavyRainfall, publicHealth |
| Bunda District (Mara) |  | flood 7.1, wildfire 5.55, landslide 4.1 | floods, largeWaves, heavyRainfall, publicHealth, drought |
| Bunda Town (Mara) |  | flood 7.1, wildfire 5.55, landslide 4.1 | floods, largeWaves, heavyRainfall |
| Butiama District (Mara) | ✗ | wildfire 5.55, flood 4.9, environmentalDegradation 4.1 | floods, heavyRainfall, largeWaves, publicHealth |
| Rorya District (Mara) | ✗ | earthquake 9.9, flood 5.9, wildfire 5.55 | floods, largeWaves, heavyRainfall, publicHealth |
| Babati District (Manyara) | ✗ | earthquake 10, drought 6.4, landslide 6.3 | drought, floods, strongWinds, wildfire, landslide |
| Babati Town (Manyara) | ✗ | earthquake 10, drought 6.4, landslide 6 | floods, drought, strongWinds |
| Hanang District (Manyara) | ✗ | earthquake 10, drought 6.4, flood 5.6 | drought, strongWinds, floods, wildfire, heavyRainfall, landslide |
| Mbulu District (Manyara) | ✗ | earthquake 10, drought 6.4, landslide 5.9 | heavyRainfall, landslide, drought, strongWinds, floods |
| Mbulu Town (Manyara) | ✗ | earthquake 10, drought 6.4, landslide 5.9 | heavyRainfall, landslide, strongWinds |
| Simanjiro District (Manyara) | ✗ | earthquake 9.8, flood 8.5, drought 6.4 | drought, wildfire, floods, heavyRainfall |
| Kiteto District (Manyara) | ✗ | earthquake 8.3, drought 6.4, environmentalDegradation 4.55 | drought, strongWinds, wildfire, floods |
| Njombe District (Njombe) | ✗ | environmentalDegradation 9.35, landslide 7.1, wildfire 5.15 | heavyRainfall, landslide, floods, strongWinds, wildfire |
| Njombe Town (Njombe) | ✗ | environmentalDegradation 9.5, landslide 6.2, lightning 5.3 | heavyRainfall, strongWinds, floods, wildfire |
| Makambako Town (Njombe) | ✗ | environmentalDegradation 8.6, hazardousMaterial 5.3, wildfire 5.15 | heavyRainfall, strongWinds, floods |
| Ludewa District (Njombe) | ✗ | earthquake 8.9, environmentalDegradation 8.5, landslide 7.5 | floods, largeWaves, heavyRainfall, landslide |
| Makete District (Njombe) | ✗ | earthquake 9.5, environmentalDegradation 8.85, landslide 7.8 | heavyRainfall, landslide, strongWinds |
| Wanging'ombe District (Njombe) | ✗ | environmentalDegradation 8.5, wildfire 5.15, flood 3.6 | heavyRainfall, floods, strongWinds, drought |
| Mpanda Municipal (Katavi) | ✗ | earthquake 10, wildfire 9.4, hazardousMaterial 5.5 | floods, drought, wildfire, heavyRainfall |
| Nsimbo District (Katavi) | ✗ | earthquake 10, wildfire 9.4, flood 5.4 | drought, wildfire, floods, heavyRainfall |
| Tanganyika District (Katavi) | ✗ | earthquake 10, wildfire 9.4, lightning 6.3 | drought, wildfire, floods, largeWaves, heavyRainfall |
| Mlele District (Katavi) |  | wildfire 9.4, earthquake 8.8, flood 7.5 | drought, wildfire, floods, heavyRainfall |
| Mpimbwe District (Katavi) |  | wildfire 9.4, earthquake 8.8, flood 7.5 | drought, wildfire, floods |
| Bariadi District (Simiyu) |  | wildfire 7.55, flood 4.9, heatwave 4.1 | drought, strongWinds, wildfire, floods, heavyRainfall |
| Bariadi Town (Simiyu) | ✗ | wildfire 7.55, flood 4.9, hazardousMaterial 4.7 | drought, strongWinds, floods, heavyRainfall |
| Itilima District (Simiyu) |  | wildfire 7.55, heatwave 4.3, earthquake 3.9 | drought, strongWinds, wildfire, floods, heavyRainfall |
| Meatu District (Simiyu) | ✗ | earthquake 10, wildfire 7.55, flood 7.5 | drought, strongWinds, wildfire, floods |
| Maswa District (Simiyu) | ✗ | earthquake 8.8, wildfire 7.55, flood 3.4 | drought, strongWinds, floods, heavyRainfall |
| Busega District (Simiyu) | ✗ | wildfire 7.55, flood 7.1, hazardousMaterial 3.9 | drought, strongWinds, floods, largeWaves, heavyRainfall |
| Geita District (Geita) |  | flood 6.1, wildfire 5.1, environmentalDegradation 4.05 | heavyRainfall, floods, publicHealth, largeWaves |
| Geita Town (Geita) |  | flood 6.1, wildfire 5.1, hazardousMaterial 4.9 | floods, largeWaves, heavyRainfall, publicHealth |
| Nyang'hwale District (Geita) | ✗ | wildfire 5.1, flood 4.9, hazardousMaterial 3.8 | heavyRainfall, floods |
| Mbogwe District (Geita) | ✗ | wildfire 5.1, environmentalDegradation 4.45, hazardousMaterial 3.2 | heavyRainfall, floods |
| Bukombe District (Geita) | ✗ | wildfire 5.1, flood 3.8, lightning 3.4 | heavyRainfall, floods |
| Chato District (Geita) |  | flood 7.2, wildfire 5.1, environmentalDegradation 4.2 | floods, largeWaves, heavyRainfall, publicHealth |
| Momba District (Songwe) |  | earthquake 10, flood 7.4, wildfire 6.5 | earthquake, heavyRainfall, floods, drought |
| Tunduma Town (Songwe) |  | earthquake 10, landslide 6.8, wildfire 6.5 | heavyRainfall, floods, strongWinds, earthquake, publicHealth |
| Songwe District (Songwe) |  | earthquake 9.8, flood 7.7, wildfire 6.5 | floods, heavyRainfall, strongWinds, earthquake |
| Mbozi District (Songwe) | ✗ | earthquake 10, wildfire 6.5, landslide 4.3 | heavyRainfall, floods, strongWinds |
| Ileje District (Songwe) | ✗ | earthquake 10, landslide 8.1, wildfire 6.5 | heavyRainfall, landslide, floods |
| Kaskazini A Town (Kaskazini Unguja) | ✗ | heatwave 7.9, vehicleAccidents 7.8, environmentalDegradation 6 | largeWaves, strongWinds, heavyRainfall, publicHealth |
| Kaskazini B Town (Kaskazini Unguja) | ✗ | vehicleAccidents 7.5, heatwave 6.6, flood 5.9 | largeWaves, floods, heavyRainfall, drought |
| Kati Town (Kusini Unguja) | ✗ | vehicleAccidents 6.7, coastalHazards 6.3, environmentalDegradation 5.9 | largeWaves, floods, heavyRainfall, publicHealth, drought |
| Kusini District (Kusini Unguja) | ✗ | environmentalDegradation 6.35, vehicleAccidents 6.3, flood 5.5 | largeWaves, strongWinds, heavyRainfall |
| Mjini Municipal (Mjini Magharibi) | ✗ | hazardousMaterial 10, vehicleAccidents 10, flood 5.9 | floods, largeWaves, strongWinds, earthquake, publicHealth, heavyRainfall, wildfire |
| Magharibi A Municipal (Mjini Magharibi) | ✗ | vehicleAccidents 8.3, heatwave 6.3, hazardousMaterial 6.1 | largeWaves, floods, heavyRainfall |
| Magharibi B Municipal (Mjini Magharibi) | ✗ | vehicleAccidents 8.3, environmentalDegradation 5.5, hazardousMaterial 5.5 | largeWaves, floods, heavyRainfall |
| Wete Town (Kaskazini Pemba) | ✗ | heatwave 9.8, flood 7.5, vehicleAccidents 6.4 | largeWaves, floods, heavyRainfall |
| Micheweni District (Kaskazini Pemba) | ✗ | heatwave 10, vehicleAccidents 6.7, coastalHazards 6.1 | largeWaves, strongWinds, heavyRainfall, publicHealth, drought |
| Chake Chake Town (Kusini Pemba) | ✗ | heatwave 7.9, vehicleAccidents 6.8, flood 6.4 | largeWaves, floods, strongWinds, heavyRainfall |
| Mkoani Town (Kusini Pemba) | ✗ | heatwave 7.7, flood 7.1, vehicleAccidents 6.6 | largeWaves, strongWinds, heavyRainfall, publicHealth |
