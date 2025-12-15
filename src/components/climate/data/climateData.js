/**
 * MODULE 05: INFORM CLIMATE CHANGE - DATA DEFINITIONS
 *
 * Extends INFORM into long-term climate risk, projections, and adaptation
 */

// Climate Scenarios (IPCC AR6)
export const CLIMATE_SCENARIOS = {
  SSP1_26: {
    id: 'SSP1-2.6',
    name: 'SSP1-2.6 (Low Emissions)',
    description: 'Sustainability pathway with strong mitigation',
    tempIncrease2050: 1.5,
    tempIncrease2100: 1.8,
    color: '#4CAF50',
    icon: '🌱'
  },
  SSP2_45: {
    id: 'SSP2-4.5',
    name: 'SSP2-4.5 (Intermediate)',
    description: 'Middle-of-the-road scenario',
    tempIncrease2050: 2.0,
    tempIncrease2100: 2.7,
    color: '#FF9800',
    icon: '⚖️'
  },
  SSP5_85: {
    id: 'SSP5-8.5',
    name: 'SSP5-8.5 (High Emissions)',
    description: 'Fossil-fueled development',
    tempIncrease2050: 2.4,
    tempIncrease2100: 4.4,
    color: '#F44336',
    icon: '🔥'
  }
};

// Time Horizons
export const TIME_HORIZONS = {
  HISTORICAL: {
    label: 'Historical (1980-2020)',
    period: '1980-2020',
    type: 'observed',
    color: '#757575'
  },
  NEAR_TERM: {
    label: 'Near Term (2020-2040)',
    period: '2020-2040',
    type: 'projection',
    color: '#2196F3'
  },
  MID_TERM: {
    label: 'Mid-Century (2040-2060)',
    period: '2040-2060',
    type: 'projection',
    color: '#FF9800'
  },
  LONG_TERM: {
    label: 'Long Term (2080-2100)',
    period: '2080-2100',
    type: 'projection',
    color: '#F44336'
  }
};

// Climate Hazards (Tanzania-specific)
export const CLIMATE_HAZARDS = {
  TEMPERATURE: {
    name: 'Temperature Extremes',
    icon: '🌡️',
    color: '#F44336',
    indicators: [
      'Annual mean temperature',
      'Hot days (>35°C)',
      'Heat waves frequency',
      'Growing degree days'
    ],
    impacts: [
      'Heat stress on population',
      'Agricultural productivity decline',
      'Water stress amplification',
      'Energy demand increase'
    ]
  },
  PRECIPITATION: {
    name: 'Rainfall Variability',
    icon: '🌧️',
    color: '#2196F3',
    indicators: [
      'Annual precipitation change',
      'Heavy rainfall events',
      'Dry spell duration',
      'Seasonal shift'
    ],
    impacts: [
      'Flooding frequency increase',
      'Drought intensification',
      'Agricultural disruption',
      'Water availability variability'
    ]
  },
  DROUGHT: {
    name: 'Drought Intensification',
    icon: '🏜️',
    color: '#FF9800',
    indicators: [
      'Standardized Precipitation Index',
      'Soil moisture deficit',
      'Consecutive dry days',
      'Vegetation health index'
    ],
    impacts: [
      'Food insecurity',
      'Livestock mortality',
      'Water scarcity',
      'Livelihood disruption'
    ]
  },
  SEA_LEVEL: {
    name: 'Sea Level Rise (Coastal)',
    icon: '🌊',
    color: '#00BCD4',
    indicators: [
      'Mean sea level rise',
      'Storm surge height',
      'Coastal erosion rate',
      'Saltwater intrusion'
    ],
    impacts: [
      'Coastal infrastructure damage',
      'Displacement of coastal populations',
      'Agricultural land salinization',
      'Tourism sector impacts'
    ]
  }
};

