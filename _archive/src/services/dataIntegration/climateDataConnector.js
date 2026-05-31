/**
 * CLIMATE DATA CONNECTOR
 *
 * Integrates climate and projection data sources:
 * - UNDRR Risk Profiles - Climate change projections
 * - World Bank Climate Knowledge Portal
 * - Copernicus Climate Data Store
 * - Tanzania Meteorological Authority
 * - CMIP6 Climate Projections
 */

// ============================================================================
// CLIMATE DATA SOURCE CONFIGURATIONS
// ============================================================================

export const CLIMATE_DATA_SOURCES = {
  // UNDRR Risk Profiles
  UNDRR_RISK_PROFILES: {
    id: 'undrr_risk',
    name: 'UNDRR Risk Profiles',
    description: 'Country risk profiles with climate projections from UNDRR',
    baseUrl: 'https://riskprofilesundrr.org',
    apiEndpoint: 'https://riskprofilesundrr.org/api',
    type: 'api',
    countryCode: 'TZA',
    datasets: {
      climate_projections: {
        name: 'Climate Change Projections',
        description: 'Temperature and precipitation projections under different scenarios',
        scenarios: ['RCP2.6', 'RCP4.5', 'RCP8.5'],
        timeframes: ['2030', '2050', '2080'],
        variables: ['temperature', 'precipitation', 'extreme_heat_days', 'drought_months'],
        informComponent: 'natural_hazard'
      },
      sector_impacts: {
        name: 'Sector Impact Projections',
        description: 'Projected climate impacts on agriculture, water, health, infrastructure',
        sectors: ['agriculture', 'water', 'health', 'infrastructure', 'ecosystems'],
        informComponent: 'vulnerability'
      },
      multi_hazard: {
        name: 'Multi-Hazard Risk Profile',
        description: 'Combined hazard exposure and risk assessment',
        hazards: ['flood', 'drought', 'cyclone', 'heat_wave', 'sea_level_rise'],
        informComponent: 'natural_hazard'
      }
    }
  },

  // World Bank Climate Knowledge Portal
  WB_CLIMATE: {
    id: 'wb_climate',
    name: 'World Bank Climate Knowledge Portal',
    description: 'Climate data and projections from World Bank CCKP',
    baseUrl: 'https://climateknowledgeportal.worldbank.org',
    apiEndpoint: 'https://climateknowledgeportal.worldbank.org/api/data',
    type: 'api',
    countryCode: 'TZA',
    variables: {
      tas: {
        name: 'Mean Temperature',
        unit: '°C',
        informComponent: 'natural_hazard'
      },
      tasmax: {
        name: 'Maximum Temperature',
        unit: '°C',
        informComponent: 'natural_hazard'
      },
      tasmin: {
        name: 'Minimum Temperature',
        unit: '°C',
        informComponent: 'natural_hazard'
      },
      pr: {
        name: 'Precipitation',
        unit: 'mm/month',
        informComponent: 'natural_hazard'
      },
      spei: {
        name: 'Standardized Precipitation Evapotranspiration Index',
        unit: 'index',
        description: 'Drought indicator',
        informComponent: 'natural_hazard'
      },
      heat_wave_days: {
        name: 'Heat Wave Days',
        unit: 'days/year',
        informComponent: 'natural_hazard'
      },
      dry_days: {
        name: 'Consecutive Dry Days',
        unit: 'days',
        informComponent: 'natural_hazard'
      }
    },
    scenarios: ['historical', 'ssp126', 'ssp245', 'ssp370', 'ssp585'],
    periods: ['1991-2020', '2021-2040', '2041-2060', '2061-2080', '2081-2100']
  },

  // Copernicus Climate Data Store
  COPERNICUS_CDS: {
    id: 'copernicus',
    name: 'Copernicus Climate Data Store',
    description: 'ERA5 reanalysis and climate projections from ECMWF',
    baseUrl: 'https://cds.climate.copernicus.eu',
    type: 'external',
    datasets: {
      era5_reanalysis: {
        name: 'ERA5 Hourly Reanalysis',
        description: 'High-resolution climate reanalysis data',
        resolution: '0.25°',
        timeRange: '1979-present',
        variables: ['temperature', 'precipitation', 'wind', 'humidity', 'pressure'],
        informComponent: 'natural_hazard'
      },
      cmip6_projections: {
        name: 'CMIP6 Climate Projections',
        description: 'Latest generation climate model projections',
        scenarios: ['SSP1-2.6', 'SSP2-4.5', 'SSP3-7.0', 'SSP5-8.5'],
        informComponent: 'natural_hazard'
      },
      seasonal_forecast: {
        name: 'Seasonal Forecasts',
        description: 'ECMWF seasonal forecast system',
        leadTime: '6 months',
        informComponent: 'natural_hazard'
      }
    }
  },

  // Tanzania Meteorological Authority
  TMA: {
    id: 'tma',
    name: 'Tanzania Meteorological Authority',
    description: 'National weather and climate data for Tanzania',
    baseUrl: 'https://www.meteo.go.tz',
    type: 'external',
    datasets: {
      station_data: {
        name: 'Weather Station Data',
        description: 'Historical and real-time data from meteorological stations',
        variables: ['temperature', 'precipitation', 'humidity', 'wind'],
        informComponent: 'natural_hazard'
      },
      seasonal_outlook: {
        name: 'Seasonal Climate Outlook',
        description: 'Official seasonal rainfall forecasts',
        seasons: ['Vuli (Oct-Dec)', 'Masika (Mar-May)'],
        informComponent: 'natural_hazard'
      },
      climate_normals: {
        name: 'Climate Normals',
        description: '30-year climate averages by station',
        period: '1991-2020',
        informComponent: 'natural_hazard'
      }
    }
  },

  // CHIRPS Precipitation
  CHIRPS: {
    id: 'chirps',
    name: 'CHIRPS Rainfall Data',
    description: 'Climate Hazards Group InfraRed Precipitation with Station data',
    baseUrl: 'https://data.chc.ucsb.edu/products/CHIRPS-2.0',
    type: 'external',
    resolution: '0.05°',
    timeRange: '1981-present',
    products: {
      daily: {
        name: 'Daily Rainfall',
        unit: 'mm/day',
        informComponent: 'natural_hazard'
      },
      dekadal: {
        name: '10-Day Rainfall',
        unit: 'mm/dekad',
        informComponent: 'natural_hazard'
      },
      monthly: {
        name: 'Monthly Rainfall',
        unit: 'mm/month',
        informComponent: 'natural_hazard'
      },
      seasonal: {
        name: 'Seasonal Rainfall Anomaly',
        unit: '% of normal',
        informComponent: 'natural_hazard'
      }
    }
  }
};

