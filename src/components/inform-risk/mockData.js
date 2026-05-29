/**
 * Mock INFORM Risk Data
 * Based on actual Tanzania Country Model Template structure
 * This will be replaced with real Excel parsing
 */

// Overall risk (standalone option)
export const OVERALL_RISK = { id: 'overall', name: 'Overall Risk', icon: '⚠️', description: 'Combined INFORM Risk Index' };

// Hazard types for dropdown selection (specific hazards only)
export const HAZARD_TYPES = [
  { id: 'heavyRainfall', name: 'Heavy Rainfall', icon: '🌧️', description: 'Intense precipitation events' },
  { id: 'riverineFlood', name: 'Riverine Floods', icon: '🌊', description: 'River overflow and basin flooding' },
  { id: 'flashFlood', name: 'Flash Floods', icon: '💧', description: 'Sudden urban and localized flooding' },
  { id: 'drought', name: 'Drought', icon: '☀️', description: 'Agricultural and meteorological drought' },
  { id: 'largeWaves', name: 'Large Waves', icon: '🌊', description: 'Coastal wave hazards and storm surge' },
  { id: 'strongWinds', name: 'Strong Winds', icon: '💨', description: 'High wind events and gusts' },
  { id: 'cyclone', name: 'Tropical Cyclone', icon: '🌀', description: 'Cyclones and tropical storms' },
  { id: 'earthquake', name: 'Earthquake', icon: '🏔️', description: 'Seismic activity' },
  { id: 'landslide', name: 'Landslide', icon: '⛰️', description: 'Land and mudslides' },
  { id: 'wildfire', name: 'Wildfire', icon: '🔥', description: 'Forest and bush fires' },
  { id: 'epidemic', name: 'Epidemic', icon: '🦠', description: 'Disease outbreaks' }
];

export function getMockTanzaniaData() {
  return {
    national: {
      country: 'United Republic of Tanzania',
      iso3: 'TZA',

      // Dimension scores (from Excel template)
      hazardExposure: 2.2,
      vulnerability: 5.5,
      lackCopingCapacity: 5.9,
      risk: 4.2,

      classification: {
        level: 'Medium',
        color: '#FFC107',
        range: '3.5 - 4.9'
      },

      // Detailed dimension breakdowns
      dimensions: {
        hazardExposure: {
          total: 2.2,
          natural: {
            coastalHazards: 0,
            drought: 4.3,
            earthquake: 9.35,
            environmentalDegradation: 4.35,
            flood: 3.9,
            heatwave: null,
            landslide: 5.4,
            lightning: null,
            stormsCyclone: 0,
            volcano: 0,
            wildfire: 4.75,
            zoonoses: null,
            aggregate: 3.544
          },
          human: {
            conflictIntensity: 0,
            conflictRisk: 0.7,
            hazardousMaterial: null,
            internalViolence: 1.35,
            vehicleAccidents: null,
            aggregate: 0.683
          }
        },

        vulnerability: {
          total: 5.5,
          socioEconomic: {
            developmentPoverty: 7.7,
            economicDependency: 3.97,
            habitat: 4.9,
            livelihoods: 10,
            aggregate: 6.64
          },
          vulnerableGroups: {
            displacedPeople: 0,
            healthConditions: 4.53,
            childrenHealthNutrition: 7.5,
            economic: null,
            aggregate: 4.01
          }
        },

        lackCopingCapacity: {
          total: 5.9,
          infrastructure: {
            accessHealth: 3.96,
            economicCapacity: 9.87,
            wash: 7.0,
            communication: 4.45,
            education: 6.3,
            aggregate: 6.32
          },
          institutional: {
            drrImplementation: 6.5,
            governance: 4.45,
            aggregate: 5.48
          }
        }
      },

      totalDistricts: 201
    },

    subnational: {
      adm1: {
        // Regional groupings would go here
      },
      adm2: generateMockDistricts()
    },

    metadata: {
      totalUnits: 201,
      lastUpdated: '2024-12-15',
      dataSource: 'Tanzania Country Model Template (Mock Data)'
    }
  };
}

/**
 * Generate mock district data matching Excel structure
 * Now includes hazard-specific risk per district
 */