// Historical Trends (Sample Data - Tanzania)
export const HISTORICAL_TRENDS = {
  temperature: {
    data: [
      { year: 1980, value: 22.5 },
      { year: 1985, value: 22.7 },
      { year: 1990, value: 23.1 },
      { year: 1995, value: 23.3 },
      { year: 2000, value: 23.6 },
      { year: 2005, value: 24.0 },
      { year: 2010, value: 24.3 },
      { year: 2015, value: 24.7 },
      { year: 2020, value: 25.0 }
    ],
    unit: '°C',
    trend: 'increasing',
    change: '+2.5°C since 1980'
  },
  precipitation: {
    data: [
      { year: 1980, value: 920 },
      { year: 1985, value: 890 },
      { year: 1990, value: 910 },
      { year: 1995, value: 860 },
      { year: 2000, value: 880 },
      { year: 2005, value: 850 },
      { year: 2010, value: 900 },
      { year: 2015, value: 870 },
      { year: 2020, value: 840 }
    ],
    unit: 'mm/year',
    trend: 'decreasing',
    change: '-80mm since 1980'
  },
  extremeEvents: {
    data: [
      { year: 1980, value: 3 },
      { year: 1985, value: 4 },
      { year: 1990, value: 5 },
      { year: 1995, value: 6 },
      { year: 2000, value: 8 },
      { year: 2005, value: 10 },
      { year: 2010, value: 12 },
      { year: 2015, value: 15 },
      { year: 2020, value: 18 }
    ],
    unit: 'events/year',
    trend: 'increasing',
    change: '+500% since 1980'
  }
};

// Future Projections (Sample for SSP2-4.5)
export const PROJECTIONS = {
  temperature: {
    SSP1_26: [
      { year: 2030, value: 25.5, uncertainty: [25.2, 25.8] },
      { year: 2050, value: 26.2, uncertainty: [25.8, 26.6] },
      { year: 2070, value: 26.5, uncertainty: [26.0, 27.0] },
      { year: 2100, value: 26.8, uncertainty: [26.2, 27.4] }
    ],
    SSP2_45: [
      { year: 2030, value: 25.7, uncertainty: [25.3, 26.1] },
      { year: 2050, value: 27.0, uncertainty: [26.5, 27.5] },
      { year: 2070, value: 28.0, uncertainty: [27.3, 28.7] },
      { year: 2100, value: 28.7, uncertainty: [27.9, 29.5] }
    ],
    SSP5_85: [
      { year: 2030, value: 25.9, uncertainty: [25.5, 26.3] },
      { year: 2050, value: 27.4, uncertainty: [26.9, 27.9] },
      { year: 2070, value: 29.5, uncertainty: [28.7, 30.3] },
      { year: 2100, value: 31.4, uncertainty: [30.4, 32.4] }
    ]
  },
  precipitation: {
    SSP1_26: [
      { year: 2030, value: 820, uncertainty: [780, 860] },
      { year: 2050, value: 800, uncertainty: [750, 850] },
      { year: 2070, value: 790, uncertainty: [730, 850] },
      { year: 2100, value: 780, uncertainty: [710, 850] }
    ],
    SSP2_45: [
      { year: 2030, value: 810, uncertainty: [760, 860] },
      { year: 2050, value: 770, uncertainty: [700, 840] },
      { year: 2070, value: 740, uncertainty: [660, 820] },
      { year: 2100, value: 720, uncertainty: [630, 810] }
    ],
    SSP5_85: [
      { year: 2030, value: 800, uncertainty: [750, 850] },
      { year: 2050, value: 750, uncertainty: [670, 830] },
      { year: 2070, value: 680, uncertainty: [580, 780] },
      { year: 2100, value: 620, uncertainty: [510, 730] }
    ]
  }
};

