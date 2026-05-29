/**
 * INFORM Indicator Descriptions — authoritative guidance for data entry
 *
 * Every description below is sourced from the official INFORM Concept and
 * Methodology v2017 (JRC; Vernaccini) — the PDF at
 *   /inform-system/doc/INFORM Concept and Methodology Version 2017 Pdf FINAL.pdf
 *
 * Indicators marked `tanzaniaExtension` in informIndicatorDefinitions.js are
 * not in the INFORM 2017 Core but are operational additions in the Tanzania
 * subnational template (TZ_INFORM_model.xlsx). Their descriptions are
 * written from Tanzania operational context and are explicitly labelled as
 * such so reviewers know the difference.
 *
 * Each entry:
 *   measures   — what the indicator actually quantifies (one sentence)
 *   source     — canonical / authoritative data source
 *   why        — why it matters for risk (causal link)
 *   pdfRef     — PDF section reference (for accountability)
 *   guidance   — how the regional team should fill it (concrete examples)
 *
 * If you change a description, update the PDF reference too. This file is
 * the contract between the methodology and the data-entry user.
 */

export const INDICATOR_DESCRIPTIONS = {
  // ════════════════════════════════════════════════════════════════════════
  //   HAZARD & EXPOSURE  (PDF Chapter 4.2, pp. 18–29)
  // ════════════════════════════════════════════════════════════════════════
  //
  // The Hazard & Exposure dimension reflects the probability of physical
  // exposure to specific hazards. If there is no physical exposure, risk is
  // zero — no matter how vulnerable the population (PDF p.18). The metric
  // used in INFORM is the Annual Average Exposed Population (AAEP) per
  // hazard, scaled with min-max normalisation.

  // ─── Natural Hazards ───────────────────────────────────────────────────
  earthquake_exposure: {
    measures: 'Population physically exposed to earthquake shaking.',
    source: 'Global Earthquake Model (GEM) Global Seismic Hazard Map — Peak Ground Acceleration (PGA), 10% probability of exceedance in 50 years.',
    why: 'PDF §4.2.2.3 (p.24): "Earthquakes can be one of the most destructive natural hazards. The unpredictability of the seismic event can cause several fatalities in areas with high physical vulnerability of the buildings (2010 Haiti, 2015 Nepal)." INFORM 2017 derives two hazard zones at MMI VI (light damage) and MMI VIII (heavy damage), combined by geometric mean.',
    pdfRef: '§4.2.2.3, p.24; Table 4',
    guidance: 'Tanzania uses the PGA value rescaled to 0–10. Enter the seismic exposure index for the district. Low risk: <2 (mostly tectonically stable). High risk: 7–10 (active rift / proximity to East African Rift System; e.g. Kagera, Singida).'
  },
  flood_exposure: {
    measures: 'Population in areas inundated by a 1-in-100 year flood.',
    source: 'JRC / GAR 2015 flood hazard maps (return periods 25, 50, 100, 200, 500, 1000 years); GHSL Population Grid.',
    why: 'PDF §4.2.2.5 (pp.24–25): "Floods are often predictable natural hazards, which can encompass incredibly large areas, causing a very large impact on population (2010 Pakistan)." Tanzania uses 100-year RP, % of district population in inundated cells.',
    pdfRef: '§4.2.2.5, p.24–25; Table 4',
    guidance: 'Enter as % of district population exposed to inundation at the chosen return period. Low risk: <1% exposed. High risk: 10%+ (e.g. coastal lowlands, Rufiji Delta, urban areas with poor drainage).'
  },
  cyclone_exposure: {
    measures: 'Population exposed to Saffir-Simpson Category 1 (SS1) tropical cyclone wind.',
    source: 'GAR 2015 cyclone wind intensity maps at 100-year return period; GHSL Population Grid.',
    why: 'PDF §4.2.2.6 (p.25): "Tropical cyclones are some of the most damaging events. They occur in yearly cycles and affect different coastal population through high wind speeds (destroying dwellings and infrastructure), storm surge and associated floods (destroying crops) and heavy rainfall sometimes causing riverine floods and landslides." SS1 is the "light damage" threshold.',
    pdfRef: '§4.2.2.6, p.25; Table 4',
    guidance: 'Enter as % of district population in SS1+ cyclone footprint. Tanzania mainland sees infrequent cyclone exposure; Zanzibar / Pemba may see higher. Low risk: 0–1%. High risk: 5%+.'
  },
  storm_exposure: {
    measures: 'Population exposed to storm surge inundation.',
    source: 'GAR 2015 Storm surge hazard maps (10, 25, 50, 100, 250 year RPs); SRTM-90 DEM.',
    why: 'PDF §4.2.2.6 (p.25): Storm surge is associated with tropical cyclones; the GAR 2015 dataset gives expected surge level along the coast which combined with the DEM yields inundated areas.',
    pdfRef: '§4.2.2.6, p.25; Table 4',
    guidance: 'Coastal districts only. Enter % of population in inundated areas at chosen RP. Low risk: 0% (inland districts). High risk: 5%+ (coastal Pwani, Tanga, Lindi, Mtwara).'
  },
  cyclone_max_speed: {
    measures: 'Population exposed to Saffir-Simpson Category 3 (SS3) cyclone — devastating wind speeds (178–208 km/h).',
    source: 'GAR 2015 cyclone wind intensity maps at 100-year return period; GHSL Population Grid.',
    why: 'PDF §4.2.2.6 (p.25) and Table 3: SS3 is the "moderate/heavy damage" threshold. INFORM aggregates SS1 and SS3 hazard zones with geometric mean so that countries exposed to very-high-intensity events are not under-weighted.',
    pdfRef: '§4.2.2.6 / Table 3, p.21; Table 4, p.22',
    guidance: 'Coastal districts. Enter % of population in SS3 cyclone footprint. Low risk: 0%. High risk: 1%+ (very rare in Tanzania but possible).'
  },
  historic_drought_frequency: {
    measures: 'Frequency of severe agricultural droughts in the last 30 years.',
    source: 'FAO Agricultural Stress Index (ASI) historical series; EM-DAT for impact validation.',
    why: 'PDF §4.2.2.7 (pp.25–26): "Drought is a complex process to model because of the inherent spatial and temporal uncertainty… INFORM combines (1) probability of agricultural drought (ASI) and (2) the population affected by droughts in recent years (materialised risk)." Frequency captures how often a district was in stress.',
    pdfRef: '§4.2.2.7, p.25–26; Table 4',
    guidance: 'Enter as frequency on 0–0.3 scale (proportion of years in stress over the historical record). Low risk: <0.05 (rare drought). High risk: 0.2+ (chronic drought zones — Dodoma, Singida, Manyara, Shinyanga).'
  },

  // ─── Human Hazards ─────────────────────────────────────────────────────
  conflict_barometer: {
    measures: 'Current conflict intensity — armed conflict level on the HIIK 1–5 scale.',
    source: 'Heidelberg Institute for International Conflict Research (HIIK) Conflict Barometer.',
    why: 'PDF §4.2.3.3 (pp.27–28): HIIK distinguishes 5 intensity levels (dispute, non-violent crisis, violent crisis, limited war, war). INFORM only counts violent conflicts (levels 4–5) and recodes National Power vs Subnational separately (Table 9: National war = 10, Subnational war = 9).',
    pdfRef: '§4.2.3.3, p.27–28; Tables 8 & 9',
    guidance: 'Enter the HIIK intensity level (4 for limited war, 5 for war). If no violent conflict, leave blank — 0 implies "no data", not "no conflict". For Tanzania this is generally low.'
  },
  gcri_conflict_probability: {
    measures: 'Projected probability of violent conflict in the next 4 years.',
    source: 'JRC Global Conflict Risk Index (GCRI). 24 quantitative variables: conflict history, regime type, GDP per capita, ethnic composition, inequality (SWIIID), etc.',
    why: 'PDF §4.2.3.4 (p.29) / Figure 6: "If a country does not experience highly violent conflict in the year of observation, INFORM estimates instead the Projected Risk of Conflict using GCRI. The risk for either violent conflict (VC) or highly violent conflict (HVC) is calculated using the geometric average of the probability for either type of conflict, with a log transformation of the HVC. A probability of 95% is thereby equivalent to a risk level of 7."',
    pdfRef: '§4.2.3.4, p.29; Figure 6',
    guidance: 'Enter probability 0–0.95 (or pre-rescaled 0–10 if using SADC template). The Tanzania value is generally low. Low risk: <0.1. High risk: 0.5+.'
  },

  // ─── Tanzania subnational extensions (not in INFORM Core) ──────────────
  coastal_erosion: {
    measures: 'Annual rate of coastline retreat along the district shoreline.',
    source: 'Digital Earth Africa Coastlines dataset (2000–2023). Annual shoreline regression in m/year.',
    why: 'Tanzania extension — INFORM Core does not separate coastal erosion. Added for SADC subnational model because shoreline retreat threatens coastal communities and infrastructure (Bagamoyo, Mafia, Pemba).',
    pdfRef: 'Tanzania subnational extension (PDF Box 1 authorises Sahel/Lebanon-style additions)',
    guidance: 'Coastal districts only. Negative raw values = retreat, positive = growth; the Tanzania template stores absolute retreat rate in m/year, rescaled 0–10. Low risk: <0.5 m/yr. High risk: 2+ m/yr.'
  },
  sea_level_rise: {
    measures: 'Projected sea-level rise contribution to district coastal exposure.',
    source: 'Climate projection composite (Tanzania-specific; combines IPCC AR6 + local tide gauge data).',
    why: 'Tanzania extension — captures slow-onset coastal hazard amplifying the cyclone/storm surge risk.',
    pdfRef: 'Tanzania extension',
    guidance: 'Coastal districts. Enter rescaled 0–10 index. Low risk: 0 (inland). High risk: 7+ (low-lying coast).'
  },
  deforestation_treecover_loss: {
    measures: 'Percentage of district tree cover lost between 2000 and 2022.',
    source: 'Global Forest Watch / Hansen tree-cover loss raster.',
    why: 'Tanzania extension — deforestation amplifies flood and landslide risk and degrades livelihoods. Not in INFORM Core (PDF §5.2 excludes biological/environmental degradation hazards).',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter % tree cover lost over the period. Low risk: <5%. High risk: 30%+.'
  },
  soil_erosion: {
    measures: 'Net soil erosion rate (difference between natural and actual erosion).',
    source: 'JRC ESDAC Land Degradation Debt dataset.',
    why: 'Tanzania extension — soil degradation reduces agricultural productivity and amplifies drought vulnerability.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter rescaled 0–10 index of erosion debt. Low risk: 0–2 (stable). High risk: 7+ (active degradation).'
  },
  heatwave_exposure: {
    measures: 'Population exposed to extreme heat days (Tmax > local 95th percentile).',
    source: 'Tanzania Meteorological Authority climatology; ERA5 reanalysis.',
    why: 'Tanzania extension — heat-related morbidity and crop stress.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter rescaled 0–10 index. Low risk: 0–3 (highland). High risk: 7+ (lowland arid zones).'
  },
  landslide_exposure: {
    measures: 'Population in areas of high landslide hazard.',
    source: 'World Bank Global Landslide Hazard map.',
    why: 'PDF Box 1 (p.18) explicitly allows landslides as a subnational extension (cited example: Colombia). Tanzania includes for highland districts.',
    pdfRef: 'PDF Box 1 (subnational extension)',
    guidance: 'Enter % population in high/very-high landslide hazard zones. Low risk: 0% (flat districts). High risk: 5%+ (Mbeya highlands, Kilimanjaro foothills).'
  },
  lightning_casualties: {
    measures: 'Reported lightning casualties per year.',
    source: 'Tanzania National Disaster Database (PMO-DMD).',
    why: 'Tanzania extension — Tanzania has globally high lightning strike density.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter casualties or rescaled 0–10 index. Low risk: 0. High risk: 5+ casualties per year per district.'
  },
  volcano_exposure: {
    measures: 'Population near active or recently active volcanoes.',
    source: 'NOAA Significant Volcanic Eruptions database (Volcanic Explosivity Index).',
    why: 'Tanzania extension — Ol Doinyo Lengai is the only currently active volcano. Few districts affected (Arusha, Manyara).',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter VEI index (0–8) or rescaled 0–10. Most districts: 0. High risk: 5+ for districts within 50 km of Ol Doinyo Lengai.'
  },
  burned_area: {
    measures: 'Annual area burned (wildfire) as % of district area.',
    source: 'MODIS Burned Area product (FIRMS).',
    why: 'PDF Box 1 (p.18) allows wildfire as a subnational extension (Lebanon example). Tanzania includes for grassland/forest districts.',
    pdfRef: 'PDF Box 1 (subnational extension)',
    guidance: 'Enter % of district area burned annually (averaged over a 5-year period). Low risk: <0.5%. High risk: 5%+.'
  },
  fire_weather_index: {
    measures: 'Mean Fire Weather Index — proxy for fire ignition / spread potential.',
    source: 'Canadian Fire Weather Index from ERA5 reanalysis.',
    why: 'Tanzania extension — complements burned area with forward-looking susceptibility.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter rescaled 0–10 index. Low risk: 0–3 (humid). High risk: 7+ (dry-season savanna).'
  },
  animal_diseases: {
    measures: 'Incidence of priority animal diseases (anthrax, rift valley fever, foot-and-mouth).',
    source: 'Ministry of Livestock & Fisheries Tanzania; FAO EMPRES-i database.',
    why: 'Tanzania extension. PDF §5.2 (p.45) explicitly excludes biological hazards from INFORM Core but Tanzania regional teams flagged livestock disease as a major rural livelihood threat.',
    pdfRef: 'Tanzania extension (excluded from PDF Core per §5.2)',
    guidance: 'Enter rescaled 0–10 index from outbreak frequency / severity. Low risk: 0–2. High risk: 7+ (active outbreak districts).'
  },
  plant_diseases: {
    measures: 'Incidence of priority plant diseases (banana bunchy top, maize lethal necrosis).',
    source: 'Ministry of Agriculture Tanzania; CABI Plantwise.',
    why: 'Tanzania extension — crop diseases threaten food security and rural livelihoods.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter rescaled 0–10 index. Low risk: 0–2. High risk: 7+ (active epidemic districts).'
  },
  pests: {
    measures: 'Pest infestation intensity — locust, fall armyworm, larger grain borer.',
    source: 'FAO Desert Locust Watch; Ministry of Agriculture Tanzania.',
    why: 'Tanzania extension — pest outbreaks (esp. fall armyworm post-2017) cause major crop loss.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter rescaled 0–10 index. Low risk: 0–2 (no current outbreak). High risk: 7+ (active outbreak with crop loss reports).'
  },
  hazardous_material: {
    measures: 'Hazardous-material incident risk (industrial accidents, chemical spills, mining waste).',
    source: 'Tanzania National Environment Management Council (NEMC).',
    why: 'Tanzania extension. PDF §5.2 (p.45) excludes technological hazards from INFORM Core, but Tanzania includes for industrial districts (Dar es Salaam, Mwanza, mining belt).',
    pdfRef: 'Tanzania extension (excluded from PDF Core per §5.2)',
    guidance: 'Enter rescaled 0–10 index. Low risk: 0–2 (rural). High risk: 7+ (industrial / mining districts).'
  },
  violence_events: {
    measures: 'Number of violent events reported in the last 12 months.',
    source: 'ACLED — Armed Conflict Location & Event Data Project.',
    why: 'Tanzania extension — captures sub-national instability not picked up by HIIK national conflict barometer.',
    pdfRef: 'Tanzania extension (Box 1, p.18 cites ACLED for subnational adaptation)',
    guidance: 'Enter raw event count. Engine applies log1p transform. Low risk: 0. High risk: 100+.'
  },
  violence_fatalities: {
    measures: 'Number of fatalities from violent events in the last 12 months.',
    source: 'ACLED.',
    why: 'Tanzania extension — fatalities reflect severity, not just frequency.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter raw fatality count. Engine applies log1p transform. Low risk: 0. High risk: 50+.'
  },
  vehicle_accidents: {
    measures: 'Road traffic accident rate (deaths per 100 000 population).',
    source: 'Tanzania Traffic Police Annual Report.',
    why: 'Tanzania extension — Tanzania has one of the highest road fatality rates per vehicle in Africa.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter rate per 100k or rescaled 0–10 index. Low risk: 0–2. High risk: 7+ (urban transit corridors).'
  },

  // ════════════════════════════════════════════════════════════════════════
  //   VULNERABILITY  (PDF Chapter 4.3, pp. 30–39)
  // ════════════════════════════════════════════════════════════════════════
  //
  // The Vulnerability dimension addresses the intrinsic predispositions of an
  // exposed population to be affected. Hazard-independent indicators only.
  // Two categories (Socio-Economic Vuln + Vulnerable Groups) aggregated by
  // geometric average in PDF; Tanzania Excel uses arithmetic mean.

  // ─── Socio-Economic Vulnerability ──────────────────────────────────────
  hdi: {
    measures: 'Human Development Index — composite of life expectancy, education, and GNI per capita.',
    source: 'UNDP Human Development Report.',
    why: 'PDF §4.3.3.3 (p.33): "The Human Development Index covers both social and economic development and combines factors of life expectancy, educational attainment, and income." Component weight 50% within Development & Deprivation (PDF Table 11). Tanzania Excel uses equal weighting.',
    pdfRef: '§4.3.3.3, p.33; Table 10',
    guidance: 'POSITIVE polarity — higher HDI = lower risk. Enter on 0.3–0.95 scale (Tanzania national HDI ~0.55). For districts, use disaggregated subnational HDI if available. Low risk: 0.8+ (developed). High risk: ≤0.4 (least developed).'
  },
  gender_inequality_index: {
    measures: 'UNDP Gender Inequality Index — disparities between men and women in reproductive health, empowerment, labour market.',
    source: 'UNDP Human Development Report.',
    why: 'PDF §4.3.3.4 (pp.33–34): "The Gender Inequality Index by UNDP exposes differences in the distribution of achievements between men and women. There is a relationship between high inequality and weak growth in developing countries."',
    pdfRef: '§4.3.3.4, p.33–34; Table 10',
    guidance: 'NEGATIVE polarity — higher GII = higher risk. Range 0–0.75 (0 = perfect equality). Tanzania national value ≈ 0.5. Low risk: ≤0.3. High risk: 0.6+.'
  },
  multidimensional_poverty: {
    measures: 'OPHI Multidimensional Poverty Index — overlapping deprivations across health, education, living standards at the household level.',
    source: 'UNDP / OPHI MPI report.',
    why: 'PDF §4.3.3.3 (p.33): "MPI identifies overlapping deprivations at the household level… includes the average number of poor people and deprivations." Component weight 50% with HDI in Development & Deprivation.',
    pdfRef: '§4.3.3.3, p.33; Table 10',
    guidance: 'NEGATIVE polarity. Range 0.05–0.5 (0 = no multi-dimensional poverty). Tanzania value ≈ 0.27. Low risk: ≤0.1. High risk: 0.4+.'
  },
  wealth_inequality: {
    measures: 'Gini coefficient of wealth or income — distribution of resources within district population.',
    source: 'World Bank PovcalNet (income) or Demographic & Health Survey (wealth, regional).',
    why: 'PDF §4.3.3.4 (pp.33–34): "Income inequalities are linked to and can reinforce other inequalities such as education and health inequality."',
    pdfRef: '§4.3.3.4, p.33; Table 10',
    guidance: 'NEGATIVE polarity. Range 25–65 (Gini 0–100). Tanzania ≈ 40. Low risk: ≤30. High risk: 50+.'
  },
  oda_received: {
    measures: 'Net Official Development Assistance received as % of Gross National Income.',
    source: 'World Bank / OECD-DAC.',
    why: 'PDF §4.3.3.5 (p.34): "Aid dependency points out countries that lack sustainability in development growth due to economic instability and humanitarian crisis. Lower investments can hamper future progress in sanitation and water supply."',
    pdfRef: '§4.3.3.5, p.34; Table 10',
    guidance: 'NEGATIVE polarity — higher dependency = higher risk. Tanzania ≈ 4–6% GNI. Low risk: <2%. High risk: 10%+.'
  },
  personal_remittances: {
    measures: 'Personal remittances received as % of GDP.',
    source: 'World Bank Remittance Prices Worldwide.',
    why: 'Tanzania extension. PDF §4.3.3.5 (p.34) lists remittances as a CONSIDERED but NOT ADOPTED indicator: "they would address economic vulnerability in a country as a risk to have its development hampered by financial shocks." Tanzania includes for completeness; treat with caution.',
    pdfRef: 'Tanzania extension (PDF considered & rejected, p.34)',
    guidance: 'Tanzania national ≈ 0.7% GDP. Low risk: <2%. High risk: 10%+ (uncommon).'
  },
  dependency_ratio: {
    measures: 'Age-dependency ratio — ratio of children (<15) and elderly (>65) to working-age population.',
    source: 'World Bank / National Bureau of Statistics census data.',
    why: 'Tanzania extension — high dependency ratios indicate larger share of population needing support during disasters.',
    pdfRef: 'Tanzania extension',
    guidance: 'NEGATIVE polarity. Range 30–110 (ratio of dependents to workers, ×100). Tanzania ≈ 90. Low risk: <50. High risk: 100+.'
  },
  informal_settlements: {
    measures: 'Population living in informal settlements as % of district urban population.',
    source: 'UN-Habitat State of African Cities.',
    why: 'Tanzania extension — informal housing is physically vulnerable to floods, fires, and disease outbreaks.',
    pdfRef: 'Tanzania extension',
    guidance: 'NEGATIVE polarity. Range 0–100%. Tanzania urban districts ≈ 60–80%. Low risk: <20%. High risk: 70%+.'
  },
  homes_high_risk_areas: {
    measures: 'Count of homes located in mapped high-risk zones (flood plains, landslide-prone slopes).',
    source: 'District-level hazard maps + building footprints.',
    why: 'Tanzania extension — direct measure of physical vulnerability.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter raw count (engine applies log1p). Low risk: <100. High risk: 10000+.'
  },
  urban_population: {
    measures: 'Urban population as % of district total.',
    source: 'National Bureau of Statistics census.',
    why: 'Tanzania extension — urban populations face different vulnerability profile (informal housing, infrastructure dependence).',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–100%. Tanzania districts vary widely. Low risk: <30%. High risk: 80%+.'
  },
  food_insufficient: {
    measures: 'Households reporting insufficient food consumption in the past 12 months (%).',
    source: 'Tanzania Comprehensive Food Security & Nutrition Assessment (CFSNA).',
    why: 'Tanzania extension — proxies for chronic food insecurity at household level.',
    pdfRef: 'Tanzania extension (PDF puts Food Security under Vulnerable Groups, §4.3.4.7)',
    guidance: 'Range 0–100%. Tanzania national ≈ 25%. Low risk: <10%. High risk: 50%+.'
  },
  food_ipc_classification: {
    measures: 'Integrated Food-security Phase Classification (IPC) — 1 (Minimal) to 5 (Famine).',
    source: 'IPC Tanzania reports.',
    why: 'PDF Box 4 (p.39) mentions IPC as a more adequate but sparser alternative to undernourishment. Tanzania uses where available.',
    pdfRef: 'PDF Box 4, p.39',
    guidance: 'Enter IPC phase 1–5 for district. Low risk: 1–2. High risk: 4–5.'
  },

  // ─── Vulnerable Groups ──────────────────────────────────────────────────
  internal_displaced: {
    measures: 'Number of internally displaced persons (IDPs) currently in the district.',
    source: 'IDMC Global IDP Database; UNHCR Tanzania Operation.',
    why: 'PDF §4.3.4.3 (p.38): "Uprooted people are effectively weighted more because they are not a part of the society or the social system, are only partially supported by the community and often trigger the humanitarian intervention." Combined with refugees + returnees.',
    pdfRef: '§4.3.4.3, p.38; Table 12',
    guidance: 'Enter raw count (engine applies log1p). PDF recommends combining absolute (log) + relative (% of pop using Table 14 GNA brackets: >10%→10, >3%→8.3, etc.). Low risk: 0. High risk: 100 000+.'
  },
  refugees_asylum_seekers: {
    measures: 'Number of refugees + asylum-seekers + returned refugees in the district.',
    source: 'UNHCR Tanzania Operation.',
    why: 'Same as internal_displaced (PDF §4.3.4.3). Tanzania hosts large refugee populations in Kigoma (Nyarugusu, Nduta, Mtendeli camps).',
    pdfRef: '§4.3.4.3, p.38; Table 12',
    guidance: 'Enter raw count (engine applies log1p). Low risk: 0. High risk: 100 000+ (camp districts).'
  },
  malaria_mortality: {
    measures: 'Malaria mortality rate (deaths per 100 000 population per year).',
    source: 'WHO Tanzania Malaria Programme; Ministry of Health DHIS2.',
    why: 'PDF Table 12 (p.36): Malaria, TB, HIV-AIDS are the three deadly infectious diseases used to indicate Health Conditions vulnerability. Component weight: 1/3 of Health Conditions sub-component.',
    pdfRef: '§4.3.4.4, p.38; Table 12',
    guidance: 'Range 0–120 per 100k. Tanzania national ≈ 40 per 100k. Low risk: <10. High risk: 80+.'
  },
  tuberculosis_incidence: {
    measures: 'TB prevalence (cases per 100 000 population).',
    source: 'WHO Global TB Programme; Ministry of Health.',
    why: 'PDF §4.3.4.4 (p.38): One of three "deadly infectious diseases" tracked by INFORM as health vulnerability proxies.',
    pdfRef: '§4.3.4.4, p.38; Table 12',
    guidance: 'Range 0–550 per 100k. Tanzania national ≈ 235 per 100k. Low risk: <100. High risk: 400+.'
  },
  child_mortality: {
    measures: 'Under-5 mortality rate (deaths per 1 000 live births).',
    source: 'UNICEF / WHO Child Mortality Estimates; Tanzania DHS.',
    why: 'PDF §4.3.4.5 (p.38): "Child mortality shows general health condition of the children… more than one third of children deaths occur within the first month of life and to how well the country tackles major childhood diseases."',
    pdfRef: '§4.3.4.5, p.38; Table 12',
    guidance: 'Range 0–130 per 1000. Tanzania ≈ 49 per 1000. Low risk: <30. High risk: 80+.'
  },
  children_underweight: {
    measures: 'Children under 5 who are underweight (%).',
    source: 'Tanzania Demographic & Health Survey (DHS).',
    why: 'PDF §4.3.4.5 (p.38): "Children Underweight extracts the group of children that are in a weak health condition mainly due to hunger." Combined with child mortality in Children Under 5 sub-component.',
    pdfRef: '§4.3.4.5, p.38; Table 12',
    guidance: 'Range 0–45%. Tanzania ≈ 14%. Low risk: <10%. High risk: 30%+.'
  },
  people_affected_disasters: {
    measures: 'Relative number of people affected by natural disasters in the last 3 years (% of population).',
    source: 'EM-DAT (CRED); Tanzania National Disaster Database.',
    why: 'PDF §4.3.4.6 (p.38): "Recent shocks subcomponent accounts for increased vulnerability during the recovery period and considers people affected by natural disasters in the past 3 years. The affected people from the most recent year are considered fully while affected people from the previous years are scaled down with the factor 0.5 and 0.25."',
    pdfRef: '§4.3.4.6, p.38; Table 12',
    guidance: 'Range 0–10% of population. Tanzania national usually <2%. Low risk: <1%. High risk: 5%+.'
  },

  // Tanzania extensions in Vulnerable Groups
  life_expectancy: {
    measures: 'Life expectancy at birth (years).',
    source: 'WHO; Tanzania Bureau of Statistics.',
    why: 'Tanzania extension — adds finer life-expectancy detail beyond INFORM Core HDI sub-component.',
    pdfRef: 'Tanzania extension (component of HDI in PDF)',
    guidance: 'POSITIVE polarity. Range 40–85 years. Tanzania ≈ 66. Low risk: 75+. High risk: ≤55.'
  },
  cholera_cases: {
    measures: 'Reported cholera cases in the last 12 months.',
    source: 'Ministry of Health IDSR reports.',
    why: 'Tanzania extension — cholera outbreaks are a recurrent rapid-onset health hazard.',
    pdfRef: 'Tanzania extension',
    guidance: 'Enter raw count (engine applies log1p). Low risk: 0. High risk: 1000+.'
  },
  malaria_prevalence: {
    measures: 'Malaria parasite prevalence (% of population).',
    source: 'Tanzania Malaria Indicator Survey.',
    why: 'Tanzania extension — complements malaria mortality with infection rate.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–100%. Tanzania ≈ 7% (highly variable by region). Low risk: <2%. High risk: 30%+.'
  },
  measles_incidence: {
    measures: 'Measles cases per 100 000 population per year.',
    source: 'WHO; Ministry of Health IDSR.',
    why: 'Tanzania extension — measles outbreaks indicate immunisation gaps and surveillance weakness.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–500 per 100k. Low risk: <10. High risk: 200+.'
  },
  dst_prevalence: {
    measures: 'Drug-susceptibility testing prevalence (proxy for MDR-TB).',
    source: 'Ministry of Health TB Programme.',
    why: 'Tanzania extension.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–100%. Low risk: <5%. High risk: 20%+.'
  },
  people_disabilities: {
    measures: 'People living with disabilities (%).',
    source: 'Tanzania Disability Survey; National Census.',
    why: 'Tanzania extension — disability heightens humanitarian need in disaster contexts.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–100%. Tanzania ≈ 7%. Low risk: <5%. High risk: 15%+.'
  },
  people_chronic_illness: {
    measures: 'People with diagnosed chronic illness (HIV, diabetes, hypertension) as % of adult population.',
    source: 'STEPwise Survey; Ministry of Health DHIS2.',
    why: 'Tanzania extension — chronic-illness patients need continued care; care interruption during disasters increases mortality.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–100%. Tanzania ≈ 8%. Low risk: <5%. High risk: 25%+.'
  },
  neonatal_mortality: {
    measures: 'Neonatal mortality rate (deaths in first 28 days per 1000 live births).',
    source: 'Tanzania DHS.',
    why: 'Tanzania extension — finer breakdown of child mortality.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–50 per 1000. Tanzania ≈ 24. Low risk: <15. High risk: 35+.'
  },
  infant_mortality: {
    measures: 'Infant mortality rate (deaths in first year per 1000 live births).',
    source: 'Tanzania DHS.',
    why: 'Tanzania extension — finer breakdown of child mortality.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–100 per 1000. Tanzania ≈ 36. Low risk: <30. High risk: 70+.'
  },
  unemployed_population: {
    measures: 'Unemployed population aged 15–59 (%).',
    source: 'Tanzania Integrated Labour Force Survey.',
    why: 'Tanzania extension — economic vulnerability indicator.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–50%. Tanzania ≈ 9%. Low risk: <5%. High risk: 25%+.'
  },
  female_headed_households: {
    measures: 'Female-headed households (%).',
    source: 'Tanzania DHS / Census.',
    why: 'Tanzania extension — female-headed households face higher poverty rates and during disasters bear amplified care responsibilities.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–100%. Tanzania ≈ 25%. Low risk: <15%. High risk: 40%+.'
  },
  child_headed_households: {
    measures: 'Child-headed households (%).',
    source: 'Tanzania DHS.',
    why: 'Tanzania extension — extreme vulnerability indicator.',
    pdfRef: 'Tanzania extension',
    guidance: 'Range 0–100%. Tanzania <1%. Low risk: 0%. High risk: 3%+.'
  },

  // ════════════════════════════════════════════════════════════════════════
  //   LACK OF COPING CAPACITY  (PDF Chapter 4.4, pp. 40–44)
  // ════════════════════════════════════════════════════════════════════════
  //
  // Coping capacity = ability of country to cope with disasters via formal,
  // organised activities and existing infrastructure. Inverted at indicator
  // level (POSITIVE polarity) so the dimension represents LACK of coping.

  // ─── Institutional ─────────────────────────────────────────────────────
  sendai_framework: {
    measures: 'Tanzania alignment with the Sendai Framework / HFA — DRR self-assessment score.',
    source: 'UNDRR Sendai Monitor; Tanzania VNR.',
    why: 'PDF §4.4.4.1 (p.42): "The indicator for Disaster Risk Reduction activity comes from the Hyogo Framework for Action self-assessment reports… Sendai Framework will replace the HFA scores within the DRR component as soon as available." Range 1–5 (1=no progress, 5=comprehensive achievement).',
    pdfRef: '§4.4.4.1, p.42; Table 15',
    guidance: 'POSITIVE polarity — higher = more capacity = less risk. Range 1–5. Tanzania ≈ 3. Low risk: 5. High risk: 1.'
  },
  government_effectiveness: {
    measures: 'Government Effectiveness Index — WGI dimension on quality of public services, civil service, policy formulation.',
    source: 'World Bank Worldwide Governance Indicators.',
    why: 'PDF §4.4.4.2 (p.43): "The Government Effectiveness captures perceptions of the quality of public services, the quality of the civil service and the degree of its independence from political pressures."',
    pdfRef: '§4.4.4.2, p.43; Table 15',
    guidance: 'POSITIVE polarity. Range -2.5 to 2.5 (WGI scale). Tanzania ≈ -0.5. Low risk: 1.0+. High risk: -2.0 or below.'
  },
  subnational_corruption: {
    measures: 'Subnational Corruption Perception — citizen-reported corruption in district services.',
    source: 'Tanzania Afrobarometer; CPI (Transparency International) as proxy.',
    why: 'PDF §4.4.4.2 (p.43): "The Corruption Perception Index adds another perspective, that is the level of misuse of political power for private benefit." Note: this code stores the INVERTED CPI (so higher = more corrupt) for Tanzania operational use.',
    pdfRef: '§4.4.4.2, p.43; Table 15',
    guidance: 'NEGATIVE polarity in Tanzania template (stores inverted CPI: higher = more corrupt). Range 0–100. Tanzania ≈ 60 (inverted). Low risk: <30. High risk: 70+.'
  },
  traditional_knowledge: {
    measures: 'Presence and use of indigenous / traditional disaster knowledge in DRR planning.',
    source: 'Regional DRR committee self-assessment.',
    why: 'Tanzania extension — traditional knowledge (rainfall prediction, evacuation routes, sacred no-build zones) strengthens local coping.',
    pdfRef: 'Tanzania extension',
    guidance: 'POSITIVE polarity. Range 0–10 (0 = not documented, 10 = formally integrated in plans).'
  },
  early_warning_system: {
    measures: 'District early warning system maturity — coverage, dissemination channels, drill frequency.',
    source: 'Regional DRR committee assessment using PMO-DMD checklist.',
    why: 'Tanzania extension — direct measure of an institutional coping capability.',
    pdfRef: 'Tanzania extension',
    guidance: 'POSITIVE polarity. Range 0–10 (0 = no EWS, 10 = multi-hazard, multi-channel, regularly tested).'
  },

  // ─── Infrastructure ────────────────────────────────────────────────────
  measles_immunization: {
    measures: 'Children aged 1 year fully immunised against measles (%).',
    source: 'WHO/UNICEF Coverage Estimates.',
    why: 'PDF §4.4.5.4 (p.44): One of the three "Access to Health System" proxies (physicians density + health expenditure + measles immunisation). Indicates basic preventive-care reach.',
    pdfRef: '§4.4.5.4, p.44; Table 17',
    guidance: 'POSITIVE polarity. Range 60–99%. Tanzania ≈ 87%. Low risk: 95%+. High risk: <70%.'
  },
  physicians_density: {
    measures: 'Physicians per 10 000 population.',
    source: 'WHO Global Health Workforce.',
    why: 'PDF §4.4.5.4 (p.44): "Access to health system component is the arithmetic average of different proxy measures. We mainly try to assess the accessibility as well as the redundancy of the different assets of the existing health systems."',
    pdfRef: '§4.4.5.4, p.44; Table 17',
    guidance: 'POSITIVE polarity. Range 0–4 per 10k. Tanzania ≈ 0.4 (well below WHO threshold). Low risk: 3+. High risk: <0.5.'
  },
  health_expenditure_capita: {
    measures: 'Current health expenditure per capita (USD, PPP).',
    source: 'WHO Global Health Expenditure Database.',
    why: 'PDF §4.4.5.4 (p.44): Component of Access to Health System.',
    pdfRef: '§4.4.5.4, p.44; Table 17',
    guidance: 'POSITIVE polarity. Range 50–3000 USD. Tanzania ≈ $40. Low risk: 1000+. High risk: <100.'
  },
  maternal_mortality: {
    measures: 'Maternal Mortality Rate (deaths per 100 000 live births).',
    source: 'WHO Maternal Mortality Estimation.',
    why: 'PDF §3.5 (pp.15–16): NEW IN INFORM 2017. "Maternal mortality is one of the best integrated indicators of both the status of women and the strength of the health system… and the coping capacity of a country with regard to crisis." Added to Access to Health System component.',
    pdfRef: '§3.5, p.15–16; Table 18',
    guidance: 'NEGATIVE polarity. Range 0–1000 per 100k. Tanzania ≈ 524 per 100k. Low risk: <100. High risk: 600+.'
  },
  bcg_immunization: {
    measures: 'BCG (TB) immunisation coverage in children (%).',
    source: 'WHO/UNICEF Coverage Estimates.',
    why: 'Tanzania extension — complements measles immunisation as a broader EPI indicator.',
    pdfRef: 'Tanzania extension (PDF uses only measles)',
    guidance: 'POSITIVE polarity. Range 60–99%. Tanzania ≈ 88%. Low risk: 95%+. High risk: <70%.'
  },
  dtp3_immunization: {
    measures: 'DTP3 (diphtheria-tetanus-pertussis 3rd dose) immunisation coverage in children (%).',
    source: 'WHO/UNICEF Coverage Estimates.',
    why: 'Tanzania extension.',
    pdfRef: 'Tanzania extension',
    guidance: 'POSITIVE polarity. Range 60–99%. Tanzania ≈ 89%. Low risk: 95%+. High risk: <70%.'
  },
  health_facilities_density: {
    measures: 'Health facilities (dispensary + health centre + hospital) per 10 000 population.',
    source: 'Ministry of Health DHIS2.',
    why: 'Tanzania extension — physical infrastructure indicator.',
    pdfRef: 'Tanzania extension',
    guidance: 'POSITIVE polarity. Range 0–10 per 10k. Tanzania varies widely. Low risk: 5+. High risk: <2.'
  },
  household_income: {
    measures: 'Mean household income (USD/year).',
    source: 'Tanzania Household Budget Survey.',
    why: 'Tanzania extension.',
    pdfRef: 'Tanzania extension',
    guidance: 'POSITIVE polarity. Log-transformed. Range 100–10 000 USD. Tanzania mean ≈ $700. Low risk: 3000+. High risk: <300.'
  },
  international_wealth_index: {
    measures: 'DHS International Wealth Index (relative wealth based on assets).',
    source: 'Tanzania DHS.',
    why: 'Tanzania extension.',
    pdfRef: 'Tanzania extension',
    guidance: 'POSITIVE polarity. Range 0–100. Low risk: 60+. High risk: <30.'
  },
  gni_per_capita: {
    measures: 'Gross National Income per capita (USD, Atlas method).',
    source: 'World Bank WDI.',
    why: 'Tanzania extension.',
    pdfRef: 'Tanzania extension',
    guidance: 'POSITIVE polarity. Log-transformed. Range 200–100 000 USD. Tanzania national ≈ $1140. Low risk: 10000+. High risk: <500.'
  },
  basic_sanitation: {
    measures: 'Population using at least basic sanitation services (%).',
    source: 'WHO/UNICEF JMP.',
    why: 'PDF §4.4.5.3 (p.44): Physical Infrastructure component — "we mainly try to assess the accessibility as well as the redundancy of the lifeline systems… i.e. roads, water and sanitation systems."',
    pdfRef: '§4.4.5.3, p.44; Table 17',
    guidance: 'POSITIVE polarity. Range 10–100%. Tanzania ≈ 32%. Low risk: 90%+. High risk: <30%.'
  },
  basic_drinking_water: {
    measures: 'Population using at least basic drinking water services (%).',
    source: 'WHO/UNICEF JMP.',
    why: 'PDF §4.4.5.3 (p.44): Physical Infrastructure component.',
    pdfRef: '§4.4.5.3, p.44; Table 17',
    guidance: 'POSITIVE polarity. Range 50–100%. Tanzania ≈ 61%. Low risk: 95%+. High risk: <60%.'
  },
  unpaved_roads: {
    measures: 'Percentage of district road network that is unpaved.',
    source: 'Tanzania Roads Agency (TANROADS); OpenStreetMap.',
    why: 'Tanzania extension — PDF Table 17 uses Roads density (km/100km²). Tanzania inverts to "% unpaved" so it is NEGATIVE polarity.',
    pdfRef: 'Tanzania extension (PDF uses roads density)',
    guidance: 'NEGATIVE polarity (higher = worse access). Range 0–100%. Tanzania varies. Low risk: <30%. High risk: 80%+.'
  },
  access_electricity: {
    measures: 'Population with access to electricity (%).',
    source: 'World Bank WDI; Tanzania Energy Survey.',
    why: 'PDF §4.4.5.2 (p.44) / Table 17: Communication component. Note PDF uses SQUARED transform on bounds (30²–100²).',
    pdfRef: '§4.4.5.2, p.44; Table 17',
    guidance: 'POSITIVE polarity. Range 30–100% (squared transform). Tanzania ≈ 40%. Low risk: 95%+. High risk: <30%.'
  },
  internet_access: {
    measures: 'Internet users per 100 population.',
    source: 'ITU; Tanzania Communications Regulatory Authority.',
    why: 'PDF §4.4.5.2 (p.44): Communication component — "measuring the efficiency of dissemination of early warnings through a communication network."',
    pdfRef: '§4.4.5.2, p.44; Table 17',
    guidance: 'POSITIVE polarity. Range 0–100%. Tanzania ≈ 25%. Low risk: 70%+. High risk: <10%.'
  },
  cellphone_ownership: {
    measures: 'Mobile cellular subscriptions per 100 population.',
    source: 'ITU; Tanzania Communications Regulatory Authority.',
    why: 'PDF §4.4.5.2 (p.44): Communication component.',
    pdfRef: '§4.4.5.2, p.44; Table 17',
    guidance: 'POSITIVE polarity. Range 5–200 (note: can exceed 100 due to multi-SIM). Tanzania ≈ 86. Low risk: 100+. High risk: <30.'
  },
  adult_literacy: {
    measures: 'Adult literacy rate (% of population aged 15+).',
    source: 'UNESCO Institute for Statistics; Tanzania National Bureau of Statistics.',
    why: 'PDF §4.4.5.2 (p.44) / Table 17: Communication component — recipients must be able to understand warning messages.',
    pdfRef: '§4.4.5.2, p.44; Table 17',
    guidance: 'POSITIVE polarity. Range 0–100%. Tanzania ≈ 78%. Low risk: 95%+. High risk: <50%.'
  },
  mean_years_school: {
    measures: 'Mean years of schooling for population aged 25+.',
    source: 'UNDP HDR.',
    why: 'Tanzania extension. PDF uses adult literacy only.',
    pdfRef: 'Tanzania extension',
    guidance: 'POSITIVE polarity. Range 0–14 years. Tanzania ≈ 6.1 years. Low risk: 10+. High risk: <4.'
  }
};

/**
 * Look up a description (or null if no entry exists yet — the IndicatorGuide
 * component will fall back to a generic message).
 */
export function getIndicatorDescription(indicatorId) {
  return INDICATOR_DESCRIPTIONS[indicatorId] ?? null;
}

export default INDICATOR_DESCRIPTIONS;