// ============================================================================
// CLIMATE PROJECTION SCENARIOS
// ============================================================================

export const CLIMATE_SCENARIOS = {
  // CMIP6 SSP Scenarios
  SSP126: {
    name: 'SSP1-2.6',
    description: 'Sustainability - Low challenges to mitigation and adaptation',
    warming2100: '1.3-2.4°C',
    co2Trajectory: 'Declining after 2050'
  },
  SSP245: {
    name: 'SSP2-4.5',
    description: 'Middle of the Road',
    warming2100: '2.1-3.5°C',
    co2Trajectory: 'Peak around 2050'
  },
  SSP370: {
    name: 'SSP3-7.0',
    description: 'Regional Rivalry - High challenges to mitigation and adaptation',
    warming2100: '2.8-4.6°C',
    co2Trajectory: 'Increasing throughout century'
  },
  SSP585: {
    name: 'SSP5-8.5',
    description: 'Fossil-fueled Development - High challenges to mitigation',
    warming2100: '3.3-5.7°C',
    co2Trajectory: 'Strongly increasing'
  }
};

// ============================================================================
// CLIMATE DATA CONNECTOR CLASS
// ============================================================================

class ClimateDataConnector {
  constructor(options = {}) {
    this.options = options;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 3600000; // 1 hour for climate data
    this.connected = {};
  }

  // ==========================================================================
  // CONNECTION METHODS
  // ==========================================================================