function generateMockDistricts() {
  // District data with hazard-specific risk profiles
  // Risk values based on geographical and climate characteristics:
  // - Coastal: Higher flood, cyclone
  // - Central/inland: Higher drought
  // - Highland: Higher landslide, earthquake
  // - Urban: Higher infrastructure at risk
  // - Forest areas: Higher wildfire
  const districts = [
    // Dodoma Region - Central, semi-arid (high drought, low flood)
    { region: 'Dodoma', name: 'Kondoa', risk: 4.1, hazards: { heavyRainfall: 3.5, riverineFlood: 2.0, flashFlood: 3.0, drought: 6.8, largeWaves: 0, strongWinds: 3.2, earthquake: 3.2, cyclone: 0.5, landslide: 2.8, wildfire: 4.5, epidemic: 4.2 } },
    { region: 'Dodoma', name: 'Mpwapwa', risk: 4.2, hazards: { heavyRainfall: 3.8, riverineFlood: 2.2, flashFlood: 3.4, drought: 7.2, largeWaves: 0, strongWinds: 3.0, earthquake: 3.0, cyclone: 0.3, landslide: 2.5, wildfire: 4.2, epidemic: 4.5 } },
    { region: 'Dodoma', name: 'Chamwino', risk: 4.3, hazards: { heavyRainfall: 3.6, riverineFlood: 2.1, flashFlood: 3.1, drought: 7.5, largeWaves: 0, strongWinds: 2.8, earthquake: 2.8, cyclone: 0.4, landslide: 2.2, wildfire: 4.0, epidemic: 4.8 } },
    { region: 'Dodoma', name: 'Bahi', risk: 4.4, hazards: { heavyRainfall: 4.2, riverineFlood: 2.8, flashFlood: 3.6, drought: 7.8, largeWaves: 0, strongWinds: 2.5, earthquake: 2.5, cyclone: 0.2, landslide: 1.8, wildfire: 3.8, epidemic: 5.0 } },
    { region: 'Dodoma', name: 'Dodoma Urban', risk: 3.8, hazards: { heavyRainfall: 4.5, riverineFlood: 2.5, flashFlood: 4.5, drought: 5.5, largeWaves: 0, strongWinds: 3.5, earthquake: 4.2, cyclone: 0.5, landslide: 1.5, wildfire: 2.0, epidemic: 4.0 } },

    // Arusha Region - Highland, volcanic (high earthquake, landslide)
    { region: 'Arusha', name: 'Arusha City', risk: 3.8, hazards: { heavyRainfall: 4.0, riverineFlood: 2.5, flashFlood: 3.5, drought: 3.5, largeWaves: 0, strongWinds: 4.5, earthquake: 6.5, cyclone: 0.8, landslide: 4.5, wildfire: 2.5, epidemic: 3.5 } },
    { region: 'Arusha', name: 'Karatu', risk: 4.0, hazards: { heavyRainfall: 4.5, riverineFlood: 3.0, flashFlood: 4.0, drought: 4.2, largeWaves: 0, strongWinds: 4.0, earthquake: 5.8, cyclone: 0.5, landslide: 5.5, wildfire: 4.0, epidemic: 3.8 } },
    { region: 'Arusha', name: 'Longido', risk: 4.5, hazards: { heavyRainfall: 2.5, riverineFlood: 1.5, flashFlood: 2.5, drought: 7.5, largeWaves: 0, strongWinds: 5.0, earthquake: 5.2, cyclone: 0.3, landslide: 3.0, wildfire: 5.5, epidemic: 4.5 } },
    { region: 'Arusha', name: 'Monduli', risk: 4.2, hazards: { heavyRainfall: 3.5, riverineFlood: 2.0, flashFlood: 3.0, drought: 6.8, largeWaves: 0, strongWinds: 4.8, earthquake: 5.5, cyclone: 0.4, landslide: 4.0, wildfire: 5.0, epidemic: 4.0 } },
    { region: 'Arusha', name: 'Ngorongoro', risk: 4.3, hazards: { heavyRainfall: 3.8, riverineFlood: 2.3, flashFlood: 3.3, drought: 5.5, largeWaves: 0, strongWinds: 4.2, earthquake: 6.0, cyclone: 0.2, landslide: 5.8, wildfire: 4.5, epidemic: 3.5 } },

    // Kilimanjaro Region - Highland, volcanic (very high earthquake, landslide)
    { region: 'Kilimanjaro', name: 'Moshi Urban', risk: 3.5, hazards: { heavyRainfall: 5.0, riverineFlood: 3.5, flashFlood: 4.5, drought: 2.5, largeWaves: 0, strongWinds: 3.5, earthquake: 7.5, cyclone: 0.5, landslide: 5.0, wildfire: 2.0, epidemic: 3.0 } },
    { region: 'Kilimanjaro', name: 'Moshi Rural', risk: 3.9, hazards: { heavyRainfall: 5.5, riverineFlood: 4.0, flashFlood: 5.0, drought: 3.0, largeWaves: 0, strongWinds: 3.8, earthquake: 7.2, cyclone: 0.6, landslide: 6.5, wildfire: 3.5, epidemic: 3.2 } },
    { region: 'Kilimanjaro', name: 'Hai', risk: 3.7, hazards: { heavyRainfall: 5.2, riverineFlood: 3.7, flashFlood: 4.7, drought: 2.8, largeWaves: 0, strongWinds: 3.6, earthquake: 7.0, cyclone: 0.4, landslide: 6.0, wildfire: 3.0, epidemic: 3.0 } },
    { region: 'Kilimanjaro', name: 'Rombo', risk: 4.0, hazards: { heavyRainfall: 4.8, riverineFlood: 3.3, flashFlood: 4.3, drought: 3.5, largeWaves: 0, strongWinds: 4.0, earthquake: 7.8, cyclone: 0.3, landslide: 7.0, wildfire: 3.2, epidemic: 3.5 } },
    { region: 'Kilimanjaro', name: 'Same', risk: 4.2, hazards: { heavyRainfall: 5.8, riverineFlood: 4.3, flashFlood: 5.3, drought: 4.5, largeWaves: 0, strongWinds: 4.2, earthquake: 6.5, cyclone: 0.5, landslide: 5.5, wildfire: 4.0, epidemic: 4.0 } },

    // Tanga Region - Coastal (high flood, cyclone, large waves)
    { region: 'Tanga', name: 'Tanga City', risk: 4.1, hazards: { heavyRainfall: 7.0, riverineFlood: 5.5, flashFlood: 7.5, drought: 3.0, largeWaves: 6.5, strongWinds: 6.0, earthquake: 3.5, cyclone: 5.5, landslide: 2.5, wildfire: 1.5, epidemic: 4.5 } },
    { region: 'Tanga', name: 'Muheza', risk: 4.4, hazards: { heavyRainfall: 7.5, riverineFlood: 6.0, flashFlood: 8.0, drought: 2.5, largeWaves: 4.5, strongWinds: 5.5, earthquake: 3.0, cyclone: 4.5, landslide: 4.0, wildfire: 3.0, epidemic: 5.0 } },
    { region: 'Tanga', name: 'Korogwe', risk: 4.3, hazards: { heavyRainfall: 7.3, riverineFlood: 5.8, flashFlood: 7.8, drought: 3.5, largeWaves: 3.0, strongWinds: 5.0, earthquake: 3.2, cyclone: 3.5, landslide: 4.5, wildfire: 3.5, epidemic: 4.8 } },
    { region: 'Tanga', name: 'Lushoto', risk: 4.5, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 3.0, largeWaves: 0, strongWinds: 5.5, earthquake: 4.0, cyclone: 2.5, landslide: 7.5, wildfire: 4.0, epidemic: 4.5 } },
    { region: 'Tanga', name: 'Handeni', risk: 4.6, hazards: { heavyRainfall: 6.0, riverineFlood: 4.0, flashFlood: 6.0, drought: 5.5, largeWaves: 0, strongWinds: 4.5, earthquake: 3.0, cyclone: 2.0, landslide: 3.5, wildfire: 5.0, epidemic: 5.5 } },

    // Morogoro Region - Lowland + mountains (high flood, mixed)
    { region: 'Morogoro', name: 'Morogoro Urban', risk: 4.0, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 3.5, largeWaves: 0, strongWinds: 4.0, earthquake: 3.8, cyclone: 2.5, landslide: 4.0, wildfire: 2.5, epidemic: 4.0 } },
    { region: 'Morogoro', name: 'Morogoro Rural', risk: 4.5, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 4.0, largeWaves: 0, strongWinds: 4.5, earthquake: 3.5, cyclone: 2.0, landslide: 5.5, wildfire: 4.5, epidemic: 4.5 } },
    { region: 'Morogoro', name: 'Kilosa', risk: 4.6, hazards: { heavyRainfall: 8.0, riverineFlood: 6.5, flashFlood: 8.5, drought: 4.5, largeWaves: 0, strongWinds: 4.0, earthquake: 3.0, cyclone: 1.5, landslide: 3.5, wildfire: 5.0, epidemic: 5.5 } },
    { region: 'Morogoro', name: 'Kilombero', risk: 4.8, hazards: { heavyRainfall: 9.0, riverineFlood: 7.5, flashFlood: 9.5, drought: 3.0, largeWaves: 0, strongWinds: 3.5, earthquake: 2.5, cyclone: 1.8, landslide: 2.5, wildfire: 3.5, epidemic: 6.0 } },
    { region: 'Morogoro', name: 'Ulanga', risk: 5.0, hazards: { heavyRainfall: 8.5, riverineFlood: 7.0, flashFlood: 9.0, drought: 3.5, largeWaves: 0, strongWinds: 3.8, earthquake: 2.8, cyclone: 1.5, landslide: 3.0, wildfire: 4.0, epidemic: 6.5 } },

    // Pwani Region - Coastal (high flood, cyclone, large waves)
    { region: 'Pwani', name: 'Kibaha Urban', risk: 3.9, hazards: { heavyRainfall: 7.0, riverineFlood: 5.0, flashFlood: 7.0, drought: 3.0, largeWaves: 5.0, strongWinds: 5.5, earthquake: 3.5, cyclone: 5.0, landslide: 1.5, wildfire: 2.0, epidemic: 4.0 } },
    { region: 'Pwani', name: 'Kibaha Rural', risk: 4.2, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 4.0, largeWaves: 4.0, strongWinds: 5.0, earthquake: 3.2, cyclone: 4.5, landslide: 2.0, wildfire: 3.5, epidemic: 4.5 } },
    { region: 'Pwani', name: 'Bagamoyo', risk: 4.4, hazards: { heavyRainfall: 8.0, riverineFlood: 6.5, flashFlood: 8.5, drought: 3.5, largeWaves: 7.0, strongWinds: 6.5, earthquake: 3.0, cyclone: 6.0, landslide: 1.8, wildfire: 2.5, epidemic: 5.0 } },
    { region: 'Pwani', name: 'Rufiji', risk: 5.2, hazards: { heavyRainfall: 9.5, riverineFlood: 8.0, flashFlood: 10.0, drought: 3.0, largeWaves: 6.0, strongWinds: 6.0, earthquake: 2.5, cyclone: 5.5, landslide: 1.5, wildfire: 3.0, epidemic: 6.0 } },
    { region: 'Pwani', name: 'Mafia', risk: 4.8, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 2.5, largeWaves: 8.5, strongWinds: 7.5, earthquake: 3.0, cyclone: 7.5, landslide: 0.5, wildfire: 1.5, epidemic: 5.0 } },

    // Dar es Salaam Region - Urban coastal (high flood, cyclone, epidemic, large waves)
    { region: 'Dar es Salaam', name: 'Ilala', risk: 3.2, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 1.5, largeWaves: 5.5, strongWinds: 5.5, earthquake: 4.0, cyclone: 5.0, landslide: 1.0, wildfire: 0.5, epidemic: 5.5 } },
    { region: 'Dar es Salaam', name: 'Kinondoni', risk: 3.3, hazards: { heavyRainfall: 7.8, riverineFlood: 5.8, flashFlood: 7.8, drought: 1.5, largeWaves: 5.8, strongWinds: 5.8, earthquake: 4.2, cyclone: 5.2, landslide: 1.2, wildfire: 0.8, epidemic: 5.8 } },
    { region: 'Dar es Salaam', name: 'Temeke', risk: 3.5, hazards: { heavyRainfall: 8.0, riverineFlood: 6.0, flashFlood: 8.0, drought: 1.8, largeWaves: 6.5, strongWinds: 6.0, earthquake: 3.8, cyclone: 5.5, landslide: 0.8, wildfire: 0.5, epidemic: 6.0 } },
    { region: 'Dar es Salaam', name: 'Ubungo', risk: 3.4, hazards: { heavyRainfall: 7.2, riverineFlood: 5.2, flashFlood: 7.2, drought: 1.5, largeWaves: 4.5, strongWinds: 5.2, earthquake: 4.0, cyclone: 4.8, landslide: 1.0, wildfire: 0.5, epidemic: 5.5 } },
    { region: 'Dar es Salaam', name: 'Kigamboni', risk: 3.6, hazards: { heavyRainfall: 8.5, riverineFlood: 6.5, flashFlood: 8.5, drought: 2.0, largeWaves: 7.5, strongWinds: 6.5, earthquake: 3.5, cyclone: 6.0, landslide: 0.5, wildfire: 0.5, epidemic: 5.0 } },

    // Lindi Region - Coastal, remote (high flood, epidemic, large waves)
    { region: 'Lindi', name: 'Lindi Urban', risk: 4.7, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 4.0, largeWaves: 6.0, strongWinds: 5.5, earthquake: 2.8, cyclone: 5.0, landslide: 2.0, wildfire: 3.0, epidemic: 6.5 } },
    { region: 'Lindi', name: 'Lindi Rural', risk: 5.0, hazards: { heavyRainfall: 8.0, riverineFlood: 6.0, flashFlood: 8.0, drought: 5.0, largeWaves: 5.5, strongWinds: 5.0, earthquake: 2.5, cyclone: 4.5, landslide: 2.5, wildfire: 4.5, epidemic: 7.0 } },
    { region: 'Lindi', name: 'Kilwa', risk: 5.2, hazards: { heavyRainfall: 8.5, riverineFlood: 6.5, flashFlood: 8.5, drought: 4.5, largeWaves: 7.0, strongWinds: 6.0, earthquake: 2.5, cyclone: 5.5, landslide: 1.5, wildfire: 4.0, epidemic: 7.5 } },
    { region: 'Lindi', name: 'Nachingwea', risk: 5.0, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 5.5, largeWaves: 0, strongWinds: 4.5, earthquake: 2.8, cyclone: 3.5, landslide: 3.0, wildfire: 5.5, epidemic: 6.5 } },

    // Mtwara Region - Coastal, remote (large waves, cyclone)
    { region: 'Mtwara', name: 'Mtwara Urban', risk: 4.5, hazards: { heavyRainfall: 7.0, riverineFlood: 5.0, flashFlood: 7.0, drought: 4.0, largeWaves: 6.5, strongWinds: 6.0, earthquake: 3.0, cyclone: 5.5, landslide: 1.5, wildfire: 2.5, epidemic: 6.0 } },
    { region: 'Mtwara', name: 'Mtwara Rural', risk: 4.8, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 5.0, largeWaves: 6.0, strongWinds: 5.5, earthquake: 2.8, cyclone: 5.0, landslide: 2.0, wildfire: 4.0, epidemic: 6.5 } },
    { region: 'Mtwara', name: 'Newala', risk: 5.0, hazards: { heavyRainfall: 6.0, riverineFlood: 4.0, flashFlood: 6.0, drought: 6.0, largeWaves: 0, strongWinds: 5.0, earthquake: 2.5, cyclone: 3.5, landslide: 4.0, wildfire: 4.5, epidemic: 6.0 } },
    { region: 'Mtwara', name: 'Masasi', risk: 4.9, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 5.5, largeWaves: 0, strongWinds: 4.8, earthquake: 2.5, cyclone: 3.0, landslide: 3.5, wildfire: 5.0, epidemic: 6.0 } },

    // Mbeya Region - Highland (high earthquake, landslide)
    { region: 'Mbeya', name: 'Mbeya City', risk: 4.0, hazards: { heavyRainfall: 5.5, riverineFlood: 3.5, flashFlood: 5.5, drought: 3.5, largeWaves: 0, strongWinds: 4.0, earthquake: 6.0, cyclone: 0.8, landslide: 5.5, wildfire: 3.0, epidemic: 4.0 } },
    { region: 'Mbeya', name: 'Mbeya Rural', risk: 4.3, hazards: { heavyRainfall: 6.0, riverineFlood: 4.0, flashFlood: 6.0, drought: 4.5, largeWaves: 0, strongWinds: 4.2, earthquake: 5.5, cyclone: 0.5, landslide: 6.0, wildfire: 4.0, epidemic: 4.5 } },
    { region: 'Mbeya', name: 'Rungwe', risk: 4.5, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 2.5, largeWaves: 0, strongWinds: 3.8, earthquake: 7.0, cyclone: 0.3, landslide: 7.5, wildfire: 3.5, epidemic: 4.0 } },
    { region: 'Mbeya', name: 'Kyela', risk: 4.8, hazards: { heavyRainfall: 8.5, riverineFlood: 7.0, flashFlood: 9.0, drought: 2.0, largeWaves: 3.5, strongWinds: 3.5, earthquake: 5.0, cyclone: 0.5, landslide: 4.5, wildfire: 3.0, epidemic: 5.5 } },

    // Iringa Region - Highland
    { region: 'Iringa', name: 'Iringa Urban', risk: 3.8, hazards: { heavyRainfall: 5.0, riverineFlood: 3.0, flashFlood: 5.0, drought: 4.0, largeWaves: 0, strongWinds: 3.5, earthquake: 5.0, cyclone: 0.5, landslide: 4.5, wildfire: 3.5, epidemic: 3.8 } },
    { region: 'Iringa', name: 'Iringa Rural', risk: 4.2, hazards: { heavyRainfall: 5.5, riverineFlood: 3.5, flashFlood: 5.5, drought: 5.0, largeWaves: 0, strongWinds: 3.8, earthquake: 4.5, cyclone: 0.3, landslide: 5.0, wildfire: 5.0, epidemic: 4.2 } },
    { region: 'Iringa', name: 'Kilolo', risk: 4.0, hazards: { heavyRainfall: 6.0, riverineFlood: 4.0, flashFlood: 6.0, drought: 3.5, largeWaves: 0, strongWinds: 4.0, earthquake: 5.5, cyclone: 0.5, landslide: 6.5, wildfire: 4.0, epidemic: 3.5 } },

    // Singida Region - Central, semi-arid (high drought)
    { region: 'Singida', name: 'Singida Urban', risk: 4.0, hazards: { heavyRainfall: 4.0, riverineFlood: 2.0, flashFlood: 4.0, drought: 7.0, largeWaves: 0, strongWinds: 3.5, earthquake: 2.5, cyclone: 0.3, landslide: 1.5, wildfire: 4.0, epidemic: 4.5 } },
    { region: 'Singida', name: 'Singida Rural', risk: 4.5, hazards: { heavyRainfall: 4.5, riverineFlood: 2.5, flashFlood: 4.5, drought: 8.0, largeWaves: 0, strongWinds: 3.8, earthquake: 2.0, cyclone: 0.2, landslide: 1.8, wildfire: 5.0, epidemic: 5.0 } },
    { region: 'Singida', name: 'Manyoni', risk: 4.8, hazards: { heavyRainfall: 3.5, riverineFlood: 1.5, flashFlood: 3.5, drought: 8.5, largeWaves: 0, strongWinds: 4.0, earthquake: 2.0, cyclone: 0.2, landslide: 1.5, wildfire: 5.5, epidemic: 5.5 } },

    // Tabora Region - Central (high drought, wildfire)
    { region: 'Tabora', name: 'Tabora Urban', risk: 4.2, hazards: { heavyRainfall: 4.5, riverineFlood: 2.5, flashFlood: 4.5, drought: 7.0, largeWaves: 0, strongWinds: 3.5, earthquake: 2.0, cyclone: 0.2, landslide: 1.0, wildfire: 5.5, epidemic: 4.5 } },
    { region: 'Tabora', name: 'Uyui', risk: 4.6, hazards: { heavyRainfall: 5.0, riverineFlood: 3.0, flashFlood: 5.0, drought: 7.5, largeWaves: 0, strongWinds: 3.8, earthquake: 1.8, cyclone: 0.2, landslide: 1.2, wildfire: 6.5, epidemic: 5.0 } },
    { region: 'Tabora', name: 'Nzega', risk: 4.4, hazards: { heavyRainfall: 4.8, riverineFlood: 2.8, flashFlood: 4.8, drought: 7.2, largeWaves: 0, strongWinds: 3.6, earthquake: 1.8, cyclone: 0.2, landslide: 1.0, wildfire: 6.0, epidemic: 4.8 } },

    // Kigoma Region - Lake region (high flood)
    { region: 'Kigoma', name: 'Kigoma Urban', risk: 4.3, hazards: { heavyRainfall: 7.5, riverineFlood: 6.0, flashFlood: 8.0, drought: 3.0, largeWaves: 4.5, strongWinds: 4.5, earthquake: 4.5, cyclone: 1.0, landslide: 3.5, wildfire: 3.0, epidemic: 5.0 } },
    { region: 'Kigoma', name: 'Kigoma Rural', risk: 4.6, hazards: { heavyRainfall: 8.0, riverineFlood: 6.5, flashFlood: 8.5, drought: 3.5, largeWaves: 4.0, strongWinds: 4.2, earthquake: 4.0, cyclone: 0.8, landslide: 4.0, wildfire: 4.5, epidemic: 5.5 } },
    { region: 'Kigoma', name: 'Kasulu', risk: 4.8, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 4.0, largeWaves: 0, strongWinds: 4.0, earthquake: 4.2, cyclone: 0.5, landslide: 4.5, wildfire: 5.0, epidemic: 6.5 } },

    // Kagera Region - Lake region (high flood, epidemic)
    { region: 'Kagera', name: 'Bukoba Urban', risk: 4.0, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 2.5, largeWaves: 5.0, strongWinds: 4.5, earthquake: 5.0, cyclone: 1.0, landslide: 4.0, wildfire: 2.5, epidemic: 5.5 } },
    { region: 'Kagera', name: 'Bukoba Rural', risk: 4.4, hazards: { heavyRainfall: 8.0, riverineFlood: 6.0, flashFlood: 8.0, drought: 3.0, largeWaves: 4.5, strongWinds: 4.2, earthquake: 4.5, cyclone: 0.8, landslide: 5.0, wildfire: 3.5, epidemic: 6.0 } },
    { region: 'Kagera', name: 'Muleba', risk: 4.6, hazards: { heavyRainfall: 8.5, riverineFlood: 6.5, flashFlood: 8.5, drought: 3.5, largeWaves: 4.0, strongWinds: 4.0, earthquake: 4.2, cyclone: 0.5, landslide: 5.5, wildfire: 4.0, epidemic: 6.5 } },

    // Mwanza Region - Lake region
    { region: 'Mwanza', name: 'Mwanza City', risk: 3.8, hazards: { heavyRainfall: 7.0, riverineFlood: 5.0, flashFlood: 7.0, drought: 3.5, largeWaves: 5.5, strongWinds: 4.8, earthquake: 4.5, cyclone: 1.0, landslide: 2.5, wildfire: 2.0, epidemic: 5.0 } },
    { region: 'Mwanza', name: 'Sengerema', risk: 4.2, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 4.5, largeWaves: 4.5, strongWinds: 4.5, earthquake: 4.0, cyclone: 0.8, landslide: 3.0, wildfire: 3.5, epidemic: 5.5 } },
    { region: 'Mwanza', name: 'Ukerewe', risk: 4.0, hazards: { heavyRainfall: 8.0, riverineFlood: 6.0, flashFlood: 8.0, drought: 3.0, largeWaves: 6.5, strongWinds: 5.5, earthquake: 3.5, cyclone: 2.0, landslide: 1.0, wildfire: 2.0, epidemic: 5.0 } },

    // Mara Region - Lake region
    { region: 'Mara', name: 'Musoma Urban', risk: 4.0, hazards: { heavyRainfall: 7.0, riverineFlood: 5.0, flashFlood: 7.0, drought: 4.0, largeWaves: 5.0, strongWinds: 4.5, earthquake: 4.0, cyclone: 0.8, landslide: 2.5, wildfire: 3.0, epidemic: 5.0 } },
    { region: 'Mara', name: 'Musoma Rural', risk: 4.3, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 4.5, largeWaves: 4.5, strongWinds: 4.2, earthquake: 3.8, cyclone: 0.5, landslide: 3.0, wildfire: 4.0, epidemic: 5.5 } },
    { region: 'Mara', name: 'Serengeti', risk: 4.5, hazards: { heavyRainfall: 5.0, riverineFlood: 3.0, flashFlood: 5.0, drought: 6.5, largeWaves: 0, strongWinds: 5.0, earthquake: 3.5, cyclone: 0.3, landslide: 2.5, wildfire: 6.0, epidemic: 5.0 } },

    // Shinyanga Region - Central
    { region: 'Shinyanga', name: 'Shinyanga Urban', risk: 4.0, hazards: { heavyRainfall: 5.0, riverineFlood: 3.0, flashFlood: 5.0, drought: 6.5, largeWaves: 0, strongWinds: 3.8, earthquake: 2.5, cyclone: 0.3, landslide: 1.5, wildfire: 4.5, epidemic: 4.5 } },
    { region: 'Shinyanga', name: 'Shinyanga Rural', risk: 4.4, hazards: { heavyRainfall: 5.5, riverineFlood: 3.5, flashFlood: 5.5, drought: 7.0, largeWaves: 0, strongWinds: 4.0, earthquake: 2.2, cyclone: 0.2, landslide: 1.8, wildfire: 5.5, epidemic: 5.0 } },
    { region: 'Shinyanga', name: 'Kahama', risk: 4.3, hazards: { heavyRainfall: 5.2, riverineFlood: 3.2, flashFlood: 5.2, drought: 6.8, largeWaves: 0, strongWinds: 3.9, earthquake: 2.5, cyclone: 0.3, landslide: 2.0, wildfire: 5.0, epidemic: 4.8 } },

    // Geita Region - Lake region
    { region: 'Geita', name: 'Geita', risk: 4.4, hazards: { heavyRainfall: 7.0, riverineFlood: 5.0, flashFlood: 7.0, drought: 5.0, largeWaves: 3.5, strongWinds: 4.2, earthquake: 3.5, cyclone: 0.5, landslide: 3.0, wildfire: 4.5, epidemic: 5.5 } },
    { region: 'Geita', name: 'Chato', risk: 4.6, hazards: { heavyRainfall: 7.5, riverineFlood: 5.5, flashFlood: 7.5, drought: 5.5, largeWaves: 4.0, strongWinds: 4.0, earthquake: 3.2, cyclone: 0.5, landslide: 2.5, wildfire: 5.0, epidemic: 6.0 } },

    // Ruvuma Region - Southern highlands
    { region: 'Ruvuma', name: 'Songea Urban', risk: 4.2, hazards: { heavyRainfall: 6.0, riverineFlood: 4.0, flashFlood: 6.0, drought: 4.0, largeWaves: 0, strongWinds: 4.0, earthquake: 3.5, cyclone: 0.5, landslide: 4.5, wildfire: 4.5, epidemic: 4.5 } },
    { region: 'Ruvuma', name: 'Songea Rural', risk: 4.5, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 5.0, largeWaves: 0, strongWinds: 4.2, earthquake: 3.2, cyclone: 0.3, landslide: 5.0, wildfire: 5.5, epidemic: 5.0 } },
    { region: 'Ruvuma', name: 'Mbinga', risk: 4.8, hazards: { heavyRainfall: 7.0, riverineFlood: 5.0, flashFlood: 7.0, drought: 4.5, largeWaves: 0, strongWinds: 4.5, earthquake: 4.0, cyclone: 0.5, landslide: 6.5, wildfire: 5.0, epidemic: 5.5 } },

    // Njombe Region - Southern highlands (high landslide)
    { region: 'Njombe', name: 'Njombe Urban', risk: 4.0, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 3.0, largeWaves: 0, strongWinds: 4.0, earthquake: 4.5, cyclone: 0.5, landslide: 6.0, wildfire: 3.5, epidemic: 4.0 } },
    { region: 'Njombe', name: 'Njombe Rural', risk: 4.3, hazards: { heavyRainfall: 7.0, riverineFlood: 5.0, flashFlood: 7.0, drought: 3.5, largeWaves: 0, strongWinds: 4.2, earthquake: 4.2, cyclone: 0.3, landslide: 6.5, wildfire: 4.5, epidemic: 4.5 } },
    { region: 'Njombe', name: 'Makete', risk: 4.5, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 3.0, largeWaves: 0, strongWinds: 4.5, earthquake: 5.0, cyclone: 0.3, landslide: 7.5, wildfire: 4.0, epidemic: 4.0 } },

    // Rukwa Region - Rift valley (high earthquake)
    { region: 'Rukwa', name: 'Sumbawanga Urban', risk: 4.2, hazards: { heavyRainfall: 5.5, riverineFlood: 3.5, flashFlood: 5.5, drought: 5.0, largeWaves: 0, strongWinds: 4.5, earthquake: 6.0, cyclone: 0.3, landslide: 4.0, wildfire: 4.5, epidemic: 4.5 } },
    { region: 'Rukwa', name: 'Sumbawanga Rural', risk: 4.6, hazards: { heavyRainfall: 6.0, riverineFlood: 4.0, flashFlood: 6.0, drought: 6.0, largeWaves: 0, strongWinds: 4.8, earthquake: 5.5, cyclone: 0.2, landslide: 4.5, wildfire: 5.5, epidemic: 5.0 } },
    { region: 'Rukwa', name: 'Kalambo', risk: 4.8, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 5.5, largeWaves: 3.5, strongWinds: 5.0, earthquake: 6.5, cyclone: 0.3, landslide: 5.5, wildfire: 5.0, epidemic: 5.5 } },

    // Katavi Region - Remote western
    { region: 'Katavi', name: 'Mpanda', risk: 4.8, hazards: { heavyRainfall: 6.0, riverineFlood: 4.0, flashFlood: 6.0, drought: 6.0, largeWaves: 0, strongWinds: 4.2, earthquake: 4.5, cyclone: 0.2, landslide: 3.0, wildfire: 6.0, epidemic: 6.0 } },
    { region: 'Katavi', name: 'Tanganyika', risk: 5.0, hazards: { heavyRainfall: 7.0, riverineFlood: 5.0, flashFlood: 7.0, drought: 5.5, largeWaves: 4.0, strongWinds: 4.5, earthquake: 5.0, cyclone: 0.3, landslide: 3.5, wildfire: 5.5, epidemic: 6.5 } },

    // Simiyu Region - Lake region
    { region: 'Simiyu', name: 'Bariadi', risk: 4.5, hazards: { heavyRainfall: 6.0, riverineFlood: 4.0, flashFlood: 6.0, drought: 7.0, largeWaves: 0, strongWinds: 4.0, earthquake: 2.5, cyclone: 0.3, landslide: 1.5, wildfire: 5.0, epidemic: 5.5 } },
    { region: 'Simiyu', name: 'Maswa', risk: 4.6, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 7.5, largeWaves: 0, strongWinds: 4.2, earthquake: 2.2, cyclone: 0.2, landslide: 1.8, wildfire: 5.5, epidemic: 5.8 } },

    // Manyara Region - Rift valley
    { region: 'Manyara', name: 'Babati', risk: 4.2, hazards: { heavyRainfall: 5.5, riverineFlood: 3.5, flashFlood: 5.5, drought: 5.5, largeWaves: 0, strongWinds: 4.5, earthquake: 5.5, cyclone: 0.5, landslide: 5.0, wildfire: 4.5, epidemic: 4.0 } },
    { region: 'Manyara', name: 'Hanang', risk: 4.5, hazards: { heavyRainfall: 5.0, riverineFlood: 3.0, flashFlood: 5.0, drought: 6.5, largeWaves: 0, strongWinds: 5.0, earthquake: 5.0, cyclone: 0.3, landslide: 4.5, wildfire: 5.0, epidemic: 4.5 } },
    { region: 'Manyara', name: 'Mbulu', risk: 4.3, hazards: { heavyRainfall: 5.5, riverineFlood: 3.5, flashFlood: 5.5, drought: 5.0, largeWaves: 0, strongWinds: 4.2, earthquake: 5.5, cyclone: 0.3, landslide: 6.0, wildfire: 4.0, epidemic: 4.2 } },

    // Songwe Region - Southern highlands
    { region: 'Songwe', name: 'Tunduma', risk: 4.4, hazards: { heavyRainfall: 6.0, riverineFlood: 4.0, flashFlood: 6.0, drought: 4.5, largeWaves: 0, strongWinds: 4.5, earthquake: 5.0, cyclone: 0.5, landslide: 4.5, wildfire: 4.5, epidemic: 5.0 } },
    { region: 'Songwe', name: 'Momba', risk: 4.7, hazards: { heavyRainfall: 6.5, riverineFlood: 4.5, flashFlood: 6.5, drought: 5.0, largeWaves: 0, strongWinds: 4.8, earthquake: 5.5, cyclone: 0.3, landslide: 5.0, wildfire: 5.0, epidemic: 5.5 } }
  ];

  return districts.map((d, index) => ({
    admin: {
      country: 'United Republic of Tanzania',
      adm1Name: d.region,
      adm2Name: d.name,
      iso3: 'TZA',
      adm1Code: `TZ${String(Math.floor(index / 5) + 1).padStart(2, '0')}`,
      adm2Code: `TZ${String(Math.floor(index / 5) + 1).padStart(2, '0')}${String((index % 5) + 1).padStart(2, '0')}`
    },
    // Aggregate scores
    hazardExposure: {
      total: 2.2 + (Math.random() - 0.5) * 0.8,
      // Individual hazard scores for detailed analysis
      hazards: d.hazards
    },
    vulnerability: { total: 5.5 + (Math.random() - 0.5) * 1.0 },
    lackCopingCapacity: { total: 5.9 + (Math.random() - 0.5) * 0.6 },
    risk: d.risk,
    // Direct access to hazard-specific risks
    hazardRisks: d.hazards
  }));
}
