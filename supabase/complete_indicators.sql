-- ============================================================================
-- INFORM TANZANIA - COMPLETE INDICATOR DEFINITIONS (84 indicators)
-- Based on Tanzania - Country Model Template.xlsx
-- ============================================================================
-- Run this in Supabase SQL Editor AFTER running schema.sql
-- ============================================================================

-- First, clear existing indicator definitions
DELETE FROM indicator_definitions;

-- ============================================================================
-- HAZARD DIMENSION - NATURAL (19 indicators)
-- ============================================================================

INSERT INTO indicator_definitions (id, code, name, dimension, category, aggregation, polarity, unit, description) VALUES
-- Coastal Hazards
('coastal_erosion', 'HA.NAT.CE', 'Coastal Erosion', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Coastal erosion exposure'),
('sea_level_rise', 'HA.NAT.SL', 'Sea Level Rise', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Sea level rise exposure'),

-- Drought
('historic_drought_frequency', 'HA.NAT.DR', 'Historic Drought Frequency', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Historical drought frequency'),

-- Earthquake
('earthquake_exposure', 'HA.NAT.EQ', 'Earthquake Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Seismic hazard exposure'),

-- Environmental Degradation
('deforestation_treecover_loss', 'HA.NAT.DF', 'Deforestation - Treecover Loss', 'HAZARD', 'Natural', 'MEAN', 'NEGATIVE', 'index (0-10)', 'Treecover loss rate'),
('soil_erosion', 'HA.NAT.SE', 'Soil Erosion', 'HAZARD', 'Natural', 'MEAN', 'NEGATIVE', 'index (0-10)', 'Soil erosion severity'),

-- Flood
('flood_exposure', 'HA.NAT.FL', 'Flood Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Flood hazard exposure'),

-- Heatwave
('heatwave_exposure', 'HA.NAT.HW', 'Heatwave Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Heatwave exposure'),

-- Landslide
('landslide_exposure', 'HA.NAT.LS', 'Landslide Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Landslide hazard exposure'),

-- Lightning
('lightning_casualties', 'HA.NAT.LT', 'Lightning Casualties', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Lightning strike casualties'),

-- Storms & Cyclone
('cyclone_exposure', 'HA.NAT.CY', 'Cyclone Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Tropical cyclone exposure'),
('storm_exposure', 'HA.NAT.ST', 'Storm Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Storm exposure'),
('cyclone_max_speed', 'HA.NAT.CS', 'Cyclone Max Speed', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'km/h', 'Maximum cyclone wind speed'),

-- Volcano
('volcano_exposure', 'HA.NAT.VO', 'Volcano Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Volcanic hazard exposure'),

-- Wildfire
('burned_area', 'HA.NAT.BA', 'Burned Area', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Area affected by wildfires'),
('fire_weather_index', 'HA.NAT.FW', 'Fire Weather Index', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Fire weather risk index'),

-- Zoonoses, Plants & Pests
('animal_diseases', 'HA.NAT.AD', 'Animal Diseases', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Animal disease prevalence'),
('plant_diseases', 'HA.NAT.PD', 'Plant Diseases', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Plant disease prevalence'),
('pests', 'HA.NAT.PE', 'Pests', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE', 'index (0-10)', 'Pest infestation risk');

-- ============================================================================
-- HAZARD DIMENSION - HUMAN (6 indicators)
-- ============================================================================

INSERT INTO indicator_definitions (id, code, name, dimension, category, aggregation, polarity, unit, description) VALUES
('conflict_barometer', 'HA.HUM.CB', 'Conflict Barometer', 'HAZARD', 'Human', 'MAX', 'NEGATIVE', 'index (0-10)', 'Conflict intensity from Heidelberg'),
('gcri_conflict_probability', 'HA.HUM.CP', 'GCRI Conflict Probability', 'HAZARD', 'Human', 'MAX', 'NEGATIVE', 'probability', 'Conflict probability from GCRI'),
('hazardous_material', 'HA.HUM.HM', 'Hazardous Material', 'HAZARD', 'Human', 'MAX', 'NEGATIVE', 'index (0-10)', 'Hazardous material incidents'),
('violence_events', 'HA.HUM.VE', 'Violence Events', 'HAZARD', 'Human', 'MAX', 'NEGATIVE', 'count', 'Number of violence events'),
('violence_fatalities', 'HA.HUM.VF', 'Violence Fatalities', 'HAZARD', 'Human', 'MAX', 'NEGATIVE', 'count', 'Number of violence fatalities'),
('vehicle_accidents', 'HA.HUM.VA', 'Vehicle Accidents', 'HAZARD', 'Human', 'MAX', 'NEGATIVE', 'index (0-10)', 'Vehicle accident rate');

-- ============================================================================
-- VULNERABILITY DIMENSION - SOCIO-ECONOMIC (12 indicators)
-- ============================================================================

INSERT INTO indicator_definitions (id, code, name, dimension, category, aggregation, polarity, unit, description) VALUES
-- Development & Poverty
('hdi', 'VU.SE.HD', 'Human Development Index', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'POSITIVE', 'index (0-1)', 'HDI score'),
('gender_development_index', 'VU.SE.GD', 'Gender Development Index', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'POSITIVE', 'index (0-1)', 'Gender development score'),
('multidimensional_poverty', 'VU.SE.MP', 'Multidimensional Poverty Index', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', 'index (0-1)', 'MPI score'),
('wealth_inequality', 'VU.SE.WI', 'Wealth Inequality', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', 'Gini (0-100)', 'Gini coefficient'),

-- Economic Dependency
('oda_received', 'VU.SE.OD', 'Net ODA Received', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', '% of GNI', 'ODA as % of GNI'),
('personal_remittances', 'VU.SE.PR', 'Personal Remittances', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', '% of GDP', 'Remittances as % of GDP'),
('dependency_ratio', 'VU.SE.DR', 'Dependency Ratio', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', 'ratio', 'Age dependency ratio'),

-- Habitat
('informal_settlements', 'VU.SE.IS', 'Informal Settlements', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', '%', 'Population in informal settlements'),
('homes_high_risk_areas', 'VU.SE.HR', 'Homes in High-Risk Areas', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', 'count', 'Homes in hazard zones'),
('urban_population', 'VU.SE.UP', 'Urban Population', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', '%', 'Urban population percentage'),

-- Livelihoods
('food_insufficient', 'VU.SE.FI', 'Food Insufficient', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', '%', 'Population with insufficient food'),
('food_ipc_classification', 'VU.SE.FC', 'Food IPC Classification', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE', 'IPC phase (1-5)', 'IPC food security phase');

-- ============================================================================
-- VULNERABILITY DIMENSION - VULNERABLE GROUPS (19 indicators)
-- ============================================================================

INSERT INTO indicator_definitions (id, code, name, dimension, category, aggregation, polarity, unit, description) VALUES
-- Displaced People
('internal_displaced', 'VU.VG.ID', 'Internal Displaced People', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'count', 'Number of IDPs'),
('refugees_asylum_seekers', 'VU.VG.RF', 'Refugees & Asylum Seekers', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'count', 'Number of refugees'),

-- Health Conditions
('life_expectancy', 'VU.VG.LE', 'Life Expectancy', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'POSITIVE', 'years', 'Life expectancy at birth'),
('cholera_cases', 'VU.VG.CH', 'Cholera Cases', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'cases', 'Reported cholera cases'),
('malaria_mortality', 'VU.VG.MM', 'Malaria Mortality', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'per 100,000', 'Malaria mortality rate'),
('malaria_prevalence', 'VU.VG.MP', 'Malaria Prevalence', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', '%', 'Malaria prevalence'),
('measles_incidence', 'VU.VG.MI', 'Measles Incidence', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'per 100,000', 'Measles incidence rate'),
('tuberculosis_incidence', 'VU.VG.TB', 'Tuberculosis Incidence', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'per 100,000', 'TB incidence rate'),
('dst_prevalence', 'VU.VG.DS', 'DST Prevalence', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', '%', 'Dangerous substance use prevalence'),
('people_disabilities', 'VU.VG.PD', 'People with Disabilities', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', '%', 'Disability prevalence'),
('people_chronic_illness', 'VU.VG.CI', 'People with Chronic Illness', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', '%', 'Chronic illness prevalence'),

-- Children Health & Nutrition
('neonatal_mortality', 'VU.VG.NM', 'Neonatal Mortality', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'per 1,000', 'Neonatal mortality rate'),
('infant_mortality', 'VU.VG.IM', 'Infant Mortality', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'per 1,000', 'Infant mortality rate'),
('child_mortality', 'VU.VG.CM', 'Child Mortality (Under 5)', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'per 1,000', 'Under-5 mortality rate'),
('children_underweight', 'VU.VG.CU', 'Children Underweight', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', '%', 'Underweight children percentage'),

-- Economic Vulnerability
('people_affected_disasters', 'VU.VG.AD', 'People Affected by Disasters', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', 'count', 'Disaster-affected population'),
('unemployed_population', 'VU.VG.UN', 'Unemployed Population', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', '%', 'Unemployment rate (15-59)'),
('female_headed_households', 'VU.VG.FH', 'Female Headed Households', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', '%', 'Female-headed households'),
('child_headed_households', 'VU.VG.HH', 'Child Headed Households', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE', '%', 'Child-headed households');

-- ============================================================================
-- COPING CAPACITY DIMENSION - INFRASTRUCTURE (17 indicators)
-- ============================================================================

INSERT INTO indicator_definitions (id, code, name, dimension, category, aggregation, polarity, unit, description) VALUES
-- Access to Health Care
('health_expenditure_capita', 'CC.INF.HE', 'Health Expenditure per Capita', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', 'USD', 'Health spending per capita'),
('bcg_immunization', 'CC.INF.BC', 'BCG Immunization Coverage', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', '%', 'BCG vaccination coverage'),
('dtp3_immunization', 'CC.INF.DT', 'DTP3 Immunization Coverage', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', '%', 'DTP3 vaccination coverage'),
('measles_immunization', 'CC.INF.MZ', 'Measles Immunization Coverage', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', '%', 'Measles vaccination coverage'),
('physicians_density', 'CC.INF.PH', 'Physicians Density', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', 'per 10,000', 'Physicians per 10,000 population'),
('health_facilities_density', 'CC.INF.HF', 'Health Facilities Density', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', 'per 10,000', 'Health facilities per 10,000'),

-- Economic Capacity
('household_income', 'CC.INF.HI', 'Household Income', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', 'USD', 'Average household income'),
('international_wealth_index', 'CC.INF.IW', 'International Wealth Index', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', 'index', 'IWI score'),
('gni_per_capita', 'CC.INF.GN', 'GNI per Capita', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', 'USD', 'Gross national income per capita'),

-- WASH
('basic_sanitation', 'CC.INF.SA', 'Basic Sanitation Access', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', '%', 'Access to basic sanitation'),
('basic_drinking_water', 'CC.INF.WA', 'Basic Drinking Water Access', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', '%', 'Access to safe drinking water'),

-- Communication
('unpaved_roads', 'CC.INF.UR', 'Unpaved Roads', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'NEGATIVE', '%', 'Percentage of unpaved roads'),
('access_electricity', 'CC.INF.EL', 'Access to Electricity', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', '%', 'Electricity access'),
('internet_access', 'CC.INF.IN', 'Internet Access', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', '%', 'Internet access'),
('cellphone_ownership', 'CC.INF.CP', 'Cellphone Ownership', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', '%', 'Cellphone ownership rate'),

-- Education
('adult_literacy', 'CC.INF.AL', 'Adult Literacy Rate', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', '%', 'Adult literacy rate'),
('mean_years_school', 'CC.INF.MY', 'Mean Years at School', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE', 'years', 'Average years of schooling');

-- ============================================================================
-- COPING CAPACITY DIMENSION - INSTITUTIONAL (5 indicators)
-- ============================================================================

INSERT INTO indicator_definitions (id, code, name, dimension, category, aggregation, polarity, unit, description) VALUES
-- DRR Implementation
('sendai_framework', 'CC.INS.SF', 'Sendai Framework Implementation', 'COPING_CAPACITY', 'Institutional', 'MEAN', 'POSITIVE', 'index (0-10)', 'Sendai framework progress'),
('traditional_knowledge', 'CC.INS.TK', 'Traditional Community Knowledge', 'COPING_CAPACITY', 'Institutional', 'MEAN', 'POSITIVE', 'index (0-10)', 'Traditional DRR knowledge'),
('early_warning_system', 'CC.INS.EW', 'Early Warning System', 'COPING_CAPACITY', 'Institutional', 'MEAN', 'POSITIVE', 'index (0-10)', 'EWS coverage and effectiveness'),

-- Governance
('government_effectiveness', 'CC.INS.GE', 'Government Effectiveness', 'COPING_CAPACITY', 'Institutional', 'MEAN', 'POSITIVE', 'index (-2.5 to 2.5)', 'World Bank governance indicator'),
('subnational_corruption', 'CC.INS.SC', 'Subnational Corruption Index', 'COPING_CAPACITY', 'Institutional', 'MEAN', 'NEGATIVE', 'index (0-10)', 'Subnational corruption level');

-- ============================================================================
-- VERIFY
-- ============================================================================

SELECT dimension, category, COUNT(*) as indicator_count
FROM indicator_definitions
GROUP BY dimension, category
ORDER BY dimension, category;

SELECT 'Total Indicators: ' || COUNT(*)::text as summary FROM indicator_definitions;