// Adaptation Strategies
export const ADAPTATION_STRATEGIES = {
  INFRASTRUCTURE: {
    name: 'Climate-Resilient Infrastructure',
    icon: '🏗️',
    color: '#607D8B',
    actions: [
      'Flood-resistant road design',
      'Drainage system upgrades',
      'Coastal protection structures',
      'Climate-proofed public buildings'
    ],
    timeframe: 'Medium to Long Term',
    cost: 'High',
    effectiveness: 'High'
  },
  AGRICULTURE: {
    name: 'Climate-Smart Agriculture',
    icon: '🌾',
    color: '#558B2F',
    actions: [
      'Drought-resistant crop varieties',
      'Water-efficient irrigation',
      'Diversified farming systems',
      'Agricultural insurance schemes'
    ],
    timeframe: 'Short to Medium Term',
    cost: 'Medium',
    effectiveness: 'High'
  },
  WATER: {
    name: 'Water Security & Management',
    icon: '💧',
    color: '#2196F3',
    actions: [
      'Rainwater harvesting systems',
      'Water storage infrastructure',
      'Groundwater recharge programs',
      'Demand management strategies'
    ],
    timeframe: 'Short to Long Term',
    cost: 'Medium',
    effectiveness: 'High'
  },
  EARLY_WARNING: {
    name: 'Enhanced Early Warning',
    icon: '⚠️',
    color: '#FF9800',
    actions: [
      'Climate information services',
      'Seasonal forecast systems',
      'Community-based monitoring',
      'Multi-hazard warning systems'
    ],
    timeframe: 'Short Term',
    cost: 'Low to Medium',
    effectiveness: 'Very High'
  },
  ECOSYSTEM: {
    name: 'Ecosystem-Based Adaptation',
    icon: '🌳',
    color: '#4CAF50',
    actions: [
      'Forest conservation & restoration',
      'Wetland protection',
      'Mangrove restoration (coastal)',
      'Watershed management'
    ],
    timeframe: 'Medium to Long Term',
    cost: 'Low to Medium',
    effectiveness: 'Medium to High'
  },
  SOCIAL: {
    name: 'Social Protection & Livelihood',
    icon: '👥',
    color: '#9C27B0',
    actions: [
      'Climate risk insurance',
      'Cash transfer programs',
      'Livelihood diversification',
      'Education & awareness programs'
    ],
    timeframe: 'Short to Medium Term',
    cost: 'Medium',
    effectiveness: 'Medium'
  }
};

// Risk Amplification Factors
export const RISK_AMPLIFICATION = {
  EXPOSURE_CHANGE: {
    label: 'Population Growth & Urbanization',
    description: 'Increasing exposure as populations grow in hazard-prone areas',
    trend: 'Increasing',
    impact: 'High'
  },
  VULNERABILITY_CHANGE: {
    label: 'Socio-Economic Vulnerability',
    description: 'Changing vulnerability due to poverty, inequality, and development',
    trend: 'Variable',
    impact: 'High'
  },
  CAPACITY_CHANGE: {
    label: 'Adaptive Capacity Development',
    description: 'Improving capacity through development and investment',
    trend: 'Improving',
    impact: 'Medium'
  }
};

/**
 * Calculate climate risk amplification
 * Climate Risk = Current Risk × Climate Change Factor × Exposure Change × Vulnerability Change
 */
export const calculateClimateRisk = (currentRisk, climateScenario, timeHorizon) => {
  // Simplified calculation - in production, use climate model outputs
  const scenarioFactors = {
    'SSP1-2.6': 1.2,
    'SSP2-4.5': 1.5,
    'SSP5-8.5': 2.0
  };

  const timeFactors = {
    '2020-2040': 1.1,
    '2040-2060': 1.3,
    '2080-2100': 1.6
  };

  const climateFactor = scenarioFactors[climateScenario] || 1.5;
  const timeFactor = timeFactors[timeHorizon] || 1.3;

  return currentRisk * climateFactor * timeFactor;
};

/**
 * Get climate trend direction
 */
export const getTrendDirection = (data) => {
  if (data.length < 2) return 'stable';
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const change = ((lastValue - firstValue) / firstValue) * 100;

  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
};
