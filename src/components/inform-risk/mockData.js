/**
 * Mock INFORM Risk Data
 * Based on actual Tanzania Country Model Template structure
 * This will be replaced with real Excel parsing
 */

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
 */
function generateMockDistricts() {
  const regions = [
    'Dodoma', 'Arusha', 'Kilimanjaro', 'Tanga', 'Morogoro',
    'Pwani', 'Dar es Salaam', 'Lindi', 'Mtwara', 'Ruvuma',
    'Iringa', 'Mbeya', 'Singida', 'Tabora', 'Rukwa',
    'Kigoma', 'Shinyanga', 'Kagera', 'Mwanza', 'Mara'
  ];

  const districts = [
    { region: 'Dodoma', name: 'Kondoa', risk: 4.1 },
    { region: 'Dodoma', name: 'Mpwapwa', risk: 4.2 },
    { region: 'Dodoma', name: 'Chamwino', risk: 4.3 },
    { region: 'Arusha', name: 'Arusha City', risk: 3.8 },
    { region: 'Arusha', name: 'Karatu', risk: 4.0 },
    { region: 'Arusha', name: 'Longido', risk: 4.5 },
    { region: 'Kilimanjaro', name: 'Moshi Urban', risk: 3.5 },
    { region: 'Kilimanjaro', name: 'Moshi Rural', risk: 3.9 },
    { region: 'Kilimanjaro', name: 'Hai', risk: 3.7 },
    { region: 'Tanga', name: 'Tanga City', risk: 4.1 },
    { region: 'Tanga', name: 'Muheza', risk: 4.4 },
    { region: 'Tanga', name: 'Korogwe', risk: 4.3 },
    { region: 'Morogoro', name: 'Morogoro Urban', risk: 4.0 },
    { region: 'Morogoro', name: 'Morogoro Rural', risk: 4.5 },
    { region: 'Morogoro', name: 'Kilosa', risk: 4.6 },
    { region: 'Pwani', name: 'Kibaha Urban', risk: 3.9 },
    { region: 'Pwani', name: 'Kibaha Rural', risk: 4.2 },
    { region: 'Pwani', name: 'Bagamoyo', risk: 4.4 },
    { region: 'Dar es Salaam', name: 'Ilala', risk: 3.2 },
    { region: 'Dar es Salaam', name: 'Kinondoni', risk: 3.3 },
    { region: 'Dar es Salaam', name: 'Temeke', risk: 3.5 },
    { region: 'Lindi', name: 'Lindi Urban', risk: 4.7 },
    { region: 'Lindi', name: 'Lindi Rural', risk: 5.0 },
    { region: 'Mtwara', name: 'Mtwara Urban', risk: 4.5 },
    { region: 'Mtwara', name: 'Mtwara Rural', risk: 4.8 }
  ];

  return districts.map((d, index) => ({
    admin: {
      country: 'United Republic of Tanzania',
      adm1Name: d.region,
      adm2Name: d.name,
      iso3: 'TZA',
      adm1Code: `TZ${String(index + 1).padStart(2, '0')}`,
      adm2Code: `TZ${String(index + 1).padStart(2, '0')}01`
    },
    hazardExposure: { total: 2.2 + (Math.random() - 0.5) * 0.8 },
    vulnerability: { total: 5.5 + (Math.random() - 0.5) * 1.0 },
    lackCopingCapacity: { total: 5.9 + (Math.random() - 0.5) * 0.6 },
    risk: d.risk
  }));
}
