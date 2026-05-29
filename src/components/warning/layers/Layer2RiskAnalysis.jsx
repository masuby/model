/**
 * LAYER 2: RISK ANALYSIS
 *
 * Risk Analysis Section - Combined Formula and Matrix View
 * Moved from Module02 INFORM Risk to Warning System
 *
 * Features:
 * - INFORM Formula display and verification
 * - Risk Matrix (Likelihood x Impact)
 * - Risk Classification Scale
 * - Tanzania national risk score display
 */

import React, { useState, useMemo, useEffect } from 'react';
import './Layer2RiskAnalysis.css';
import {
  HOSPITALS,
  EMERGENCY_SHELTERS,
  MAJOR_ROADS,
  EVACUATION_ROUTES,
  FIRE_STATIONS,
  POLICE_STATIONS
} from '../data/mapLayersData';
import InteractiveHazardMap from '../components/InteractiveHazardMap';
import { getHazardRiskService } from '../../../services/hazardRiskService';

// Baseline Risk options from Module 01 INFORM - All Hazards (Natural to Human-Induced)
const BASELINE_RISK_OPTIONS = [
  // Overall & Main Dimensions
  { id: 'overall', label: '📊 Overall INFORM Risk', score: 4.8, color: '#FF9800', category: 'dimension' },
  { id: 'hazard_exposure', label: '⚡ Hazard & Exposure', score: 5.2, color: '#F44336', category: 'dimension' },
  { id: 'vulnerability', label: '🛡️ Vulnerability', score: 4.5, color: '#FF9800', category: 'dimension' },
  { id: 'lack_coping', label: '🏛️ Lack of Coping Capacity', score: 4.7, color: '#FF9800', category: 'dimension' },

  // NATURAL HAZARDS - Hydrometeorological
  { id: 'flood_risk', label: '🌊 Flood Risk', score: 6.1, color: '#F44336', category: 'natural' },
  { id: 'riverine_flood', label: '🌊 Riverine Flood', score: 5.8, color: '#F44336', category: 'natural' },
  { id: 'flash_flood', label: '💦 Flash Flood', score: 5.5, color: '#F44336', category: 'natural' },
  { id: 'coastal_flood', label: '🌊 Coastal Flood', score: 4.2, color: '#FFC107', category: 'natural' },
  { id: 'drought_risk', label: '☀️ Drought Risk', score: 5.8, color: '#F44336', category: 'natural' },
  { id: 'cyclone_risk', label: '🌀 Cyclone/Tropical Storm', score: 3.5, color: '#FFC107', category: 'natural' },
  { id: 'storm_surge', label: '🌊 Storm Surge', score: 3.8, color: '#FFC107', category: 'natural' },
  { id: 'heavy_rainfall', label: '🌧️ Heavy Rainfall', score: 5.2, color: '#F44336', category: 'natural' },
  { id: 'strong_winds', label: '🌪️ Strong Winds', score: 4.0, color: '#FFC107', category: 'natural' },
  { id: 'heatwave', label: '🔥 Heatwave', score: 3.2, color: '#4CAF50', category: 'natural' },
  { id: 'cold_wave', label: '❄️ Cold Wave', score: 2.1, color: '#4CAF50', category: 'natural' },

  // NATURAL HAZARDS - Geophysical
  { id: 'earthquake_risk', label: '🏔️ Earthquake Risk', score: 3.8, color: '#FFC107', category: 'natural' },
  { id: 'tsunami_risk', label: '🌊 Tsunami Risk', score: 2.5, color: '#4CAF50', category: 'natural' },
  { id: 'volcanic_risk', label: '🌋 Volcanic Risk', score: 2.8, color: '#4CAF50', category: 'natural' },
  { id: 'landslide_risk', label: '⛰️ Landslide Risk', score: 4.5, color: '#FF9800', category: 'natural' },

  // NATURAL HAZARDS - Biological
  { id: 'epidemic_risk', label: '🦠 Epidemic Risk', score: 4.2, color: '#FFC107', category: 'natural' },
  { id: 'cholera_risk', label: '💧 Cholera Outbreak Risk', score: 4.8, color: '#FF9800', category: 'natural' },
  { id: 'malaria_risk', label: '🦟 Malaria Risk', score: 5.5, color: '#F44336', category: 'natural' },
  { id: 'pest_infestation', label: '🐛 Pest Infestation', score: 4.0, color: '#FFC107', category: 'natural' },
  { id: 'livestock_disease', label: '🐄 Livestock Disease', score: 3.8, color: '#FFC107', category: 'natural' },

  // HUMAN-INDUCED HAZARDS
  { id: 'conflict_risk', label: '⚔️ Conflict Risk', score: 2.8, color: '#4CAF50', category: 'human' },
  { id: 'displacement_risk', label: '🏃 Displacement Risk', score: 3.5, color: '#FFC107', category: 'human' },
  { id: 'refugee_influx', label: '🏕️ Refugee Influx Risk', score: 3.2, color: '#4CAF50', category: 'human' },
  { id: 'food_crisis', label: '🍽️ Food Security Crisis', score: 4.8, color: '#FF9800', category: 'human' },
  { id: 'economic_shock', label: '📉 Economic Shock', score: 3.5, color: '#FFC107', category: 'human' },
  { id: 'industrial_accident', label: '🏭 Industrial Accident', score: 2.5, color: '#4CAF50', category: 'human' },
  { id: 'fire_risk', label: '🔥 Fire/Wildfire Risk', score: 3.8, color: '#FFC107', category: 'human' },
  { id: 'transport_accident', label: '🚗 Transport Accident', score: 3.0, color: '#4CAF50', category: 'human' }
];

// Hazard type icons mapping for dynamic hazards
const HAZARD_ICONS = {
  'Heavy Rainfall': '🌧️',
  'Strong Winds': '🌪️',
  'Large Waves': '🌊',
  'Flash Floods': '💦',
  'Dry Spells': '☀️',
  'Heatwave': '🔥',
  'Extreme Temperature': '🌡️',
  'Extreme Temperature (Hot)': '🔥',
  'Extreme Temperature (Cold)': '❄️',
  'Riverine Floods': '🌊',
  'Rising Water Levels': '📈',
  'Dam Level Alert': '🏔️',
  'Epidemics': '🦠',
  'Disease Outbreak': '🏥',
  'Health-Related Hazards': '⚕️',
  'Agrometeorological Drought': '🌾',
  'Crop Stress': '🌾',
  'Pest Infestation': '🐛',
  'Livestock Disease': '🐄',
  'Earthquake': '🏔️',
  'Landslide': '⛰️',
  'Volcano': '🌋',
  'Seismic Activity': '📊',
  'Flood': '🌊',
  'Drought': '☀️',
  'default': '⚠️'
};

// Helper to get hazard icon
const getHazardIcon = (hazardType) => {
  return HAZARD_ICONS[hazardType] || HAZARD_ICONS['default'];
};

// Map Layer Display Options
const EXPOSURE_LAYER_OPTIONS = [
  { id: 'none', label: '-- No Exposure Layer --' },
  { id: 'population', label: '👥 Population Density' },
  { id: 'infrastructure', label: '🏗️ Infrastructure' },
  { id: 'cropland', label: '🌾 Agricultural Land' },
  { id: 'livestock', label: '🐄 Livestock' }
];

const VULNERABILITY_LAYER_OPTIONS = [
  { id: 'none', label: '-- No Vulnerability Layer --' },
  { id: 'poverty', label: '💰 Poverty Rate' },
  { id: 'foodInsecurity', label: '🍽️ Food Insecurity' },
  { id: 'healthAccess', label: '🏥 Health Access' },
  { id: 'waterAccess', label: '💧 Water Access' },
  { id: 'vulnerableGroups', label: '👶 Vulnerable Groups' }
];

const COPING_LAYER_OPTIONS = [
  { id: 'none', label: '-- No Coping Layer --' },
  { id: 'hospitals', label: '🏥 Hospitals' },
  { id: 'shelters', label: '🏠 Emergency Shelters' },
  { id: 'roads', label: '🛣️ Major Roads' },
  { id: 'fireStations', label: '🚒 Fire Stations' },
  { id: 'policeStations', label: '👮 Police Stations' },
  { id: 'evacuationRoutes', label: '🚗 Evacuation Routes' }
];

// Exposure data by region (sample data - in real system this would come from database)
const EXPOSURE_DATA = {
  'Dar es Salaam': { population: 5383728, density: 3133, infrastructure: 'Very High', cropland: 'Low', livestock: 'Low' },
  'Mwanza': { population: 3100000, density: 450, infrastructure: 'High', cropland: 'Medium', livestock: 'High' },
  'Arusha': { population: 1700000, density: 250, infrastructure: 'High', cropland: 'Medium', livestock: 'High' },
  'Dodoma': { population: 2200000, density: 70, infrastructure: 'Medium', cropland: 'High', livestock: 'Medium' },
  'Morogoro': { population: 2300000, density: 32, infrastructure: 'Medium', cropland: 'Very High', livestock: 'Medium' },
  'Mbeya': { population: 2800000, density: 46, infrastructure: 'Medium', cropland: 'High', livestock: 'High' },
  'Kilimanjaro': { population: 1800000, density: 124, infrastructure: 'High', cropland: 'High', livestock: 'Medium' },
  'Tanga': { population: 2100000, density: 79, infrastructure: 'Medium', cropland: 'High', livestock: 'Medium' },
  'Kagera': { population: 2600000, density: 90, infrastructure: 'Low', cropland: 'High', livestock: 'High' },
  'Iringa': { population: 1000000, density: 28, infrastructure: 'Medium', cropland: 'High', livestock: 'High' },
  'Mtwara': { population: 1400000, density: 85, infrastructure: 'Low', cropland: 'Medium', livestock: 'Low' },
  'Lindi': { population: 900000, density: 14, infrastructure: 'Low', cropland: 'Medium', livestock: 'Low' },
  'Rukwa': { population: 1200000, density: 26, infrastructure: 'Low', cropland: 'High', livestock: 'High' },
  'Kigoma': { population: 2500000, density: 65, infrastructure: 'Low', cropland: 'Medium', livestock: 'Medium' },
  'Shinyanga': { population: 1800000, density: 55, infrastructure: 'Medium', cropland: 'High', livestock: 'Very High' },
  'Tabora': { population: 2600000, density: 32, infrastructure: 'Low', cropland: 'High', livestock: 'High' },
  'Singida': { population: 1500000, density: 30, infrastructure: 'Low', cropland: 'Medium', livestock: 'High' },
  'Manyara': { population: 1600000, density: 35, infrastructure: 'Low', cropland: 'Medium', livestock: 'Very High' },
  'Geita': { population: 2000000, density: 150, infrastructure: 'Medium', cropland: 'High', livestock: 'Medium' },
  'Simiyu': { population: 1700000, density: 85, infrastructure: 'Low', cropland: 'High', livestock: 'High' },
  'Default': { population: 500000, density: 50, infrastructure: 'Low', cropland: 'Medium', livestock: 'Medium' }
};

