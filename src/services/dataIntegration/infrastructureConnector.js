/**
 * INFRASTRUCTURE DATA CONNECTOR
 *
 * Integrates infrastructure data sources:
 * - OpenStreetMap - Roads, rail, ports, airports, critical infrastructure
 * - World Bank Data Catalog - Electricity networks
 * - Tanzania Ministry data - Various infrastructure
 * - GCA (IISD-Zutari) - Infrastructure vulnerability screening
 */

// ============================================================================
// INFRASTRUCTURE DATA SOURCE CONFIGURATIONS
// ============================================================================

export const INFRASTRUCTURE_DATA_SOURCES = {
  // OpenStreetMap via Overpass API
  OPENSTREETMAP: {
    id: 'osm',
    name: 'OpenStreetMap',
    description: 'Crowdsourced geographic data from OpenStreetMap',
    baseUrl: 'https://www.openstreetmap.org',
    overpassEndpoint: 'https://overpass-api.de/api/interpreter',
    nominatimEndpoint: 'https://nominatim.openstreetmap.org',
    type: 'overpass',
    countryCode: 'TZ',
    layers: {
      roads: {
        name: 'Road Network',
        osmTags: ['highway'],
        format: 'shapefile-polyline',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity',
        subTypes: {
          primary: { tag: 'highway=primary', weight: 1.0 },
          secondary: { tag: 'highway=secondary', weight: 0.8 },
          tertiary: { tag: 'highway=tertiary', weight: 0.6 },
          residential: { tag: 'highway=residential', weight: 0.4 },
          unclassified: { tag: 'highway=unclassified', weight: 0.3 },
          track: { tag: 'highway=track', weight: 0.2 }
        }
      },
      rail: {
        name: 'Railway Network',
        osmTags: ['railway=rail'],
        format: 'shapefile-polyline',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      airports: {
        name: 'Airports',
        osmTags: ['aeroway=aerodrome'],
        format: 'shapefile-point',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      ports: {
        name: 'Ports and Harbors',
        osmTags: ['harbour=*', 'landuse=port'],
        format: 'shapefile-point',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      hospitals: {
        name: 'Hospitals',
        osmTags: ['amenity=hospital'],
        format: 'shapefile-point',
        category: 'critical_infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      clinics: {
        name: 'Health Clinics',
        osmTags: ['amenity=clinic', 'amenity=health_post'],
        format: 'shapefile-point',
        category: 'critical_infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      schools: {
        name: 'Schools',
        osmTags: ['amenity=school', 'amenity=university', 'amenity=college'],
        format: 'shapefile-point',
        category: 'critical_infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      police: {
        name: 'Police Stations',
        osmTags: ['amenity=police'],
        format: 'shapefile-point',
        category: 'critical_infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      fire_stations: {
        name: 'Fire Stations',
        osmTags: ['amenity=fire_station'],
        format: 'shapefile-point',
        category: 'critical_infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      water_supply: {
        name: 'Water Supply Points',
        osmTags: ['man_made=water_well', 'amenity=drinking_water', 'man_made=water_tower'],
        format: 'shapefile-point',
        category: 'critical_infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      power_lines: {
        name: 'Power Lines',
        osmTags: ['power=line', 'power=minor_line'],
        format: 'shapefile-polyline',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      power_substations: {
        name: 'Power Substations',
        osmTags: ['power=substation'],
        format: 'shapefile-point',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      telecom_towers: {
        name: 'Telecom Towers',
        osmTags: ['man_made=tower', 'tower:type=communication'],
        format: 'shapefile-point',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      }
    }
  },

  // World Bank Data Catalog
  WORLDBANK: {
    id: 'worldbank',
    name: 'World Bank Data Catalog',
    description: 'Infrastructure data from World Bank open data',
    baseUrl: 'https://datacatalog.worldbank.org',
    apiEndpoint: 'https://api.worldbank.org/v2',
    type: 'api',
    countryCode: 'TZA',
    indicators: {
      electricity_access: {
        name: 'Access to Electricity',
        indicatorId: 'EG.ELC.ACCS.ZS',
        unit: '% of population',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      mobile_subscriptions: {
        name: 'Mobile Phone Subscriptions',
        indicatorId: 'IT.CEL.SETS.P2',
        unit: 'per 100 people',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      internet_users: {
        name: 'Internet Users',
        indicatorId: 'IT.NET.USER.ZS',
        unit: '% of population',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      road_density: {
        name: 'Road Density',
        indicatorId: 'IS.ROD.DNST.K2',
        unit: 'km per 100 sq km',
        category: 'infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      physicians: {
        name: 'Physicians per 1000 people',
        indicatorId: 'SH.MED.PHYS.ZS',
        unit: 'per 1000 people',
        category: 'critical_infrastructure',
        informComponent: 'lack_of_coping_capacity'
      },
      hospital_beds: {
        name: 'Hospital Beds per 1000 people',
        indicatorId: 'SH.MED.BEDS.ZS',
        unit: 'per 1000 people',
        category: 'critical_infrastructure',
        informComponent: 'lack_of_coping_capacity'
      }
    }
  },

  // GCA Infrastructure Vulnerability (IISD-Zutari)
  GCA_VULNERABILITY: {
    id: 'gca',
    name: 'GCA Infrastructure Vulnerability',
    description: 'Global Center on Adaptation infrastructure vulnerability screening',
    baseUrl: 'https://gca.org',
    type: 'external',
    datasets: {
      road_vulnerability: {
        name: 'Road Network Vulnerability Index',
        description: 'Climate vulnerability screening for road networks',
        format: 'shapefile-polyline',
        category: 'vulnerability',
        hazards: ['flood', 'heat', 'precipitation'],
        informComponent: 'vulnerability'
      },
      rail_vulnerability: {
        name: 'Rail Network Vulnerability Index',
        description: 'Climate vulnerability screening for rail networks',
        format: 'shapefile-polyline',
        category: 'vulnerability',
        hazards: ['flood', 'heat', 'landslide'],
        informComponent: 'vulnerability'
      }
    }
  },

  // Tanzania Ministries Data
  TZ_MINISTRIES: {
    id: 'tz_ministries',
    name: 'Tanzania Government Ministries',
    description: 'Official government infrastructure data',
    baseUrl: 'https://www.gov.go.tz',
    type: 'external',
    ministries: {
      works: {
        name: 'Ministry of Works',
        datasets: ['road_network', 'road_conditions', 'bridges']
      },
      energy: {
        name: 'Ministry of Energy',
        datasets: ['electricity_grid', 'power_plants', 'dams']
      },
      infrastructure: {
        name: 'Ministry of Infrastructure',
        datasets: ['airports', 'ports', 'rail_network']
      },
      ict: {
        name: 'Ministry of ICT',
        datasets: ['telecom_coverage', 'fiber_network']
      },
      health: {
        name: 'Ministry of Health',
        datasets: ['hospitals', 'clinics', 'health_centers']
      }
    }
  }
};

// ============================================================================
// OVERPASS QUERY TEMPLATES
// ============================================================================

const OVERPASS_QUERY_TEMPLATES = {
  // Get all features of a type in Tanzania
  countryQuery: (osmTags) => `
    [out:json][timeout:60];
    area["ISO3166-1"="TZ"][admin_level=2]->.searchArea;
    (
      ${osmTags.map(tag => `node[${tag}](area.searchArea);`).join('\n      ')}
      ${osmTags.map(tag => `way[${tag}](area.searchArea);`).join('\n      ')}
    );
    out center;
  `,

  // Get features in a specific region
  regionQuery: (osmTags, regionName) => `
    [out:json][timeout:60];
    area["name"="${regionName}"]["admin_level"~"4|6"]->.searchArea;
    (
      ${osmTags.map(tag => `node[${tag}](area.searchArea);`).join('\n      ')}
      ${osmTags.map(tag => `way[${tag}](area.searchArea);`).join('\n      ')}
    );
    out center;
  `,

  // Get features in a bounding box
  bboxQuery: (osmTags, bbox) => `
    [out:json][timeout:60];
    (
      ${osmTags.map(tag => `node[${tag}](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`).join('\n      ')}
      ${osmTags.map(tag => `way[${tag}](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`).join('\n      ')}
    );
    out center;
  `
};

// ============================================================================
// INFRASTRUCTURE CONNECTOR CLASS
// ============================================================================

class InfrastructureConnector {
  constructor(options = {}) {
    this.options = options;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 600000; // 10 minutes for infrastructure
    this.connected = {};
    this.overpassEndpoint = INFRASTRUCTURE_DATA_SOURCES.OPENSTREETMAP.overpassEndpoint;
    this.worldbankEndpoint = INFRASTRUCTURE_DATA_SOURCES.WORLDBANK.apiEndpoint;
  }

  // ==========================================================================
  // CONNECTION METHODS
  // ==========================================================================

  /**
   * Test connection to OpenStreetMap Overpass API
   */
  async testOverpassConnection() {
    try {
      const testQuery = '[out:json][timeout:5];node(1);out;';
      const response = await fetch(this.overpassEndpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(testQuery)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test connection to World Bank API
   */
  async testWorldBankConnection() {
    try {
      const response = await fetch(`${this.worldbankEndpoint}/country/TZA?format=json`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Connect to all infrastructure sources
   */
  async connectAll() {
    console.log('[Infrastructure] Testing connections...');

    this.connected.osm = await this.testOverpassConnection();
    console.log(`[Infrastructure] OSM Overpass: ${this.connected.osm ? '✓' : '✗'}`);

    this.connected.worldbank = await this.testWorldBankConnection();
    console.log(`[Infrastructure] World Bank: ${this.connected.worldbank ? '✓' : '✗'}`);

    return {
      osm: this.connected.osm,
      worldbank: this.connected.worldbank
    };
  }

  // ==========================================================================
  // DATA RETRIEVAL - OPENSTREETMAP
  // ==========================================================================

  /**
   * Query OSM via Overpass API
   */
  async queryOverpass(query) {
    try {
      const response = await fetch(this.overpassEndpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Infrastructure] Overpass query failed:', error);
      throw error;
    }
  }

  /**
   * Get infrastructure by type for a region
   */
  async getInfrastructure(layerId, regionName = null, bbox = null) {
    const layer = INFRASTRUCTURE_DATA_SOURCES.OPENSTREETMAP.layers[layerId];
    if (!layer) {
      throw new Error(`Unknown infrastructure layer: ${layerId}`);
    }

    const cacheKey = `osm_${layerId}_${regionName || 'bbox'}_${JSON.stringify(bbox)}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    if (!this.connected.osm) {
      return { features: [], error: 'OSM not connected' };
    }

    try {
      let query;
      if (bbox) {
        query = OVERPASS_QUERY_TEMPLATES.bboxQuery(layer.osmTags, bbox);
      } else if (regionName) {
        query = OVERPASS_QUERY_TEMPLATES.regionQuery(layer.osmTags, regionName);
      } else {
        query = OVERPASS_QUERY_TEMPLATES.countryQuery(layer.osmTags);
      }

      const result = await this.queryOverpass(query);

      const features = result.elements.map(element => ({
        type: 'Feature',
        properties: {
          id: element.id,
          type: element.type,
          ...element.tags
        },
        geometry: {
          type: element.type === 'node' ? 'Point' : 'LineString',
          coordinates: element.center
            ? [element.center.lon, element.center.lat]
            : [element.lon, element.lat]
        }
      }));

      const data = {
        layer: layerId,
        layerName: layer.name,
        features,
        count: features.length,
        source: 'OpenStreetMap',
        timestamp: new Date().toISOString()
      };

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;

    } catch (error) {
      console.error(`[Infrastructure] Failed to get ${layerId}:`, error);
      return { features: [], error: error.message };
    }
  }

  /**
   * Get all critical infrastructure for a region
   */
  async getCriticalInfrastructure(regionName) {
    const criticalLayers = ['hospitals', 'clinics', 'schools', 'police', 'fire_stations', 'water_supply'];
    const results = {};

    for (const layerId of criticalLayers) {
      results[layerId] = await this.getInfrastructure(layerId, regionName);
    }

    // Calculate summary statistics
    const summary = {
      totalFacilities: 0,
      byType: {}
    };

    for (const [layerId, data] of Object.entries(results)) {
      summary.byType[layerId] = data.count || 0;
      summary.totalFacilities += data.count || 0;
    }

    return {
      region: regionName,
      infrastructure: results,
      summary
    };
  }

  /**
   * Get road network statistics
   */
  async getRoadNetworkStats(regionName) {
    const roads = await this.getInfrastructure('roads', regionName);

    const stats = {
      totalLength: 0,
      byType: {},
      density: 0
    };

    if (roads.features) {
      for (const feature of roads.features) {
        const roadType = feature.properties.highway || 'unclassified';
        stats.byType[roadType] = (stats.byType[roadType] || 0) + 1;
      }
    }

    return {
      region: regionName,
      roads: roads.count,
      statistics: stats
    };
  }

  // ==========================================================================
  // DATA RETRIEVAL - WORLD BANK
  // ==========================================================================

  /**
   * Get World Bank indicator data
   */
  async getWorldBankIndicator(indicatorId, years = 10) {
    const cacheKey = `wb_${indicatorId}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    if (!this.connected.worldbank) {
      return { value: null, error: 'World Bank API not connected' };
    }

    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(
        `${this.worldbankEndpoint}/country/TZA/indicator/${indicatorId}?format=json&date=${currentYear - years}:${currentYear}`
      );

      if (!response.ok) {
        throw new Error(`World Bank API error: ${response.status}`);
      }

      const result = await response.json();

      // World Bank returns [pagination, data]
      const data = result[1] || [];
      const latestValue = data.find(d => d.value !== null);

      const processedData = {
        indicatorId,
        indicatorName: latestValue?.indicator?.value || indicatorId,
        latestValue: latestValue?.value,
        latestYear: latestValue?.date,
        timeSeries: data.map(d => ({
          year: parseInt(d.date),
          value: d.value
        })).filter(d => d.value !== null).reverse()
      };

      this.cache.set(cacheKey, { data: processedData, timestamp: Date.now() });
      return processedData;

    } catch (error) {
      console.error(`[Infrastructure] World Bank fetch failed:`, error);
      return { value: null, error: error.message };
    }
  }

  /**
   * Get all infrastructure indicators from World Bank
   */
  async getAllWorldBankIndicators() {
    const indicators = INFRASTRUCTURE_DATA_SOURCES.WORLDBANK.indicators;
    const results = {};

    for (const [key, config] of Object.entries(indicators)) {
      results[key] = await this.getWorldBankIndicator(config.indicatorId);
      results[key].name = config.name;
      results[key].unit = config.unit;
    }

    return results;
  }

  // ==========================================================================
  // INFORM INTEGRATION METHODS
  // ==========================================================================

  /**
   * Get INFORM-formatted Lack of Coping Capacity scores
   */
  async getINFORMCopingCapacityScores(regionName) {
    const scores = {
      health_infrastructure: { score: 0, sources: [], confidence: 0 },
      transport_infrastructure: { score: 0, sources: [], confidence: 0 },
      communication_infrastructure: { score: 0, sources: [], confidence: 0 },
      governance: { score: 0, sources: [], confidence: 0 }
    };

    // Get critical infrastructure
    const critical = await this.getCriticalInfrastructure(regionName);

    // Health infrastructure scoring (more facilities = better coping = lower score)
    const healthFacilities = (critical.summary?.byType?.hospitals || 0) +
                            (critical.summary?.byType?.clinics || 0);
    // Inverse relationship: more facilities = lower vulnerability
    scores.health_infrastructure.score = Math.max(0, 10 - Math.min(10, healthFacilities / 10));
    scores.health_infrastructure.sources.push('OpenStreetMap');
    scores.health_infrastructure.confidence = 0.7;

    // Transport infrastructure
    const roadStats = await this.getRoadNetworkStats(regionName);
    const roadCount = roadStats.roads || 0;
    scores.transport_infrastructure.score = Math.max(0, 10 - Math.min(10, roadCount / 100));
    scores.transport_infrastructure.sources.push('OpenStreetMap');
    scores.transport_infrastructure.confidence = 0.6;

    // World Bank indicators
    const wbIndicators = await this.getAllWorldBankIndicators();

    if (wbIndicators.electricity_access?.latestValue) {
      // Higher access = lower vulnerability
      const electricityScore = 10 - (wbIndicators.electricity_access.latestValue / 10);
      scores.communication_infrastructure.score = electricityScore;
      scores.communication_infrastructure.sources.push('World Bank');
      scores.communication_infrastructure.confidence = 0.9;
    }

    if (wbIndicators.physicians?.latestValue) {
      // More physicians = lower vulnerability
      const physiciansScore = 10 - Math.min(10, wbIndicators.physicians.latestValue * 2);
      scores.health_infrastructure.score = (scores.health_infrastructure.score + physiciansScore) / 2;
      scores.health_infrastructure.sources.push('World Bank');
      scores.health_infrastructure.confidence = 0.85;
    }

    // Calculate composite score
    const validScores = Object.values(scores).filter(s => s.score > 0);
    const compositeScore = validScores.length > 0
      ? validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length
      : 5; // Default middle score if no data

    return {
      individual: scores,
      composite: compositeScore,
      region: regionName,
      timestamp: new Date().toISOString()
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get all available layers
   */
  getAllLayers() {
    const layers = [];

    // OSM layers
    const osmLayers = INFRASTRUCTURE_DATA_SOURCES.OPENSTREETMAP.layers;
    for (const [layerId, layer] of Object.entries(osmLayers)) {
      layers.push({
        sourceId: 'osm',
        sourceName: 'OpenStreetMap',
        layerId,
        ...layer,
        connected: this.connected.osm || false
      });
    }

    // World Bank indicators
    const wbIndicators = INFRASTRUCTURE_DATA_SOURCES.WORLDBANK.indicators;
    for (const [indicatorId, indicator] of Object.entries(wbIndicators)) {
      layers.push({
        sourceId: 'worldbank',
        sourceName: 'World Bank',
        layerId: indicatorId,
        name: indicator.name,
        unit: indicator.unit,
        category: indicator.category,
        connected: this.connected.worldbank || false
      });
    }

    return layers;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return [
      {
        id: 'osm',
        name: 'OpenStreetMap',
        description: INFRASTRUCTURE_DATA_SOURCES.OPENSTREETMAP.description,
        connected: this.connected.osm || false,
        type: 'overpass',
        layerCount: Object.keys(INFRASTRUCTURE_DATA_SOURCES.OPENSTREETMAP.layers).length
      },
      {
        id: 'worldbank',
        name: 'World Bank',
        description: INFRASTRUCTURE_DATA_SOURCES.WORLDBANK.description,
        connected: this.connected.worldbank || false,
        type: 'api',
        indicatorCount: Object.keys(INFRASTRUCTURE_DATA_SOURCES.WORLDBANK.indicators).length
      },
      {
        id: 'gca',
        name: 'GCA Infrastructure Vulnerability',
        description: INFRASTRUCTURE_DATA_SOURCES.GCA_VULNERABILITY.description,
        connected: false, // External data - manual upload required
        type: 'external',
        note: 'Requires manual data upload'
      }
    ];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let infrastructureInstance = null;

export function getInfrastructureConnector(options = {}) {
  if (!infrastructureInstance) {
    infrastructureInstance = new InfrastructureConnector(options);
  }
  return infrastructureInstance;
}

export function resetInfrastructureConnector() {
  infrastructureInstance = null;
}

export default InfrastructureConnector;