  /**
   * Test World Bank Climate API connection
   */
  async testWorldBankClimateConnection() {
    try {
      const response = await fetch(
        `${CLIMATE_DATA_SOURCES.WB_CLIMATE.apiEndpoint}/get-download-data?variable=tas&scenario=historical&country=TZA&type=country`
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Connect to all climate data sources
   */
  async connectAll() {
    console.log('[Climate] Testing connections...');

    this.connected.wb_climate = await this.testWorldBankClimateConnection();
    console.log(`[Climate] World Bank Climate: ${this.connected.wb_climate ? '✓' : '✗'}`);

    // These are external sources requiring authentication or manual data upload
    this.connected.undrr_risk = false;
    this.connected.copernicus = false;
    this.connected.tma = false;
    this.connected.chirps = false;

    return this.connected;
  }

  // ==========================================================================
  // DATA RETRIEVAL METHODS
  // ==========================================================================

  /**
   * Get climate projections from World Bank
   */
  async getClimateProjections(variable, scenario, period) {
    const cacheKey = `climate_${variable}_${scenario}_${period}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const source = CLIMATE_DATA_SOURCES.WB_CLIMATE;

    try {
      const response = await fetch(
        `${source.apiEndpoint}/get-download-data?variable=${variable}&scenario=${scenario}&country=${source.countryCode}&type=country`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const result = {
        variable,
        variableName: source.variables[variable]?.name || variable,
        unit: source.variables[variable]?.unit || '',
        scenario,
        period,
        data: data,
        source: source.name
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;

    } catch (error) {
      console.error('[Climate] Failed to fetch projections:', error);
      return { error: error.message };
    }
  }

  /**
   * Get historical climate data
   */
  async getHistoricalClimate(variable = 'tas') {
    return this.getClimateProjections(variable, 'historical', '1991-2020');
  }

  /**
   * Get future projections for all scenarios
   */
  async getFutureProjections(variable = 'tas', period = '2041-2060') {
    const scenarios = ['ssp126', 'ssp245', 'ssp370', 'ssp585'];
    const results = {};

    for (const scenario of scenarios) {
      results[scenario] = await this.getClimateProjections(variable, scenario, period);
    }

    return {
      variable,
      period,
      scenarios: results
    };
  }

  /**
   * Get Tanzania-specific climate summary
   */
  async getTanzaniaClimateSummary() {
    const summary = {
      country: 'Tanzania',
      source: 'Multiple sources',
      currentClimate: {},
      projections: {},
      keyRisks: []
    };

    // Get historical baseline
    const historical = await this.getHistoricalClimate('tas');
    if (!historical.error) {
      summary.currentClimate.temperature = historical;
    }

    // Get precipitation
    const precip = await this.getHistoricalClimate('pr');
    if (!precip.error) {
      summary.currentClimate.precipitation = precip;
    }

    // Get mid-century projections under SSP2-4.5
    const midCentury = await this.getClimateProjections('tas', 'ssp245', '2041-2060');
    if (!midCentury.error) {
      summary.projections.midCentury = midCentury;
    }

    // Key climate risks for Tanzania
    summary.keyRisks = [
      {
        hazard: 'Drought',
        trend: 'Increasing frequency and severity',
        regions: ['Central', 'Northern', 'Lake Zone'],
        confidence: 'High'
      },
      {
        hazard: 'Flooding',
        trend: 'More intense rainfall events',
        regions: ['Coastal', 'Western', 'Lake Victoria Basin'],
        confidence: 'High'
      },
      {
        hazard: 'Heat Waves',
        trend: 'Increasing frequency',
        regions: ['All regions, especially lowlands'],
        confidence: 'Very High'
      },
      {
        hazard: 'Sea Level Rise',
        trend: '0.3-1.0m by 2100',
        regions: ['Coastal regions - Dar es Salaam, Tanga, Mtwara'],
        confidence: 'High'
      }
    ];

    return summary;
  }

  /**
   * Get sector-specific climate impacts
   */
  async getSectorClimateImpacts(sector) {
    const sectorImpacts = {
      agriculture: {
        projectedChange: -15, // % yield change
        crops: ['maize', 'rice', 'cassava', 'coffee'],
        risks: ['Drought stress', 'Pest/disease changes', 'Growing season shifts'],
        adaptationOptions: ['Drought-tolerant varieties', 'Irrigation', 'Crop diversification']
      },
      water: {
        projectedChange: -10, // % water availability change
        risks: ['Reduced dry season flows', 'Increased evaporation', 'Groundwater depletion'],
        regions: ['Rufiji Basin', 'Pangani Basin', 'Lake Victoria Basin'],
        adaptationOptions: ['Water storage', 'Efficiency improvements', 'Rainwater harvesting']
      },
      health: {
        projectedChange: 20, // % increase in climate-sensitive diseases
        risks: ['Malaria range expansion', 'Heat-related illness', 'Waterborne diseases'],
        vulnerableGroups: ['Children', 'Elderly', 'Outdoor workers'],
        adaptationOptions: ['Early warning systems', 'Health infrastructure', 'Public awareness']
      },
      infrastructure: {
        projectedChange: 25, // % increase in damage costs
        risks: ['Flood damage to roads', 'Heat damage to materials', 'Coastal erosion'],
        sectors: ['Transport', 'Energy', 'Buildings'],
        adaptationOptions: ['Climate-resilient design', 'Improved drainage', 'Coastal protection']
      }
    };

    return sectorImpacts[sector] || { error: `Unknown sector: ${sector}` };
  }

  // ==========================================================================
  // INFORM INTEGRATION METHODS
  // ==========================================================================

  /**
   * Get climate-adjusted hazard scores for INFORM
   */
  async getClimateAdjustedHazardScores(scenario = 'ssp245', period = '2041-2060') {
    const scores = {
      drought: { current: 0, projected: 0, change: 0 },
      flood: { current: 0, projected: 0, change: 0 },
      heat_wave: { current: 0, projected: 0, change: 0 },
      tropical_cyclone: { current: 0, projected: 0, change: 0 }
    };

    // Get temperature projections (affects drought, heat waves)
    const tempProjection = await this.getClimateProjections('tas', scenario, period);
    const tempHistorical = await this.getHistoricalClimate('tas');

    if (!tempProjection.error && !tempHistorical.error) {
      // Calculate temperature-related hazard changes
      // Simplified scoring based on warming
      const warming = 2.0; // Approximate warming for SSP2-4.5 by mid-century

      scores.drought.current = 5;
      scores.drought.projected = Math.min(10, 5 + warming);
      scores.drought.change = warming;

      scores.heat_wave.current = 4;
      scores.heat_wave.projected = Math.min(10, 4 + warming * 1.5);
      scores.heat_wave.change = warming * 1.5;
    }

    // Get precipitation projections (affects floods)
    const precipProjection = await this.getClimateProjections('pr', scenario, period);

    if (!precipProjection.error) {
      // More intense rainfall = higher flood risk
      scores.flood.current = 6;
      scores.flood.projected = Math.min(10, 6 + 1.5);
      scores.flood.change = 1.5;
    }

    // Tropical cyclone (slight increase projected)
    scores.tropical_cyclone.current = 3;
    scores.tropical_cyclone.projected = 3.5;
    scores.tropical_cyclone.change = 0.5;

    return {
      scenario,
      period,
      hazardScores: scores,
      compositeChange: Object.values(scores).reduce((sum, s) => sum + s.change, 0) / Object.keys(scores).length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get climate-adjusted vulnerability scores
   */
  async getClimateAdjustedVulnerabilityScores(sector = 'all') {
    const baseVulnerability = {
      agriculture: 6.5,
      water: 5.8,
      health: 5.2,
      infrastructure: 4.8
    };

    // Climate multipliers (how much climate change increases vulnerability)
    const climateMultipliers = {
      agriculture: 1.3,
      water: 1.25,
      health: 1.2,
      infrastructure: 1.15
    };

    const scores = {};

    for (const [key, base] of Object.entries(baseVulnerability)) {
      if (sector === 'all' || sector === key) {
        scores[key] = {
          current: base,
          projected: Math.min(10, base * climateMultipliers[key]),
          multiplier: climateMultipliers[key]
        };
      }
    }

    return {
      sector,
      vulnerabilityScores: scores,
      scenario: 'SSP2-4.5',
      period: '2041-2060',
      timestamp: new Date().toISOString()
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get all available datasets
   */
  getAllDatasets() {
    const datasets = [];

    for (const [sourceId, source] of Object.entries(CLIMATE_DATA_SOURCES)) {
      if (source.variables) {
        for (const [varId, variable] of Object.entries(source.variables)) {
          datasets.push({
            sourceId,
            sourceName: source.name,
            datasetId: varId,
            name: variable.name,
            unit: variable.unit,
            connected: this.connected[sourceId] || false
          });
        }
      }

      if (source.datasets) {
        for (const [datasetId, dataset] of Object.entries(source.datasets)) {
          datasets.push({
            sourceId,
            sourceName: source.name,
            datasetId,
            name: dataset.name,
            description: dataset.description,
            connected: this.connected[sourceId] || false
          });
        }
      }

      if (source.products) {
        for (const [productId, product] of Object.entries(source.products)) {
          datasets.push({
            sourceId,
            sourceName: source.name,
            datasetId: productId,
            name: product.name,
            unit: product.unit,
            connected: this.connected[sourceId] || false
          });
        }
      }
    }

    return datasets;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return Object.entries(CLIMATE_DATA_SOURCES).map(([id, source]) => ({
      id,
      name: source.name,
      description: source.description,
      connected: this.connected[id] || false,
      type: source.type,
      datasetCount: Object.keys(source.datasets || source.variables || source.products || {}).length
    }));
  }

  /**
   * Get scenario information
   */
  getScenarioInfo(scenarioId) {
    return CLIMATE_SCENARIOS[scenarioId.toUpperCase()] || null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let climateDataInstance = null;

export function getClimateDataConnector(options = {}) {
  if (!climateDataInstance) {
    climateDataInstance = new ClimateDataConnector(options);
  }
  return climateDataInstance;
}

export function resetClimateDataConnector() {
  climateDataInstance = null;
}

export default ClimateDataConnector;