// Vulnerability indicators by region
const VULNERABILITY_DATA = {
  'Dar es Salaam': { poverty: 0.15, foodInsecurity: 0.12, healthAccess: 0.85, waterAccess: 0.78, vulnerableGroups: 0.32 },
  'Mwanza': { poverty: 0.35, foodInsecurity: 0.28, healthAccess: 0.55, waterAccess: 0.52, vulnerableGroups: 0.38 },
  'Arusha': { poverty: 0.22, foodInsecurity: 0.18, healthAccess: 0.72, waterAccess: 0.68, vulnerableGroups: 0.30 },
  'Dodoma': { poverty: 0.42, foodInsecurity: 0.38, healthAccess: 0.48, waterAccess: 0.45, vulnerableGroups: 0.42 },
  'Morogoro': { poverty: 0.38, foodInsecurity: 0.32, healthAccess: 0.52, waterAccess: 0.55, vulnerableGroups: 0.36 },
  'Mbeya': { poverty: 0.32, foodInsecurity: 0.25, healthAccess: 0.58, waterAccess: 0.62, vulnerableGroups: 0.34 },
  'Kilimanjaro': { poverty: 0.18, foodInsecurity: 0.15, healthAccess: 0.75, waterAccess: 0.72, vulnerableGroups: 0.28 },
  'Tanga': { poverty: 0.35, foodInsecurity: 0.30, healthAccess: 0.55, waterAccess: 0.58, vulnerableGroups: 0.36 },
  'Kagera': { poverty: 0.45, foodInsecurity: 0.42, healthAccess: 0.42, waterAccess: 0.38, vulnerableGroups: 0.45 },
  'Iringa': { poverty: 0.28, foodInsecurity: 0.22, healthAccess: 0.62, waterAccess: 0.58, vulnerableGroups: 0.32 },
  'Mtwara': { poverty: 0.48, foodInsecurity: 0.45, healthAccess: 0.40, waterAccess: 0.35, vulnerableGroups: 0.44 },
  'Lindi': { poverty: 0.52, foodInsecurity: 0.48, healthAccess: 0.35, waterAccess: 0.32, vulnerableGroups: 0.46 },
  'Rukwa': { poverty: 0.44, foodInsecurity: 0.40, healthAccess: 0.45, waterAccess: 0.42, vulnerableGroups: 0.40 },
  'Kigoma': { poverty: 0.50, foodInsecurity: 0.52, healthAccess: 0.38, waterAccess: 0.35, vulnerableGroups: 0.48 },
  'Shinyanga': { poverty: 0.40, foodInsecurity: 0.35, healthAccess: 0.50, waterAccess: 0.48, vulnerableGroups: 0.38 },
  'Tabora': { poverty: 0.46, foodInsecurity: 0.42, healthAccess: 0.42, waterAccess: 0.40, vulnerableGroups: 0.42 },
  'Singida': { poverty: 0.42, foodInsecurity: 0.38, healthAccess: 0.48, waterAccess: 0.45, vulnerableGroups: 0.40 },
  'Manyara': { poverty: 0.38, foodInsecurity: 0.35, healthAccess: 0.52, waterAccess: 0.48, vulnerableGroups: 0.36 },
  'Geita': { poverty: 0.42, foodInsecurity: 0.38, healthAccess: 0.45, waterAccess: 0.42, vulnerableGroups: 0.40 },
  'Simiyu': { poverty: 0.48, foodInsecurity: 0.45, healthAccess: 0.40, waterAccess: 0.38, vulnerableGroups: 0.44 },
  'Default': { poverty: 0.40, foodInsecurity: 0.35, healthAccess: 0.50, waterAccess: 0.50, vulnerableGroups: 0.40 }
};

// All Tanzania regions for selection
const TANZANIA_REGIONS = [
  'Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Morogoro', 'Mbeya',
  'Kilimanjaro', 'Tanga', 'Kagera', 'Iringa', 'Mtwara', 'Lindi',
  'Rukwa', 'Kigoma', 'Shinyanga', 'Tabora', 'Singida', 'Manyara',
  'Geita', 'Simiyu', 'Pwani', 'Njombe', 'Katavi', 'Ruvuma', 'Songwe'
];

// Tanzania regions with their districts
const REGIONS_WITH_DISTRICTS = {
  'Dar es Salaam': ['Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni'],
  'Dodoma': ['Dodoma Urban', 'Chamwino', 'Kondoa', 'Mpwapwa', 'Chemba', 'Bahi', 'Kongwa'],
  'Arusha': ['Arusha Urban', 'Arusha Rural', 'Meru', 'Karatu', 'Monduli', 'Ngorongoro', 'Longido'],
  'Kilimanjaro': ['Moshi Urban', 'Moshi Rural', 'Hai', 'Rombo', 'Same', 'Siha', 'Mwanga'],
  'Mwanza': ['Ilemela', 'Nyamagana', 'Magu', 'Sengerema', 'Ukerewe', 'Kwimba', 'Misungwi', 'Buchosa'],
  'Mbeya': ['Mbeya Urban', 'Mbeya Rural', 'Rungwe', 'Kyela', 'Mbarali', 'Chunya', 'Busokelo'],
  'Morogoro': ['Morogoro Urban', 'Morogoro Rural', 'Kilosa', 'Mvomero', 'Ulanga', 'Kilombero', 'Malinyi', 'Gairo', 'Ifakara'],
  'Tanga': ['Tanga Urban', 'Muheza', 'Pangani', 'Korogwe', 'Handeni', 'Kilindi', 'Mkinga', 'Lushoto', 'Bumbuli'],
  'Pwani': ['Kibaha Urban', 'Kibaha Rural', 'Mkuranga', 'Bagamoyo', 'Kisarawe', 'Rufiji', 'Mafia', 'Chalinze'],
  'Kagera': ['Bukoba Urban', 'Bukoba Rural', 'Muleba', 'Biharamulo', 'Ngara', 'Karagwe', 'Kyerwa', 'Missenyi'],
  'Iringa': ['Iringa Urban', 'Iringa Rural', 'Kilolo', 'Mufindi'],
  'Mtwara': ['Mtwara Urban', 'Mtwara Rural', 'Newala', 'Tandahimba', 'Masasi', 'Nanyumbu'],
  'Lindi': ['Lindi Urban', 'Lindi Rural', 'Kilwa', 'Liwale', 'Nachingwea', 'Ruangwa'],
  'Rukwa': ['Sumbawanga Urban', 'Sumbawanga Rural', 'Nkasi', 'Kalambo'],
  'Kigoma': ['Kigoma Urban', 'Kigoma Rural', 'Kasulu', 'Kibondo', 'Uvinza', 'Buhigwe'],
  'Shinyanga': ['Shinyanga Urban', 'Shinyanga Rural', 'Kishapu', 'Kahama Urban', 'Kahama Rural', 'Ushetu', 'Msalala'],
  'Tabora': ['Tabora Urban', 'Urambo', 'Sikonge', 'Uyui', 'Kaliua', 'Nzega', 'Igunga'],
  'Singida': ['Singida Urban', 'Singida Rural', 'Manyoni', 'Iramba', 'Ikungi'],
  'Manyara': ['Babati Urban', 'Babati Rural', 'Mbulu', 'Hanang', 'Kiteto', 'Simanjiro'],
  'Geita': ['Geita Urban', 'Chato', 'Bukombe', 'Nyang\'hwale', 'Mbogwe'],
  'Simiyu': ['Bariadi', 'Itilima', 'Maswa', 'Meatu', 'Busega'],
  'Njombe': ['Njombe Urban', 'Njombe Rural', 'Makete', 'Ludewa', 'Wanging\'ombe'],
  'Katavi': ['Mpanda Urban', 'Mpanda Rural', 'Mlele', 'Tanganyika'],
  'Ruvuma': ['Songea Urban', 'Songea Rural', 'Mbinga', 'Namtumbo', 'Nyasa', 'Tunduru'],
  'Songwe': ['Tunduma', 'Mbozi', 'Momba', 'Songwe', 'Ileje']
};

// Risk Matrix configuration (5x5 matrix)
const RISK_MATRIX = {
  likelihood: [
    { score: 1, label: 'Rare', description: 'May occur only in exceptional circumstances' },
    { score: 2, label: 'Unlikely', description: 'Could occur at some time' },
    { score: 3, label: 'Possible', description: 'Might occur at some time' },
    { score: 4, label: 'Likely', description: 'Will probably occur in most circumstances' },
    { score: 5, label: 'Almost Certain', description: 'Expected to occur in most circumstances' }
  ],
  impact: [
    { score: 1, label: 'Negligible', description: 'Minimal impact on people or assets' },
    { score: 2, label: 'Minor', description: 'Limited impact, manageable with existing resources' },
    { score: 3, label: 'Moderate', description: 'Significant impact requiring additional resources' },
    { score: 4, label: 'Major', description: 'Serious impact affecting many people/assets' },
    { score: 5, label: 'Catastrophic', description: 'Devastating impact, widespread destruction' }
  ]
};

/**
 * Get risk classification based on score
 */
function getRiskClassification(score) {
  if (score === null || score === undefined) return { level: 'Unknown', color: '#999', range: 'N/A' };
  if (score >= 0 && score < 2) return { level: 'Very Low', color: '#43A047', range: '0.0 - 1.9' };
  if (score >= 2 && score < 3.5) return { level: 'Low', color: '#8BC34A', range: '2.0 - 3.4' };
  if (score >= 3.5 && score < 5) return { level: 'Medium', color: '#FFC107', range: '3.5 - 4.9' };
  if (score >= 5 && score < 6.5) return { level: 'High', color: '#FF9800', range: '5.0 - 6.4' };
  return { level: 'Very High', color: '#F44336', range: '6.5 - 10.0' };
}

/**
 * Layer2RiskAnalysis - Risk Analysis Component for Warning System
 * Provides INFORM formula visualization and risk matrix interaction
 */
const Layer2RiskAnalysis = ({ riskData, activeWarnings, activeHazards }) => {
  const [selectedLikelihood, setSelectedLikelihood] = useState(null);
  const [selectedImpact, setSelectedImpact] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState({}); // { districtName: warningLevel }
  const [expandedRegions, setExpandedRegions] = useState([]); // Track which regions are expanded
  const [hazardIntensity, setHazardIntensity] = useState(7);

  // Dynamic Flood/Drought Risk from hazardRiskService
  const [dynamicFloodRisk, setDynamicFloodRisk] = useState(null);
  const [dynamicDroughtRisk, setDynamicDroughtRisk] = useState(null);

  // Calculate dynamic flood/drought risk based on selected regions
  useEffect(() => {
    const riskService = getHazardRiskService();
    if (selectedRegions.length > 0) {
      const region = selectedRegions[0];
      const regionData = {
        meteorological: {
          daily_rainfall: hazardIntensity * 15,
          rainfall_forecast: hazardIntensity * 20,
          cumulative_rainfall: 100 + hazardIntensity * 5
        },
        hydrological: {
          river_level: hazardIntensity * 0.2,
          dam_reservoir: 60 + hazardIntensity * 3,
          soil_saturation: 40 + hazardIntensity * 4
        },
        agricultural: {
          ndvi: 0.6 - (hazardIntensity * 0.03),
          vci: 60 - (hazardIntensity * 4),
          dry_spell_days: hazardIntensity
        },
        baseline: {
          flood_hazard_zone: 5,
          drought_susceptibility: 5
        },
        exposure: EXPOSURE_DATA[region] ? {
          population: Math.min(10, EXPOSURE_DATA[region].population / 1000000),
          agricultural: EXPOSURE_DATA[region].cropland === 'Very High' ? 8 : EXPOSURE_DATA[region].cropland === 'High' ? 6 : 4,
          infrastructure: EXPOSURE_DATA[region].infrastructure === 'Very High' ? 8 : EXPOSURE_DATA[region].infrastructure === 'High' ? 6 : 4
        } : { population: 5, agricultural: 5, infrastructure: 5 },
        sensitivity: VULNERABILITY_DATA[region] ? {
          poverty: VULNERABILITY_DATA[region].poverty * 10,
          food_insecurity: VULNERABILITY_DATA[region].foodInsecurity * 10,
          water_access: (1 - VULNERABILITY_DATA[region].waterAccess) * 10,
          health_vulnerability: (1 - VULNERABILITY_DATA[region].healthAccess) * 10
        } : { poverty: 5, food_insecurity: 5, water_access: 5, health_vulnerability: 5 },
        coping: {
          early_warning: 6,
          governance: 5,
          infrastructure: EXPOSURE_DATA[region]?.infrastructure === 'High' ? 7 : 4,
          social_protection: 5,
          irrigation: 3
        }
      };

      setDynamicFloodRisk(riskService.calculateFloodRisk(regionData));
      setDynamicDroughtRisk(riskService.calculateDroughtRisk(regionData));
    } else {
      // Calculate for national average
      const nationalData = {
        meteorological: { daily_rainfall: 50, rainfall_forecast: 60, cumulative_rainfall: 105 },
        hydrological: { river_level: 1.0, dam_reservoir: 70, soil_saturation: 55 },
        agricultural: { ndvi: 0.45, vci: 50, dry_spell_days: 8 },
        baseline: { flood_hazard_zone: 5, drought_susceptibility: 5 },
        exposure: { population: 5, agricultural: 5, infrastructure: 5 },
        sensitivity: { poverty: 5, food_insecurity: 5, water_access: 5, health_vulnerability: 5 },
        coping: { early_warning: 5, governance: 5, infrastructure: 5, social_protection: 5, irrigation: 3 }
      };
      setDynamicFloodRisk(riskService.calculateFloodRisk(nationalData));
      setDynamicDroughtRisk(riskService.calculateDroughtRisk(nationalData));
    }
  }, [selectedRegions, hazardIntensity]);

  // Auto-populate regions and districts from active hazards (submitted from Layer1)
  useEffect(() => {
    if (activeHazards && activeHazards.length > 0) {
      const newRegions = new Set();
      const newDistricts = {};

      activeHazards.forEach(hazard => {
        // Get regions from hazard
        const hazardRegions = hazard.regions || hazard.hazardData?.regions || [];
        hazardRegions.forEach(region => newRegions.add(region));

        // Get districts with warning levels from hazard
        const districtLevels = hazard.districtWarningLevels || hazard.hazardData?.districtWarningLevels || {};
        Object.entries(districtLevels).forEach(([district, level]) => {
          // Keep highest warning level if district appears in multiple hazards
          const currentLevel = newDistricts[district];
          const levelPriority = { 'Major Warning': 3, 'Warning': 2, 'Advisory': 1 };
          if (!currentLevel || (levelPriority[level] || 0) > (levelPriority[currentLevel] || 0)) {
            newDistricts[district] = level;
          }
        });

        // Also check spatialExtent for district names
        const spatialExtent = hazard.spatialExtent || hazard.hazardData?.spatialExtent || [];
        spatialExtent.forEach(district => {
          if (!newDistricts[district]) {
            newDistricts[district] = hazard.warningLevel || hazard.hazardData?.warningLevel || 'Advisory';
          }
        });
      });

      // Derive regions from selected districts (auto-capture parent regions)
      const regionsFromDistricts = new Set();
      const districtList = Object.keys(newDistricts);
      console.log('🗺️ Districts from hazards:', districtList);

      districtList.forEach(district => {
        let foundRegion = false;
        Object.entries(REGIONS_WITH_DISTRICTS).forEach(([region, districts]) => {
          if (districts.includes(district)) {
            regionsFromDistricts.add(region);
            foundRegion = true;
            console.log(`  ✓ District "${district}" → Region "${region}"`);
          }
        });
        if (!foundRegion) {
          console.log(`  ✗ District "${district}" NOT FOUND in any region`);
        }
      });

      // Merge explicit regions with derived regions from districts
      regionsFromDistricts.forEach(region => newRegions.add(region));

      console.log('🗺️ Regions derived:', Array.from(regionsFromDistricts));
      console.log('🗺️ Total regions (explicit + derived):', Array.from(newRegions));

      if (newRegions.size > 0 || Object.keys(newDistricts).length > 0) {
        console.log('📍 Setting selectedRegions:', Array.from(newRegions));
        console.log('📍 Setting selectedDistricts:', newDistricts);
        setSelectedRegions(Array.from(newRegions));
        setSelectedDistricts(newDistricts);
        // Auto-expand regions that have selected districts
        setExpandedRegions(Array.from(regionsFromDistricts));
      }
    }
  }, [activeHazards]);

  // Risk Analysis Layer Toggles
  const [enabledLayers, setEnabledLayers] = useState({
    population: true,
    infrastructure: true,
    cropland: false,
    livestock: false,
    poverty: true,
    foodInsecurity: false,
    healthAccess: true,
    waterAccess: false,
    vulnerableGroups: true,
    hospitals: true,
    shelters: false,
    roads: true,
    fireStations: false,
    policeStations: false,
    evacuationRoutes: false
  });

  // Visual Risk Layering Map - Multiple Selection States
  const [selectedBaselineRisks, setSelectedBaselineRisks] = useState(['overall']); // Array for multiple
  const [selectedHazardIds, setSelectedHazardIds] = useState([]); // Array for multiple hazards
  const [selectedExposureLayers, setSelectedExposureLayers] = useState(['population']); // Array for multiple
  const [selectedVulnerabilityLayers, setSelectedVulnerabilityLayers] = useState(['poverty']); // Array for multiple
  const [selectedCopingLayers, setSelectedCopingLayers] = useState(['hospitals']); // Array for multiple

  // Toggle functions for multi-select
  const toggleBaselineRisk = (riskId) => {
    setSelectedBaselineRisks(prev =>
      prev.includes(riskId) ? prev.filter(r => r !== riskId) : [...prev, riskId]
    );
  };

  const toggleHazard = (hazardId) => {
    setSelectedHazardIds(prev =>
      prev.includes(hazardId) ? prev.filter(h => h !== hazardId) : [...prev, hazardId]
    );
  };

  const toggleExposureLayer = (layerId) => {
    if (layerId === 'none') return;
    setSelectedExposureLayers(prev =>
      prev.includes(layerId) ? prev.filter(l => l !== layerId) : [...prev, layerId]
    );
  };

  const toggleVulnerabilityLayer = (layerId) => {
    if (layerId === 'none') return;
    setSelectedVulnerabilityLayers(prev =>
      prev.includes(layerId) ? prev.filter(l => l !== layerId) : [...prev, layerId]
    );
  };

  const toggleCopingLayer = (layerId) => {
    if (layerId === 'none') return;
    setSelectedCopingLayers(prev =>
      prev.includes(layerId) ? prev.filter(l => l !== layerId) : [...prev, layerId]
    );
  };

  // Build dynamic hazard options from activeHazards (institution inputs)
  const hazardOptions = useMemo(() => {
    const options = [];

    console.log('🔄 Building hazardOptions from activeHazards:', activeHazards?.length || 0, activeHazards);

    if (activeHazards && activeHazards.length > 0) {
      activeHazards.forEach((hazard, index) => {
        const hazardType = hazard.hazardType || hazard.type || 'Unknown Hazard';
        const institution = hazard.institution || hazard.source || 'Unknown';
        // Check multiple possible region field names
        const region = hazard.regions?.[0] || hazard.affectedRegions?.[0] || hazard.region || '';
        const severity = hazard.severity || hazard.warningLevel || '';
        const districtCount = hazard.spatialExtent?.length || 0;

        options.push({
          id: hazard.id || `hazard-${Date.now()}-${index}`,
          label: `${hazardType}${region ? ` - ${region}` : ''}${districtCount > 0 ? ` (${districtCount} districts)` : ''}`,
          icon: getHazardIcon(hazardType),
          institution: institution,
          severity: severity,
          districtCount: districtCount,
          issuedAt: hazard.issuedAt,
          hazardData: hazard // Store full hazard data for map overlay
        });
        console.log(`📌 Added hazard option: ${hazardType} from ${institution}, severity: ${severity}`);
      });
    }

    return options;
  }, [activeHazards]);

  // Get all selected hazards' data for map overlay
  const selectedHazards = useMemo(() => {
    if (selectedHazardIds.length === 0) return [];
    return hazardOptions.filter(h => selectedHazardIds.includes(h.id));
  }, [selectedHazardIds, hazardOptions]);

  // Build selectedDistricts object from selected hazards AND manually selected districts for map shading
  const hazardSelectedDistricts = useMemo(() => {
    const districts = {};

    // First, include manually selected districts (from Select Affected Areas)
    Object.entries(selectedDistricts).forEach(([districtName, level]) => {
      districts[districtName] = level;
    });

    // Then, add/override with selected hazards' districts
    selectedHazards.forEach(hazard => {
      const hazardData = hazard.hazardData;
      if (hazardData && hazardData.districtWarningLevels) {
        // Use the specific warning levels per district from the submitted hazard
        Object.entries(hazardData.districtWarningLevels).forEach(([districtName, level]) => {
          districts[districtName] = level;
        });
      } else if (hazardData && hazardData.spatialExtent) {
        // Fallback: use hazard's overall warning level for all districts
        hazardData.spatialExtent.forEach(districtName => {
          districts[districtName] = hazardData.warningLevel || hazard.severity || 'Advisory';
        });
      }
    });
    console.log('🗺️ Hazard districts for shading:', districts);
    return districts;
  }, [selectedHazards, selectedDistricts]);

  // Toggle layer visibility
  const toggleLayer = (layerName) => {
    setEnabledLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  // Toggle region selection
  const toggleRegion = (region) => {
    setSelectedRegions(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  // Toggle region expansion to show/hide districts
  const toggleRegionExpand = (region) => {
    setExpandedRegions(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  // Toggle district selection with warning level - also auto-selects the parent region
  const toggleDistrict = (district, defaultLevel = 'Advisory') => {
    // Find the parent region for this district
    const parentRegion = Object.entries(REGIONS_WITH_DISTRICTS).find(
      ([, districts]) => districts.includes(district)
    )?.[0];

    setSelectedDistricts(prev => {
      if (prev[district]) {
        // Remove district
        const newDistricts = { ...prev };
        delete newDistricts[district];

        // Check if any other districts in the same region are still selected
        if (parentRegion) {
          const regionDistricts = REGIONS_WITH_DISTRICTS[parentRegion] || [];
          const hasOtherSelectedDistricts = regionDistricts.some(d => d !== district && newDistricts[d]);

          if (!hasOtherSelectedDistricts) {
            // Remove region if no more districts selected in it
            setSelectedRegions(prevRegions => prevRegions.filter(r => r !== parentRegion));
          }
        }

        return newDistricts;
      } else {
        // Add district with default level
        // Also auto-select the parent region (use functional update to avoid stale closure)
        if (parentRegion) {
          setSelectedRegions(prevRegions => {
            if (!prevRegions.includes(parentRegion)) {
              console.log(`📍 Auto-adding region "${parentRegion}" for district "${district}"`);
              return [...prevRegions, parentRegion];
            }
            return prevRegions;
          });
        }

        return { ...prev, [district]: defaultLevel };
      }
    });
  };

  // Get warning color for district
  const getDistrictWarningColor = (level) => {
    switch (level) {
      case 'Major Warning': return '#F44336';
      case 'Warning': return '#FF9800';
      case 'Advisory': return '#FFC107';
      default: return '#4CAF50';
    }
  };

  // Count selected districts
  const totalSelectedDistricts = Object.keys(selectedDistricts).length;

  // Extract national data from riskData
  const national = riskData?.national;
  const classification = national?.classification;

  // Calculate formula verification
  const formulaVerification = useMemo(() => {
    if (!national) return null;
    const { hazardExposure, vulnerability, lackCopingCapacity, risk } = national;
    const calculated = Math.pow(hazardExposure * vulnerability * lackCopingCapacity, 1/3);
    const diff = Math.abs(calculated - risk);
    return {
      calculated: calculated.toFixed(2),
      actual: risk.toFixed(2),
      isValid: diff < 0.1,
      difference: diff.toFixed(3)
    };
  }, [national]);

  // Calculate expected impact based on SELECTED layers from Visual Risk Layering (dynamic)
  const calculatedImpact = useMemo(() => {
    if (selectedRegions.length === 0) return null;

    let totalPopulation = 0;
    let totalExposureScore = 0;
    let totalVulnerabilityScore = 0;
    let infrastructureCount = { hospitals: 0, shelters: 0, roads: 0, fireStations: 0, policeStations: 0, evacuationRoutes: 0 };
    let regionData = [];

    // Calculate baseline risk contribution from selected baseline risks
    let baselineRiskScore = 0;
    if (selectedBaselineRisks.length > 0) {
      const selectedRisks = selectedBaselineRisks.map(id =>
        BASELINE_RISK_OPTIONS.find(o => o.id === id)
      ).filter(Boolean);
      baselineRiskScore = selectedRisks.reduce((sum, r) => sum + r.score, 0) / selectedRisks.length;
    } else {
      baselineRiskScore = national?.risk || 4.8; // Default to national risk
    }

    // Calculate hazard contribution from selected hazards
    let hazardScore = hazardIntensity;
    if (selectedHazardIds.length > 0) {
      const hazardSeverityScores = selectedHazards.map(h => {
        const severity = h.severity || h.hazardData?.warningLevel || 'Advisory';
        return severity === 'Major Warning' ? 9 : severity === 'Warning' ? 7 : severity === 'Advisory' ? 5 : 3;
      });
      hazardScore = Math.max(hazardIntensity, ...hazardSeverityScores);
    }

    selectedRegions.forEach(region => {
      const exposure = EXPOSURE_DATA[region] || EXPOSURE_DATA['Default'];
      const vulnerability = VULNERABILITY_DATA[region] || VULNERABILITY_DATA['Default'];

      // Calculate exposure score based on SELECTED exposure layers (Visual Risk Layering)
      let exposureScore = 0;
      let exposureLayerCount = 0;

      if (selectedExposureLayers.includes('population')) {
        exposureScore += Math.min(10, (exposure.population / 1000000) * 2);
        exposureLayerCount++;
      }
      if (selectedExposureLayers.includes('infrastructure')) {
        const infraScore = exposure.infrastructure === 'Very High' ? 9 :
                          exposure.infrastructure === 'High' ? 7 :
                          exposure.infrastructure === 'Medium' ? 5 : 3;
        exposureScore += infraScore;
        exposureLayerCount++;
      }
      if (selectedExposureLayers.includes('cropland')) {
        const cropScore = exposure.cropland === 'Very High' ? 9 :
                         exposure.cropland === 'High' ? 7 :
                         exposure.cropland === 'Medium' ? 5 : 3;
        exposureScore += cropScore;
        exposureLayerCount++;
      }
      if (selectedExposureLayers.includes('livestock')) {
        const livestockScore = exposure.livestock === 'Very High' ? 9 :
                              exposure.livestock === 'High' ? 7 :
                              exposure.livestock === 'Medium' ? 5 : 3;
        exposureScore += livestockScore;
        exposureLayerCount++;
      }

      // Normalize exposure by number of layers selected
      if (exposureLayerCount > 0) {
        exposureScore = exposureScore / exposureLayerCount;
      } else {
        exposureScore = national?.hazardExposure || 5; // Default
      }

      // Calculate vulnerability score based on SELECTED vulnerability layers
      let vulnScore = 0;
      let vulnLayerCount = 0;

      if (selectedVulnerabilityLayers.includes('poverty')) {
        vulnScore += vulnerability.poverty * 10;
        vulnLayerCount++;
      }
      if (selectedVulnerabilityLayers.includes('foodInsecurity')) {
        vulnScore += vulnerability.foodInsecurity * 10;
        vulnLayerCount++;
      }
      if (selectedVulnerabilityLayers.includes('healthAccess')) {
        vulnScore += (1 - vulnerability.healthAccess) * 10;
        vulnLayerCount++;
      }
      if (selectedVulnerabilityLayers.includes('waterAccess')) {
        vulnScore += (1 - vulnerability.waterAccess) * 10;
        vulnLayerCount++;
      }
      if (selectedVulnerabilityLayers.includes('vulnerableGroups')) {
        vulnScore += vulnerability.vulnerableGroups * 10;
        vulnLayerCount++;
      }

      // Normalize vulnerability by number of layers selected
      if (vulnLayerCount > 0) {
        vulnScore = vulnScore / vulnLayerCount;
      } else {
        vulnScore = national?.vulnerability || 5; // Default
      }

      totalPopulation += exposure.population;
      totalExposureScore += exposureScore;
      totalVulnerabilityScore += vulnScore;

      regionData.push({
        region,
        population: exposure.population,
        density: exposure.density,
        exposureScore: exposureScore.toFixed(2),
        vulnerabilityScore: vulnScore.toFixed(2),
        infraLevel: exposure.infrastructure,
        povertyRate: (vulnerability.poverty * 100).toFixed(0) + '%'
      });
    });

    // Count infrastructure based on SELECTED coping layers
    if (selectedCopingLayers.includes('hospitals')) {
      infrastructureCount.hospitals = HOSPITALS.filter(h =>
        selectedRegions.some(r => h.name.toLowerCase().includes(r.toLowerCase()) || h.name.toLowerCase().includes(r.split(' ')[0].toLowerCase()))
      ).length || Math.round(selectedRegions.length * 3);
    }
    if (selectedCopingLayers.includes('shelters')) {
      infrastructureCount.shelters = EMERGENCY_SHELTERS.filter(s =>
        selectedRegions.some(r => s.name.toLowerCase().includes(r.toLowerCase()) || s.name.toLowerCase().includes(r.split(' ')[0].toLowerCase()))
      ).length || Math.round(selectedRegions.length * 2);
    }
    if (selectedCopingLayers.includes('roads')) {
      infrastructureCount.roads = MAJOR_ROADS.filter(rd =>
        selectedRegions.some(r => rd.name.toLowerCase().includes(r.toLowerCase()) || rd.name.toLowerCase().includes(r.split(' ')[0].toLowerCase()))
      ).length || Math.round(selectedRegions.length * 4);
    }
    if (selectedCopingLayers.includes('fireStations')) {
      infrastructureCount.fireStations = FIRE_STATIONS.filter(f =>
        selectedRegions.some(r => f.name.toLowerCase().includes(r.toLowerCase()))
      ).length || Math.round(selectedRegions.length * 1.5);
    }
    if (selectedCopingLayers.includes('policeStations')) {
      infrastructureCount.policeStations = POLICE_STATIONS.filter(p =>
        selectedRegions.some(r => p.name.toLowerCase().includes(r.toLowerCase()))
      ).length || Math.round(selectedRegions.length * 2);
    }
    if (selectedCopingLayers.includes('evacuationRoutes')) {
      infrastructureCount.evacuationRoutes = EVACUATION_ROUTES.filter(e =>
        selectedRegions.some(r => e.name.toLowerCase().includes(r.toLowerCase()))
      ).length || Math.round(selectedRegions.length * 2);
    }

    // Calculate coping capacity score from selected coping layers
    let copingScore = national?.lackCopingCapacity || 5;
    if (selectedCopingLayers.length > 0) {
      // More coping resources selected = lower lack of coping capacity
      const copingReduction = selectedCopingLayers.length * 0.5; // Each layer reduces LCC by 0.5
      copingScore = Math.max(1, copingScore - copingReduction);
    }

    // Calculate overall scores
    const avgExposure = totalExposureScore / selectedRegions.length;
    const avgVulnerability = totalVulnerabilityScore / selectedRegions.length;

    // INFORM Risk calculation: Risk = (H × E × V × LCC)^(1/4) - Modified to include baseline
    // Combine baseline risk with real-time hazard assessment
    const combinedHazard = (baselineRiskScore + hazardScore) / 2;
    const riskScore = Math.pow(combinedHazard * avgExposure * avgVulnerability * copingScore, 1/4);
    const normalizedRisk = Math.min(10, Math.max(0, riskScore));

    // Determine impact classification based on INFORM scale
    let impactClass, impactColor, impactDescription, warningLevel;
    if (normalizedRisk >= 6.5) {
      impactClass = 'Critical';
      impactColor = '#D32F2F';
      impactDescription = 'Severe humanitarian impact expected. Immediate full-scale response required.';
      warningLevel = 'MAJOR WARNING';
    } else if (normalizedRisk >= 5) {
      impactClass = 'High';
      impactColor = '#F57C00';
      impactDescription = 'Significant impact expected. Activate emergency response protocols.';
      warningLevel = 'WARNING';
    } else if (normalizedRisk >= 3.5) {
      impactClass = 'Moderate';
      impactColor = '#FBC02D';
      impactDescription = 'Moderate impact expected. Enhanced monitoring and preparation advised.';
      warningLevel = 'ADVISORY';
    } else if (normalizedRisk >= 2) {
      impactClass = 'Low';
      impactColor = '#8BC34A';
      impactDescription = 'Limited impact expected. Continue standard monitoring.';
      warningLevel = 'WATCH';
    } else {
      impactClass = 'Very Low';
      impactColor = '#388E3C';
      impactDescription = 'Minimal impact expected. Normal operations.';
      warningLevel = 'MONITOR';
    }

    // Estimate affected population based on risk score
    const affectedPercentage = normalizedRisk / 10;
    const estimatedAffected = Math.round(totalPopulation * affectedPercentage);

    // Count all enabled layers
    const totalLayerCount = selectedBaselineRisks.length + selectedHazardIds.length +
                           selectedExposureLayers.length + selectedVulnerabilityLayers.length +
                           selectedCopingLayers.length;

    return {
      riskScore: normalizedRisk.toFixed(2),
      impactClass,
      impactColor,
      impactDescription,
      warningLevel,
      totalPopulation,
      estimatedAffected,
      avgExposure: avgExposure.toFixed(2),
      avgVulnerability: avgVulnerability.toFixed(2),
      hazardIntensity: hazardScore,
      baselineRisk: baselineRiskScore.toFixed(2),
      combinedHazard: combinedHazard.toFixed(2),
      lackOfCoping: copingScore.toFixed(2),
      infrastructureCount,
      regionData,
      enabledLayerCount: totalLayerCount,
      regionsCount: selectedRegions.length,
      // Layer breakdown for display
      layerBreakdown: {
        baselineRisks: selectedBaselineRisks.length,
        hazards: selectedHazardIds.length,
        exposure: selectedExposureLayers.length,
        vulnerability: selectedVulnerabilityLayers.length,
        coping: selectedCopingLayers.length
      }
    };
  }, [selectedRegions, selectedBaselineRisks, selectedHazardIds, selectedHazards,
      selectedExposureLayers, selectedVulnerabilityLayers, selectedCopingLayers,
      hazardIntensity, national]);

  const getRiskLevel = (likelihood, impact) => {
    const score = likelihood * impact;
    if (score <= 4) return { level: 'Low', color: '#4CAF50' };
    if (score <= 9) return { level: 'Medium', color: '#FFC107' };
    if (score <= 16) return { level: 'High', color: '#FF9800' };
    return { level: 'Very High', color: '#F44336' };
  };

  const calculatedRisk = selectedLikelihood && selectedImpact
    ? getRiskLevel(selectedLikelihood, selectedImpact)
    : null;

  // Loading state
  if (!riskData || !national) {
    return (
      <div className="risk-analysis-section">
        <div className="loading-message">
          <p>Loading risk data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="risk-analysis-section">
      {/* Header with Formula */}
      <div className="analysis-header">
        <div className="header-formula">
          <h2>Risk Analysis</h2>
          <div className="formula-display-compact">
            <span className="formula-label">INFORM Formula:</span>
            <span className="formula-equation">
              Risk = (H and E x V x LCC)<sup>1/3</sup>
            </span>
            {formulaVerification?.isValid && (
              <span className="verified-badge">Verified</span>
            )}
          </div>
          <div className="formula-longform">
            Risk = (Hazard and Exposure x Vulnerability x Lack of Coping Capacity)<sup>1/3</sup>
          </div>
        </div>
        <div className="header-result">
          <div className="tanzania-risk-score" style={{ borderColor: classification?.color }}>
            <span className="score-value" style={{ color: classification?.color }}>
              {national.risk.toFixed(1)}
            </span>
            <span className="score-label">Tanzania Risk</span>
            <span className="score-class" style={{ backgroundColor: classification?.color }}>
              {classification?.level}
            </span>
          </div>
        </div>
      </div>

      {/* Active Warnings Summary */}
      {activeWarnings && activeWarnings.length > 0 && (
        <div className="active-warnings-summary">
          <div className="warning-count">
            <span className="count-icon">!</span>
            <span className="count-value">{activeWarnings.length}</span>
            <span className="count-label">Active Warnings</span>
          </div>
          <div className="warning-note">
            Risk analysis helps determine warning severity based on baseline risk context
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="analysis-two-column">
        {/* Left: Formula Breakdown */}
        <div className="analysis-column formula-column">
          <h3>INFORM Risk Components</h3>
          <p className="column-desc">Geometric mean of three equally-weighted dimensions</p>

          <div className="components-compact">
            <div className="component-row he">
              <div className="comp-icon">!</div>
              <div className="comp-details">
                <span className="comp-name">Hazard and Exposure</span>
                <span className="comp-desc">Likelihood and population exposed</span>
              </div>
              <div className="comp-score">{national.hazardExposure.toFixed(1)}</div>
              <div className="comp-bar">
                <div className="bar-fill" style={{ width: `${(national.hazardExposure / 10) * 100}%`, backgroundColor: '#D32F2F' }} />
              </div>
            </div>

            <div className="component-row v">
              <div className="comp-icon">*</div>
              <div className="comp-details">
                <span className="comp-name">Vulnerability</span>
                <span className="comp-desc">Susceptibility to harm</span>
              </div>
              <div className="comp-score">{national.vulnerability.toFixed(1)}</div>
              <div className="comp-bar">
                <div className="bar-fill" style={{ width: `${(national.vulnerability / 10) * 100}%`, backgroundColor: '#FF9800' }} />
              </div>
            </div>

            <div className="component-row lcc">
              <div className="comp-icon">#</div>
              <div className="comp-details">
                <span className="comp-name">Lack of Coping Capacity</span>
                <span className="comp-desc">Ability to manage shocks</span>
              </div>
              <div className="comp-score">{national.lackCopingCapacity.toFixed(1)}</div>
              <div className="comp-bar">
                <div className="bar-fill" style={{ width: `${(national.lackCopingCapacity / 10) * 100}%`, backgroundColor: '#1976D2' }} />
              </div>
            </div>
          </div>

          {/* Compact Calculation */}
          <div className="calculation-compact">
            <div className="calc-flow">
              <span className="calc-step">
                {national.hazardExposure.toFixed(1)} x {national.vulnerability.toFixed(1)} x {national.lackCopingCapacity.toFixed(1)}
              </span>
              <span className="calc-arrow">-&gt;</span>
              <span className="calc-step">
                3root{(national.hazardExposure * national.vulnerability * national.lackCopingCapacity).toFixed(1)}
              </span>
              <span className="calc-arrow">-&gt;</span>
              <span className="calc-result" style={{ color: classification?.color }}>
                {national.risk.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Risk Matrix */}
        <div className="analysis-column matrix-column">
          <h3>Risk Assessment Matrix</h3>
          <p className="column-desc">Likelihood x Impact = Risk Score (1-25)</p>

          {/* Compact Matrix Grid */}
          <div className="matrix-compact">
            <div className="matrix-grid-compact">
              {/* Header row */}
              <div className="matrix-row-compact header">
                <div className="matrix-cell-compact corner"></div>
                {RISK_MATRIX.impact.map(imp => (
                  <div key={imp.score} className="matrix-cell-compact header-cell" title={imp.label}>
                    {imp.score}
                  </div>
                ))}
              </div>
              {/* Data rows */}
              {RISK_MATRIX.likelihood.slice().reverse().map(lik => (
                <div key={lik.score} className="matrix-row-compact">
                  <div className="matrix-cell-compact header-cell" title={lik.label}>{lik.score}</div>
                  {RISK_MATRIX.impact.map(imp => {
                    const risk = getRiskLevel(lik.score, imp.score);
                    const isSelected = selectedLikelihood === lik.score && selectedImpact === imp.score;
                    return (
                      <div
                        key={`${lik.score}-${imp.score}`}
                        className={`matrix-cell-compact ${isSelected ? 'selected' : ''}`}
                        style={{ backgroundColor: risk.color }}
                        onClick={() => {
                          setSelectedLikelihood(lik.score);
                          setSelectedImpact(imp.score);
                        }}
                        title={`L:${lik.label} x I:${imp.label} = ${risk.level}`}
                      >
                        {lik.score * imp.score}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="matrix-labels">
              <span className="label-y">&lt;- Likelihood</span>
              <span className="label-x">Impact -&gt;</span>
            </div>
          </div>

          {/* Selected Result */}
          {calculatedRisk && (
            <div className="matrix-result-compact" style={{ borderColor: calculatedRisk.color }}>
              <span>L:{selectedLikelihood} x I:{selectedImpact} = </span>
              <strong style={{ color: calculatedRisk.color }}>
                {selectedLikelihood * selectedImpact} ({calculatedRisk.level})
              </strong>
            </div>
          )}

          {/* Compact Legend */}
          <div className="matrix-legend-compact">
            <span className="leg-item" style={{ backgroundColor: '#4CAF50' }}>Low 1-4</span>
            <span className="leg-item" style={{ backgroundColor: '#FFC107' }}>Med 5-9</span>
            <span className="leg-item" style={{ backgroundColor: '#FF9800' }}>High 10-16</span>
            <span className="leg-item" style={{ backgroundColor: '#F44336' }}>V.High 17-25</span>
          </div>
        </div>
      </div>

      {/* Risk Classification Scale - Full Width */}
      <div className="classification-scale-full">
        <h3>Risk Classification Scale</h3>
        <div className="scale-bar">
          <div className="scale-segment very-low">
            <span className="seg-label">Very Low</span>
            <span className="seg-range">0.0 - 1.9</span>
          </div>
          <div className="scale-segment low">
            <span className="seg-label">Low</span>
            <span className="seg-range">2.0 - 3.4</span>
          </div>
          <div className="scale-segment medium">
            <span className="seg-label">Medium</span>
            <span className="seg-range">3.5 - 4.9</span>
          </div>
          <div className="scale-segment high">
            <span className="seg-label">High</span>
            <span className="seg-range">5.0 - 6.4</span>
          </div>
          <div className="scale-segment very-high">
            <span className="seg-label">Very High</span>
            <span className="seg-range">6.5 - 10.0</span>
          </div>
        </div>
        {/* Current position indicator */}
        <div className="scale-indicator" style={{ left: `${(national.risk / 10) * 100}%` }}>
          <div className="indicator-marker" style={{ backgroundColor: classification?.color }}></div>
          <span className="indicator-label">Tanzania: {national.risk.toFixed(1)}</span>
        </div>
      </div>

      {/* Dynamic Flood & Drought Risk Assessment */}
      {(dynamicFloodRisk || dynamicDroughtRisk) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          {/* Flood Risk */}
          {dynamicFloodRisk && (
            <div style={{
              background: `linear-gradient(135deg, ${dynamicFloodRisk.alertLevel.color}10, white)`,
              border: `2px solid ${dynamicFloodRisk.alertLevel.color}`,
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <span>🌊</span> Flood Risk
                </h4>
                <span style={{
                  padding: '4px 12px',
                  background: dynamicFloodRisk.alertLevel.color,
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {dynamicFloodRisk.alertLevel.name}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: dynamicFloodRisk.alertLevel.color }}>{dynamicFloodRisk.riskIndex}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>Risk</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#FFF3E0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#E65100' }}>{dynamicFloodRisk.components.hazard}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>H</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#E3F2FD', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565C0' }}>{dynamicFloodRisk.components.exposure}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>E</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#FCE4EC', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#C2185B' }}>{dynamicFloodRisk.components.vulnerability}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>V</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                <strong>Action:</strong> {dynamicFloodRisk.responseActions[0]}
              </div>
            </div>
          )}

          {/* Drought Risk */}
          {dynamicDroughtRisk && (
            <div style={{
              background: `linear-gradient(135deg, ${dynamicDroughtRisk.alertLevel.color}10, white)`,
              border: `2px solid ${dynamicDroughtRisk.alertLevel.color}`,
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <span>☀️</span> Drought Risk
                </h4>
                <span style={{
                  padding: '4px 12px',
                  background: dynamicDroughtRisk.alertLevel.color,
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {dynamicDroughtRisk.alertLevel.name}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: dynamicDroughtRisk.alertLevel.color }}>{dynamicDroughtRisk.riskIndex}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>Risk</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#FFF3E0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#E65100' }}>{dynamicDroughtRisk.components.hazard}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>H</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#E3F2FD', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565C0' }}>{dynamicDroughtRisk.components.exposure}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>E</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#FCE4EC', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#C2185B' }}>{dynamicDroughtRisk.components.vulnerability}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>V</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                <strong>Action:</strong> {dynamicDroughtRisk.responseActions[0]}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Reference */}
      <div className="quick-reference">
        <div className="ref-item">
          <span className="ref-icon">#</span>
          <div className="ref-content">
            <strong>INFORM Formula</strong>
            <span>Geometric mean prevents compensation between dimensions</span>
          </div>
        </div>
        <div className="ref-item">
          <span className="ref-icon">=</span>
          <div className="ref-content">
            <strong>Risk Matrix</strong>
            <span>Click cells to calculate Likelihood x Impact</span>
          </div>
        </div>
        <div className="ref-item">
          <span className="ref-icon">*</span>
          <div className="ref-content">
            <strong>Scale 0-10</strong>
            <span>All INFORM scores normalized to 0-10 range</span>
          </div>
        </div>
      </div>

      {/* Warning Integration - Enhanced Formula */}
      <div className="warning-integration-section">
        <div className="integration-header">
          <h3>Integration with Early Warning System</h3>
          <p>
            Warning levels are determined by combining baseline risk context with real-time hazard data
            and layered analysis of exposure and vulnerability factors.
          </p>
        </div>

        {/* Main Formula Display */}
        <div className="warning-formula-display">
          <div className="formula-title">Warning Level Calculation</div>
          <div className="formula-equation-large">
            <div className="formula-component baseline">
              <div className="component-icon">📊</div>
              <div className="component-label">Baseline Risk</div>
              <div className="component-value" style={{ color: classification?.color }}>
                {national.risk.toFixed(1)}
              </div>
              <div className="component-source">(INFORM Index)</div>
            </div>

            <div className="formula-operator-large">+</div>

            <div className="formula-component hazard">
              <div className="component-icon">⚡</div>
              <div className="component-label">Real-time Hazard</div>
              <div className="component-value">H<sub>t</sub></div>
              <div className="component-source">(TMA/MoW/MoH)</div>
            </div>

            <div className="formula-operator-large">×</div>

            <div className="formula-component exposure">
              <div className="component-icon">🎯</div>
              <div className="component-label">Exposure Layer</div>
              <div className="component-value">{national.hazardExposure.toFixed(1)}</div>
              <div className="component-source">(Population at Risk)</div>
            </div>

            <div className="formula-operator-large">×</div>

            <div className="formula-component vulnerability">
              <div className="component-icon">🛡️</div>
              <div className="component-label">Vulnerability Layer</div>
              <div className="component-value">{national.vulnerability.toFixed(1)}</div>
              <div className="component-source">(Susceptibility)</div>
            </div>

            <div className="formula-operator-large">=</div>

            <div className="formula-component warning-result">
              <div className="component-icon">🚨</div>
              <div className="component-label">Warning Level</div>
              <div className="component-value">W<sub>level</sub></div>
              <div className="component-source">(Impact-Based)</div>
            </div>
          </div>
        </div>

        {/* Warning Level Output */}
        <div className="warning-output-section">
          <h4>Warning Level Classification</h4>
          <div className="warning-levels-grid">
            <div className="warning-level advisory">
              <div className="level-indicator"></div>
              <div className="level-info">
                <span className="level-name">Advisory</span>
                <span className="level-range">Score: 1-4</span>
              </div>
              <div className="level-action">Monitor situation</div>
            </div>
            <div className="warning-level warning">
              <div className="level-indicator"></div>
              <div className="level-info">
                <span className="level-name">Warning</span>
                <span className="level-range">Score: 5-9</span>
              </div>
              <div className="level-action">Prepare response</div>
            </div>
            <div className="warning-level major">
              <div className="level-indicator"></div>
              <div className="level-info">
                <span className="level-name">Major Warning</span>
                <span className="level-range">Score: 10-16</span>
              </div>
              <div className="level-action">Activate response</div>
            </div>
            <div className="warning-level emergency">
              <div className="level-indicator"></div>
              <div className="level-info">
                <span className="level-name">Emergency</span>
                <span className="level-range">Score: 17-25</span>
              </div>
              <div className="level-action">Immediate action</div>
            </div>
          </div>
        </div>

        {/* Key Insight */}
        <div className="integration-insight">
          <div className="insight-icon">💡</div>
          <div className="insight-content">
            <strong>Risk-Informed Principle:</strong> The same hazard signal does not produce
            the same warning everywhere. A 100mm rainfall in a <strong>low-vulnerability district</strong> may
            be an Advisory, but in a <strong>high-vulnerability district</strong> with exposed populations
            it becomes a Major Warning. This layered approach ensures warnings are proportional to actual risk.
          </div>
        </div>
      </div>

      {/* INTERACTIVE RISK LAYERING ANALYSIS */}
      <div className="risk-layering-section" style={{
        marginTop: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
        borderRadius: '16px',
        color: 'white'
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          🗺️ Interactive Risk Layering Analysis
        </h2>
        <p style={{ margin: '0 0 16px 0', opacity: 0.9 }}>
          Select regions, toggle data layers, and calculate expected impact using the INFORM methodology
        </p>

        {/* REAL-TIME LAYER COMBINATION DISPLAY */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '2px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Active Layer Formula:</span>
            </div>
            {/* Dynamic Formula Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              fontFamily: 'monospace',
              fontSize: '13px'
            }}>
              <span style={{
                background: selectedBaselineRisks.length > 0 ? '#4CAF50' : 'rgba(255,255,255,0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                opacity: selectedBaselineRisks.length > 0 ? 1 : 0.5
              }}>
                B({selectedBaselineRisks.length})
              </span>
              <span style={{ opacity: 0.7 }}>+</span>
              <span style={{
                background: selectedHazardIds.length > 0 ? '#F44336' : 'rgba(255,255,255,0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                opacity: selectedHazardIds.length > 0 ? 1 : 0.5,
                animation: selectedHazardIds.length > 0 ? 'pulse 2s infinite' : 'none'
              }}>
                H({selectedHazardIds.length > 0 ? selectedHazardIds.length : hazardIntensity})
              </span>
              <span style={{ opacity: 0.7 }}>x</span>
              <span style={{
                background: selectedExposureLayers.length > 0 ? '#2196F3' : 'rgba(255,255,255,0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                opacity: selectedExposureLayers.length > 0 ? 1 : 0.5
              }}>
                E({selectedExposureLayers.length})
              </span>
              <span style={{ opacity: 0.7 }}>x</span>
              <span style={{
                background: selectedVulnerabilityLayers.length > 0 ? '#FF9800' : 'rgba(255,255,255,0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                opacity: selectedVulnerabilityLayers.length > 0 ? 1 : 0.5
              }}>
                V({selectedVulnerabilityLayers.length})
              </span>
              <span style={{ opacity: 0.7 }}>x</span>
              <span style={{
                background: selectedCopingLayers.length > 0 ? '#9C27B0' : 'rgba(255,255,255,0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                opacity: selectedCopingLayers.length > 0 ? 1 : 0.5
              }}>
                C({selectedCopingLayers.length})
              </span>
              {calculatedImpact && (
                <>
                  <span style={{ opacity: 0.7 }}>=</span>
                  <span style={{
                    background: calculatedImpact.impactColor,
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    {calculatedImpact.riskScore}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats Row */}
          {calculatedImpact && (
            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.2)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ opacity: 0.8, fontSize: '12px' }}>Regions:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedRegions.length}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ opacity: 0.8, fontSize: '12px' }}>Districts:</span>
                <span style={{ fontWeight: 'bold' }}>{totalSelectedDistricts}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ opacity: 0.8, fontSize: '12px' }}>Est. Affected:</span>
                <span style={{ fontWeight: 'bold', color: calculatedImpact.impactColor }}>
                  {calculatedImpact.estimatedAffected.toLocaleString()}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: 'auto',
                background: calculatedImpact.impactColor,
                padding: '4px 12px',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}>
                {calculatedImpact.warningLevel}
              </div>
            </div>
          )}
        </div>

        {/* QUICK LAYER PRESETS */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12px', opacity: 0.8, alignSelf: 'center' }}>Quick Presets:</span>
          <button
            onClick={() => {
              setSelectedBaselineRisks(['overall']);
              setSelectedExposureLayers(['population']);
              setSelectedVulnerabilityLayers(['poverty']);
              setSelectedCopingLayers(['hospitals']);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            Standard Analysis
          </button>
          <button
            onClick={() => {
              setSelectedBaselineRisks(['flood_risk', 'drought_risk']);
              setSelectedExposureLayers(['population', 'cropland']);
              setSelectedVulnerabilityLayers(['poverty', 'foodInsecurity']);
              setSelectedCopingLayers(['hospitals', 'shelters', 'roads']);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            Full Humanitarian
          </button>
          <button
            onClick={() => {
              setSelectedBaselineRisks(['flood_risk', 'riverine_flood', 'flash_flood']);
              setSelectedExposureLayers(['population', 'infrastructure']);
              setSelectedVulnerabilityLayers(['poverty', 'waterAccess']);
              setSelectedCopingLayers(['shelters', 'evacuationRoutes']);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #2196F3',
              background: '#2196F3',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            Flood Scenario
          </button>
          <button
            onClick={() => {
              setSelectedBaselineRisks(['drought_risk', 'food_crisis']);
              setSelectedExposureLayers(['cropland', 'livestock']);
              setSelectedVulnerabilityLayers(['foodInsecurity', 'waterAccess']);
              setSelectedCopingLayers(['hospitals', 'roads']);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #FF9800',
              background: '#FF9800',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            Drought/Food Crisis
          </button>
          <button
            onClick={() => {
              setSelectedBaselineRisks(['epidemic_risk', 'cholera_risk', 'malaria_risk']);
              setSelectedExposureLayers(['population']);
              setSelectedVulnerabilityLayers(['healthAccess', 'waterAccess', 'vulnerableGroups']);
              setSelectedCopingLayers(['hospitals']);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #E91E63',
              background: '#E91E63',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            Health Emergency
          </button>
          <button
            onClick={() => {
              setSelectedBaselineRisks([]);
              setSelectedHazardIds([]);
              setSelectedExposureLayers([]);
              setSelectedVulnerabilityLayers([]);
              setSelectedCopingLayers([]);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              opacity: 0.8
            }}
          >
            Clear All
          </button>
        </div>

        {/* Region & District Selection - Simplified */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          padding: '12px',
          borderRadius: '10px',
          marginBottom: '16px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🎯 Select Affected Areas</span>
            {totalSelectedDistricts > 0 && (
              <span style={{
                background: calculatedImpact?.impactColor || '#4CAF50',
                padding: '3px 10px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {totalSelectedDistricts} selected
              </span>
            )}
          </h4>

          {/* Regions with expandable districts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
            {Object.entries(REGIONS_WITH_DISTRICTS).map(([region, districts]) => {
              const isRegionSelected = selectedRegions.includes(region);
              const isExpanded = expandedRegions.includes(region);
              const selectedDistrictsInRegion = districts.filter(d => selectedDistricts[d]);
              const hasSelectedDistricts = selectedDistrictsInRegion.length > 0;
              const selectedColor = calculatedImpact ? calculatedImpact.impactColor : '#4CAF50';

              return (
                <div key={region} style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                  {/* Region Header - Compact */}
                  <div
                    onClick={() => toggleRegionExpand(region)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      background: hasSelectedDistricts ? `${selectedColor}25` : 'transparent',
                      borderLeft: hasSelectedDistricts ? `3px solid ${selectedColor}` : '3px solid transparent'
                    }}
                  >
                    {/* Expand arrow */}
                    <span style={{ fontSize: '10px', opacity: 0.7, width: '12px' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>

                    {/* Region checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleRegion(region); }}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: `1px solid ${isRegionSelected ? selectedColor : 'rgba(255,255,255,0.4)'}`,
                        background: isRegionSelected ? selectedColor : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '10px',
                        padding: 0
                      }}
                    >
                      {isRegionSelected && '✓'}
                    </button>

                    {/* Region name */}
                    <span style={{ flex: 1, fontWeight: hasSelectedDistricts ? '600' : 'normal', fontSize: '12px' }}>
                      {region}
                    </span>

                    {/* District count */}
                    {hasSelectedDistricts && (
                      <span style={{
                        background: selectedColor,
                        padding: '1px 6px',
                        borderRadius: '8px',
                        fontSize: '9px',
                        fontWeight: 'bold'
                      }}>
                        {selectedDistrictsInRegion.length}
                      </span>
                    )}
                  </div>

                  {/* Districts (shown when expanded) */}
                  {isExpanded && (
                    <div style={{
                      padding: '8px 12px 8px 48px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      background: 'rgba(0,0,0,0.1)'
                    }}>
                      {districts.map(district => {
                        const isDistrictSelected = selectedDistricts[district];
                        const districtLevel = selectedDistricts[district];
                        const districtColor = isDistrictSelected ? getDistrictWarningColor(districtLevel) : 'rgba(255,255,255,0.2)';

                        return (
                          <button
                            key={district}
                            onClick={() => toggleDistrict(district, calculatedImpact?.warningLevel || 'Advisory')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              border: isDistrictSelected ? `2px solid ${districtColor}` : '1px solid rgba(255,255,255,0.3)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: isDistrictSelected ? 'bold' : 'normal',
                              background: isDistrictSelected ? districtColor : 'transparent',
                              color: 'white',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title={isDistrictSelected ? `${district} - ${districtLevel}` : district}
                          >
                            {isDistrictSelected && <span style={{ fontSize: '10px' }}>✓</span>}
                            {district}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Hazard Intensity Slider */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⚡ Hazard Intensity (H)</span>
            <span style={{
              background: hazardIntensity >= 8 ? '#F44336' : hazardIntensity >= 5 ? '#FF9800' : '#FFC107',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {hazardIntensity}
            </span>
          </h4>
          <input
            type="range"
            min="1"
            max="10"
            value={hazardIntensity}
            onChange={(e) => setHazardIntensity(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.7 }}>
            <span>1 (Minor)</span>
            <span>5 (Moderate)</span>
            <span>10 (Severe)</span>
          </div>
        </div>

        {/* VISUAL RISK LAYERING MAP */}
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🗺️ Visual Risk Layering Map
          </h3>

          {/* Multi-Select Layer Grid - Single Row Horizontal Layout */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            overflowX: 'auto'
          }}>
            {/* Baseline Risk - Multi-Select with Categories */}
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              padding: '10px',
              borderRadius: '8px',
              color: '#333',
              minWidth: '180px',
              flex: '1 1 180px'
            }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '10px', color: '#1B5E20' }}>
                📊 Baseline Risk ({selectedBaselineRisks.length})
              </label>
              <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '9px' }}>
                {/* INFORM Dimensions */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    background: '#E8F5E9',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    color: '#1B5E20',
                    marginBottom: '4px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>
                    📐 INFORM Dimensions
                  </div>
                  {BASELINE_RISK_OPTIONS.filter(o => o.category === 'dimension').map(option => (
                    <label key={option.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: selectedBaselineRisks.includes(option.id) ? option.color + '22' : 'transparent',
                      marginBottom: '2px'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedBaselineRisks.includes(option.id)}
                        onChange={() => toggleBaselineRisk(option.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1 }}>{option.label}</span>
                      <span style={{
                        background: option.color,
                        color: 'white',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '9px'
                      }}>{option.score}</span>
                    </label>
                  ))}
                </div>

                {/* Natural Hazards */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    background: '#E3F2FD',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    color: '#1565C0',
                    marginBottom: '4px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>
                    🌍 Natural Hazards
                  </div>
                  {BASELINE_RISK_OPTIONS.filter(o => o.category === 'natural').map(option => (
                    <label key={option.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: selectedBaselineRisks.includes(option.id) ? option.color + '22' : 'transparent',
                      marginBottom: '2px'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedBaselineRisks.includes(option.id)}
                        onChange={() => toggleBaselineRisk(option.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1 }}>{option.label}</span>
                      <span style={{
                        background: option.color,
                        color: 'white',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '9px'
                      }}>{option.score}</span>
                    </label>
                  ))}
                </div>

                {/* Human-Induced Hazards */}
                <div>
                  <div style={{
                    background: '#FFF3E0',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    color: '#E65100',
                    marginBottom: '4px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>
                    🏭 Human-Induced Hazards
                  </div>
                  {BASELINE_RISK_OPTIONS.filter(o => o.category === 'human').map(option => (
                    <label key={option.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: selectedBaselineRisks.includes(option.id) ? option.color + '22' : 'transparent',
                      marginBottom: '2px'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedBaselineRisks.includes(option.id)}
                        onChange={() => toggleBaselineRisk(option.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1 }}>{option.label}</span>
                      <span style={{
                        background: option.color,
                        color: 'white',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '9px'
                      }}>{option.score}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Hazards Pending Review - Linked to Hazard Alert Inputs from Institutions */}
            <div style={{
              background: activeHazards?.length > 0 ? '#FFF3F3' : 'rgba(255,255,255,0.95)',
              padding: '10px',
              borderRadius: '8px',
              color: '#333',
              border: activeHazards?.length > 0 ? '2px solid #F44336' : 'none',
              minWidth: '180px',
              flex: '1 1 180px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '10px', color: '#D32F2F' }}>
                  🚨 Hazard Alerts ({selectedHazardIds.length}/{activeHazards?.length || 0})
                </label>
                {activeHazards?.length > 0 && (
                  <span style={{
                    background: '#F44336',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    animation: 'pulse 2s infinite'
                  }}>{activeHazards.length}</span>
                )}
              </div>
              {hazardOptions.length > 0 ? (
                <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '10px' }}>
                  {hazardOptions.map(option => (
                    <label key={option.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: selectedHazardIds.includes(option.id) ? '#FFEBEE' : '#FAFAFA',
                      marginBottom: '3px',
                      border: selectedHazardIds.includes(option.id) ? '2px solid #F44336' : '1px solid #E0E0E0'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedHazardIds.includes(option.id)}
                        onChange={() => toggleHazard(option.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px' }}>{option.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '9px',
                          color: selectedHazardIds.includes(option.id) ? '#C62828' : '#333',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {option.label}
                        </div>
                        <div style={{ fontSize: '8px', color: '#666', display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          <span style={{
                            background: '#1976D2',
                            color: 'white',
                            padding: '0px 4px',
                            borderRadius: '2px'
                          }}>{option.institution}</span>
                          <span style={{
                            background: option.severity === 'Major Warning' ? '#D32F2F' :
                                       option.severity === 'Warning' ? '#FF9800' :
                                       option.severity === 'Advisory' ? '#FFC107' : '#4CAF50',
                            color: 'white',
                            padding: '0px 4px',
                            borderRadius: '2px'
                          }}>{option.severity?.split(' ')[0] || 'Alert'}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{
                  fontSize: '9px',
                  color: '#666',
                  padding: '12px',
                  textAlign: 'center',
                  background: '#F5F5F5',
                  borderRadius: '4px',
                  border: '1px dashed #CCC'
                }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>📭</div>
                  <div style={{ fontWeight: 'bold' }}>No Alerts</div>
                  <div style={{ fontSize: '8px', color: '#888' }}>Submit from Hazard Input</div>
                </div>
              )}
            </div>

            {/* Exposure Layers - Multi-Select */}
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              padding: '10px',
              borderRadius: '8px',
              color: '#333',
              minWidth: '180px',
              flex: '1 1 180px'
            }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '10px', color: '#1565C0' }}>
                🎯 Exposure ({selectedExposureLayers.length})
              </label>
              <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '10px' }}>
                {EXPOSURE_LAYER_OPTIONS.filter(o => o.id !== 'none').map(option => (
                  <label key={option.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 4px',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    background: selectedExposureLayers.includes(option.id) ? '#E3F2FD' : 'transparent',
                    marginBottom: '1px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedExposureLayers.includes(option.id)}
                      onChange={() => toggleExposureLayer(option.id)}
                      style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                    />
                    <span style={{ fontSize: '9px' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Vulnerability Layers - Multi-Select */}
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              padding: '10px',
              borderRadius: '8px',
              color: '#333',
              minWidth: '180px',
              flex: '1 1 180px'
            }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '10px', color: '#E65100' }}>
                🛡️ Vulnerability ({selectedVulnerabilityLayers.length})
              </label>
              <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '10px' }}>
                {VULNERABILITY_LAYER_OPTIONS.filter(o => o.id !== 'none').map(option => (
                  <label key={option.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 4px',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    background: selectedVulnerabilityLayers.includes(option.id) ? '#FFF3E0' : 'transparent',
                    marginBottom: '1px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedVulnerabilityLayers.includes(option.id)}
                      onChange={() => toggleVulnerabilityLayer(option.id)}
                      style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                    />
                    <span style={{ fontSize: '9px' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Coping Capacity Layers - Multi-Select */}
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              padding: '10px',
              borderRadius: '8px',
              color: '#333',
              minWidth: '180px',
              flex: '1 1 180px'
            }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '10px', color: '#7B1FA2' }}>
                🏛️ Coping Capacity ({selectedCopingLayers.length})
              </label>
              <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '10px' }}>
                {COPING_LAYER_OPTIONS.filter(o => o.id !== 'none').map(option => (
                  <label key={option.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 4px',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    background: selectedCopingLayers.includes(option.id) ? '#F3E5F5' : 'transparent',
                    marginBottom: '1px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedCopingLayers.includes(option.id)}
                      onChange={() => toggleCopingLayer(option.id)}
                      style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                    />
                    <span style={{ fontSize: '9px' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }}>
            <div style={{ height: '600px', position: 'relative' }}>
              <InteractiveHazardMap
                activeHazards={activeHazards || []}
                selectedHazardsForMarkers={selectedHazards}
                riskData={riskData}
                showPMOView={true}
                selectedDistricts={hazardSelectedDistricts}
                warningLevel={selectedHazards.length > 0 ? (selectedHazards[0].severity || 'Advisory') : 'Advisory'}
                enabledLayers={{
                  hospitals: selectedCopingLayers.includes('hospitals'),
                  shelters: selectedCopingLayers.includes('shelters'),
                  roads: selectedCopingLayers.includes('roads'),
                  fireStations: selectedCopingLayers.includes('fireStations'),
                  policeStations: selectedCopingLayers.includes('policeStations'),
                  evacuationRoutes: selectedCopingLayers.includes('evacuationRoutes')
                }}
                riskLayerOverlay={selectedBaselineRisks.length > 0 ? BASELINE_RISK_OPTIONS.find(o => o.id === selectedBaselineRisks[0]) : null}
                riskLayerOverlays={selectedBaselineRisks.map(id => BASELINE_RISK_OPTIONS.find(o => o.id === id)).filter(Boolean)}
                forecastOverlay={selectedHazards.length > 0 ? {
                  ...selectedHazards[0],
                  type: selectedHazards[0].hazardData?.hazardType || selectedHazards[0].label,
                  hazardData: selectedHazards[0].hazardData
                } : null}
                forecastOverlays={selectedHazards}
                exposureOverlay={selectedExposureLayers.length > 0 ? { type: selectedExposureLayers[0] } : null}
                exposureOverlays={selectedExposureLayers.map(type => ({ type }))}
                vulnerabilityOverlay={selectedVulnerabilityLayers.length > 0 ? { type: selectedVulnerabilityLayers[0] } : null}
                vulnerabilityOverlays={selectedVulnerabilityLayers.map(type => ({ type }))}
                selectedHazardIds={selectedHazardIds}
              />
              {/* Layer Legend Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                background: 'rgba(255,255,255,0.95)',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '10px',
                color: '#333',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                zIndex: 1000,
                maxWidth: '320px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '11px' }}>
                  Active Layers ({selectedBaselineRisks.length + selectedHazardIds.length + selectedExposureLayers.length + selectedVulnerabilityLayers.length + selectedCopingLayers.length})
                </div>

                {/* Risk Scale - Choropleth Legend */}
                {selectedBaselineRisks.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '9px', color: '#1B5E20', fontWeight: 'bold', marginBottom: '3px' }}>
                      📊 Baseline Risk ({selectedBaselineRisks.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '4px' }}>
                      {selectedBaselineRisks.map(id => {
                        const opt = BASELINE_RISK_OPTIONS.find(o => o.id === id);
                        return opt ? (
                          <span key={id} style={{
                            background: opt.color,
                            color: 'white',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '8px'
                          }}>{opt.label.split(' ')[0]}</span>
                        ) : null;
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '1px', marginBottom: '2px' }}>
                      <div style={{ flex: 1, height: '8px', background: '#43A047', borderRadius: '2px 0 0 2px' }} />
                      <div style={{ flex: 1, height: '8px', background: '#FFC107' }} />
                      <div style={{ flex: 1, height: '8px', background: '#FF9800' }} />
                      <div style={{ flex: 1, height: '8px', background: '#F44336', borderRadius: '0 2px 2px 0' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#666' }}>
                      <span>Low</span>
                      <span>Med</span>
                      <span>High</span>
                      <span>V.High</span>
                    </div>
                  </div>
                )}

                {/* Hazards Pending Review Info */}
                {selectedHazards.length > 0 && (
                  <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '5px', marginTop: '5px' }}>
                    <div style={{ fontSize: '9px', color: '#D32F2F', fontWeight: 'bold', marginBottom: '3px' }}>
                      ⚡ Hazards Pending Review ({selectedHazards.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {selectedHazards.map(h => (
                        <span key={h.id} style={{
                          background: '#FFEBEE',
                          border: '1px solid #F44336',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontSize: '8px',
                          color: '#C62828'
                        }}>{h.icon} {h.label.split(' - ')[0]} ({h.institution})</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exposure Layers */}
                {selectedExposureLayers.length > 0 && (
                  <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '5px', marginTop: '5px' }}>
                    <div style={{ fontSize: '9px', color: '#1565C0', fontWeight: 'bold', marginBottom: '3px' }}>
                      🎯 Exposure ({selectedExposureLayers.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {selectedExposureLayers.map(id => {
                        const opt = EXPOSURE_LAYER_OPTIONS.find(o => o.id === id);
                        return opt ? (
                          <span key={id} style={{
                            background: '#E3F2FD',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '8px',
                            color: '#1565C0'
                          }}>{opt.label}</span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Vulnerability Layers */}
                {selectedVulnerabilityLayers.length > 0 && (
                  <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '5px', marginTop: '5px' }}>
                    <div style={{ fontSize: '9px', color: '#E65100', fontWeight: 'bold', marginBottom: '3px' }}>
                      🛡️ Vulnerability ({selectedVulnerabilityLayers.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {selectedVulnerabilityLayers.map(id => {
                        const opt = VULNERABILITY_LAYER_OPTIONS.find(o => o.id === id);
                        return opt ? (
                          <span key={id} style={{
                            background: '#FFF3E0',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '8px',
                            color: '#E65100'
                          }}>{opt.label}</span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Coping Capacity Layers */}
                {selectedCopingLayers.length > 0 && (
                  <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '5px', marginTop: '5px' }}>
                    <div style={{ fontSize: '9px', color: '#7B1FA2', fontWeight: 'bold', marginBottom: '3px' }}>
                      🏛️ Coping Capacity ({selectedCopingLayers.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {selectedCopingLayers.map(id => {
                        const opt = COPING_LAYER_OPTIONS.find(o => o.id === id);
                        return opt ? (
                          <span key={id} style={{
                            background: '#F3E5F5',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '8px',
                            color: '#7B1FA2'
                          }}>{opt.label}</span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Impact Results */}
        {calculatedImpact && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            color: '#333',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
              {/* Risk Score Display */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${calculatedImpact.impactColor}, ${calculatedImpact.impactColor}DD)`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: `0 8px 24px ${calculatedImpact.impactColor}66`
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{calculatedImpact.riskScore}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>RISK SCORE</div>
                </div>
                <div style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: calculatedImpact.impactColor,
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {calculatedImpact.impactClass} Impact
                </div>
                <div style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: calculatedImpact.impactColor + '22',
                  color: calculatedImpact.impactColor,
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  border: `2px solid ${calculatedImpact.impactColor}`
                }}>
                  {calculatedImpact.warningLevel}
                </div>
              </div>

              {/* Key Metrics */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>📊 Expected Impact Summary</h4>
                <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
                  {calculatedImpact.impactDescription}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ background: '#F5F5F5', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Total Population</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976D2' }}>
                      {calculatedImpact.totalPopulation.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: '#F5F5F5', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Est. Affected</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: calculatedImpact.impactColor }}>
                      {calculatedImpact.estimatedAffected.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: '#E3F2FD', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Exposure Score (E)</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1565C0' }}>
                      {calculatedImpact.avgExposure}
                    </div>
                  </div>
                  <div style={{ background: '#FFF3E0', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Vulnerability Score (V)</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#E65100' }}>
                      {calculatedImpact.avgVulnerability}
                    </div>
                  </div>
                </div>
              </div>

              {/* Formula Display - Dynamic Layer-Based Calculation */}
              <div style={{
                background: '#FAFAFA',
                padding: '16px',
                borderRadius: '12px',
                minWidth: '240px',
                border: '2px solid #E0E0E0'
              }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                  Dynamic Layer Calculation
                </h5>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#333' }}>
                  {/* Baseline Risk */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '4px', background: '#E8F5E9', borderRadius: '4px' }}>
                    <span style={{ color: '#1B5E20' }}>B (Baseline):</span>
                    <strong style={{ color: '#1B5E20' }}>{calculatedImpact.baselineRisk}</strong>
                  </div>
                  {/* Hazard */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '4px', background: '#FFEBEE', borderRadius: '4px' }}>
                    <span style={{ color: '#C62828' }}>H (Hazard):</span>
                    <strong style={{ color: '#C62828' }}>{calculatedImpact.hazardIntensity}</strong>
                  </div>
                  {/* Combined Hazard */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: '#666' }}>
                    <span>Combined (B+H)/2:</span>
                    <strong>{calculatedImpact.combinedHazard}</strong>
                  </div>
                  {/* Exposure */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '4px', background: '#E3F2FD', borderRadius: '4px' }}>
                    <span style={{ color: '#1565C0' }}>E (Exposure):</span>
                    <strong style={{ color: '#1565C0' }}>{calculatedImpact.avgExposure}</strong>
                  </div>
                  {/* Vulnerability */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '4px', background: '#FFF3E0', borderRadius: '4px' }}>
                    <span style={{ color: '#E65100' }}>V (Vulnerability):</span>
                    <strong style={{ color: '#E65100' }}>{calculatedImpact.avgVulnerability}</strong>
                  </div>
                  {/* Lack of Coping */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '4px', background: '#F3E5F5', borderRadius: '4px' }}>
                    <span style={{ color: '#7B1FA2' }}>LCC (Coping):</span>
                    <strong style={{ color: '#7B1FA2' }}>{calculatedImpact.lackOfCoping}</strong>
                  </div>
                  <hr style={{ margin: '8px 0', border: 'none', borderTop: '2px solid #E0E0E0' }} />
                  {/* Formula */}
                  <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', marginBottom: '6px' }}>
                    Risk = ((B+H)/2 x E x V x LCC)^(1/4)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', padding: '8px', background: calculatedImpact.impactColor + '22', borderRadius: '6px' }}>
                    <span>Risk Score:</span>
                    <strong style={{ color: calculatedImpact.impactColor }}>{calculatedImpact.riskScore}</strong>
                  </div>
                </div>
                {/* Layer count breakdown */}
                <div style={{ marginTop: '12px', fontSize: '10px', color: '#666' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                    {calculatedImpact.layerBreakdown?.baselineRisks > 0 && (
                      <span style={{ background: '#E8F5E9', padding: '2px 6px', borderRadius: '3px' }}>
                        B:{calculatedImpact.layerBreakdown.baselineRisks}
                      </span>
                    )}
                    {calculatedImpact.layerBreakdown?.hazards > 0 && (
                      <span style={{ background: '#FFEBEE', padding: '2px 6px', borderRadius: '3px' }}>
                        H:{calculatedImpact.layerBreakdown.hazards}
                      </span>
                    )}
                    {calculatedImpact.layerBreakdown?.exposure > 0 && (
                      <span style={{ background: '#E3F2FD', padding: '2px 6px', borderRadius: '3px' }}>
                        E:{calculatedImpact.layerBreakdown.exposure}
                      </span>
                    )}
                    {calculatedImpact.layerBreakdown?.vulnerability > 0 && (
                      <span style={{ background: '#FFF3E0', padding: '2px 6px', borderRadius: '3px' }}>
                        V:{calculatedImpact.layerBreakdown.vulnerability}
                      </span>
                    )}
                    {calculatedImpact.layerBreakdown?.coping > 0 && (
                      <span style={{ background: '#F3E5F5', padding: '2px 6px', borderRadius: '3px' }}>
                        C:{calculatedImpact.layerBreakdown.coping}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
                  {calculatedImpact.enabledLayerCount} layers • {calculatedImpact.regionsCount} regions
                </div>
              </div>
            </div>

            {/* Infrastructure at Risk - Now uses selectedCopingLayers */}
            {selectedCopingLayers.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #E0E0E0' }}>
                <h5 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '14px' }}>
                  🏛️ Coping Capacity Resources ({selectedCopingLayers.length} layers active)
                </h5>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {selectedCopingLayers.includes('hospitals') && (
                    <div style={{ background: '#FFEBEE', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>🏥</span>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#D32F2F' }}>
                          {calculatedImpact.infrastructureCount.hospitals}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Hospitals</div>
                      </div>
                    </div>
                  )}
                  {selectedCopingLayers.includes('shelters') && (
                    <div style={{ background: '#E3F2FD', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>🏠</span>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976D2' }}>
                          {calculatedImpact.infrastructureCount.shelters}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Shelters</div>
                      </div>
                    </div>
                  )}
                  {selectedCopingLayers.includes('roads') && (
                    <div style={{ background: '#FFF3E0', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>🛣️</span>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF9800' }}>
                          {calculatedImpact.infrastructureCount.roads}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Road Segments</div>
                      </div>
                    </div>
                  )}
                  {selectedCopingLayers.includes('fireStations') && (
                    <div style={{ background: '#FCE4EC', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>🚒</span>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#C2185B' }}>
                          {calculatedImpact.infrastructureCount.fireStations}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Fire Stations</div>
                      </div>
                    </div>
                  )}
                  {selectedCopingLayers.includes('policeStations') && (
                    <div style={{ background: '#E8EAF6', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>👮</span>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3F51B5' }}>
                          {calculatedImpact.infrastructureCount.policeStations}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Police Stations</div>
                      </div>
                    </div>
                  )}
                  {selectedCopingLayers.includes('evacuationRoutes') && (
                    <div style={{ background: '#E8F5E9', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>🚗</span>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#388E3C' }}>
                          {calculatedImpact.infrastructureCount.evacuationRoutes}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Evacuation Routes</div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Coping Capacity Impact Note */}
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: '#F3E5F5',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#7B1FA2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>💡</span>
                  <span>
                    <strong>Coping Capacity Effect:</strong> {selectedCopingLayers.length} resources selected reduces
                    Lack of Coping Capacity by {(selectedCopingLayers.length * 0.5).toFixed(1)} points,
                    lowering overall risk.
                  </span>
                </div>
              </div>
            )}

            {/* Region Breakdown Table */}
            {calculatedImpact.regionData && calculatedImpact.regionData.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #E0E0E0' }}>
                <h5 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '14px' }}>📋 Detailed Region Analysis</h5>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#1976D2', color: 'white' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Region</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Population</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Density</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Infrastructure</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Poverty</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Exposure</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Vulnerability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedImpact.regionData.map((region, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#F5F5F5' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{region.region}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {region.population.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {region.density}/km²
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              background: region.infraLevel === 'Very High' ? '#FFEBEE' :
                                        region.infraLevel === 'High' ? '#FFF3E0' :
                                        region.infraLevel === 'Medium' ? '#FFF9C4' : '#E8F5E9',
                              color: region.infraLevel === 'Very High' ? '#C62828' :
                                    region.infraLevel === 'High' ? '#E65100' :
                                    region.infraLevel === 'Medium' ? '#F57F17' : '#2E7D32'
                            }}>
                              {region.infraLevel}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              background: parseInt(region.povertyRate) > 40 ? '#FFEBEE' :
                                        parseInt(region.povertyRate) > 25 ? '#FFF3E0' : '#E8F5E9',
                              color: parseInt(region.povertyRate) > 40 ? '#C62828' :
                                    parseInt(region.povertyRate) > 25 ? '#E65100' : '#2E7D32'
                            }}>
                              {region.povertyRate}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <span style={{
                              background: parseFloat(region.exposureScore) > 5 ? '#E3F2FD' : '#E8F5E9',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              color: parseFloat(region.exposureScore) > 5 ? '#1565C0' : '#2E7D32'
                            }}>
                              {region.exposureScore}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <span style={{
                              background: parseFloat(region.vulnerabilityScore) > 5 ? '#FFF3E0' : '#E8F5E9',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              color: parseFloat(region.vulnerabilityScore) > 5 ? '#E65100' : '#2E7D32'
                            }}>
                              {region.vulnerabilityScore}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Layer Contribution Analysis - Visual breakdown of how each layer affects the score */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #E0E0E0' }}>
              <h5 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '14px' }}>
                📊 Layer Contribution Analysis
              </h5>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {/* Baseline Risk Contribution */}
                <div style={{
                  background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #4CAF50'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1B5E20' }}>Baseline Risk</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1B5E20' }}>
                      {calculatedImpact.baselineRisk}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#C8E6C9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(parseFloat(calculatedImpact.baselineRisk) / 10) * 100}%`,
                      height: '100%',
                      background: '#4CAF50',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#388E3C', marginTop: '6px' }}>
                    {selectedBaselineRisks.length} layer{selectedBaselineRisks.length !== 1 ? 's' : ''} selected
                  </div>
                </div>

                {/* Hazard Contribution */}
                <div style={{
                  background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #F44336'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#B71C1C' }}>Hazard Intensity</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#B71C1C' }}>
                      {calculatedImpact.hazardIntensity}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#FFCDD2', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(parseFloat(calculatedImpact.hazardIntensity) / 10) * 100}%`,
                      height: '100%',
                      background: '#F44336',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#C62828', marginTop: '6px' }}>
                    {selectedHazardIds.length > 0 ? `${selectedHazardIds.length} alert(s)` : 'Manual slider'}
                  </div>
                </div>

                {/* Exposure Contribution */}
                <div style={{
                  background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #2196F3'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0D47A1' }}>Exposure</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0D47A1' }}>
                      {calculatedImpact.avgExposure}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#BBDEFB', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(parseFloat(calculatedImpact.avgExposure) / 10) * 100}%`,
                      height: '100%',
                      background: '#2196F3',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#1565C0', marginTop: '6px' }}>
                    {selectedExposureLayers.length} layer{selectedExposureLayers.length !== 1 ? 's' : ''} selected
                  </div>
                </div>

                {/* Vulnerability Contribution */}
                <div style={{
                  background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #FF9800'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#E65100' }}>Vulnerability</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#E65100' }}>
                      {calculatedImpact.avgVulnerability}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#FFE0B2', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(parseFloat(calculatedImpact.avgVulnerability) / 10) * 100}%`,
                      height: '100%',
                      background: '#FF9800',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#EF6C00', marginTop: '6px' }}>
                    {selectedVulnerabilityLayers.length} layer{selectedVulnerabilityLayers.length !== 1 ? 's' : ''} selected
                  </div>
                </div>

                {/* Coping Capacity Contribution */}
                <div style={{
                  background: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #9C27B0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6A1B9A' }}>Lack of Coping</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#6A1B9A' }}>
                      {calculatedImpact.lackOfCoping}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#E1BEE7', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(parseFloat(calculatedImpact.lackOfCoping) / 10) * 100}%`,
                      height: '100%',
                      background: '#9C27B0',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#7B1FA2', marginTop: '6px' }}>
                    {selectedCopingLayers.length > 0
                      ? `${selectedCopingLayers.length} resources reduce LCC`
                      : 'No coping resources'}
                  </div>
                </div>
              </div>

              {/* Key Insight Box */}
              <div style={{
                marginTop: '16px',
                padding: '14px 18px',
                background: '#FAFAFA',
                borderRadius: '10px',
                border: '1px solid #E0E0E0',
                fontSize: '13px',
                color: '#424242'
              }}>
                <strong style={{ color: '#1976D2' }}>Key Insight:</strong>
                {parseFloat(calculatedImpact.avgVulnerability) > parseFloat(calculatedImpact.avgExposure) ? (
                  <span> Vulnerability ({calculatedImpact.avgVulnerability}) is higher than Exposure ({calculatedImpact.avgExposure}).
                    Consider prioritizing vulnerability reduction programs in the selected regions.</span>
                ) : parseFloat(calculatedImpact.avgExposure) > parseFloat(calculatedImpact.avgVulnerability) ? (
                  <span> Exposure ({calculatedImpact.avgExposure}) is higher than Vulnerability ({calculatedImpact.avgVulnerability}).
                    Focus on reducing population and asset exposure to hazards.</span>
                ) : (
                  <span> Exposure and Vulnerability are balanced. A comprehensive risk reduction approach is recommended.</span>
                )}
                {selectedCopingLayers.length === 0 && (
                  <span style={{ color: '#F44336', display: 'block', marginTop: '6px' }}>
                    <strong>Note:</strong> No coping capacity resources selected. Adding resources will reduce the overall risk score.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Regions Selected Message */}
        {(!calculatedImpact || selectedRegions.length === 0) && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            border: '2px dashed rgba(255,255,255,0.3)'
          }}>
            <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
              🎯 Select regions above to calculate expected impact
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layer2RiskAnalysis;
