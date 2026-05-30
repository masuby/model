/**
 * MODULE 04: INFORM SEVERITY - DATA DEFINITIONS
 *
 * Severity = Realized humanitarian and socio-economic impact
 * Aligns with INFORM's focus on humanitarian consequences
 */

// Institutional reporting mandates
export const IMPACT_REPORTING_INSTITUTIONS = {
  'PMO-DMD': {
    name: 'Prime Minister\'s Office - Disaster Management Department',
    role: 'National Consolidation',
    color: '#1976D2',
    impactDomains: ['Overall Impact', 'Response Coordination', 'National Statistics'],
    reportingCapabilities: [
      'Consolidated national impact assessment',
      'Inter-agency coordination',
      'National emergency declarations',
      'Resource mobilization'
    ]
  },
  'Regional Authorities': {
    name: 'Regional Administrative Secretariats',
    role: 'Regional Impact Assessment',
    color: '#7B1FA2',
    impactDomains: ['People Affected', 'Displacement', 'Regional Coordination'],
    reportingCapabilities: [
      'People affected (number)',
      'Internally displaced persons',
      'Evacuation status',
      'Regional resource needs'
    ]
  },
  'District Authorities': {
    name: 'District Executive Directors',
    role: 'District Impact Reporting',
    color: '#00796B',
    impactDomains: ['Local Impact', 'Community Damage', 'Local Response'],
    reportingCapabilities: [
      'Ward-level impact data',
      'Community infrastructure damage',
      'Local displacement',
      'Immediate needs assessment'
    ]
  },
  'MoH': {
    name: 'Ministry of Health',
    role: 'Health Impact Assessment',
    color: '#C62828',
    impactDomains: ['Health Impacts', 'Disease Surveillance', 'Medical Response'],
    reportingCapabilities: [
      'Injuries and deaths',
      'Disease outbreak detection',
      'Health facility status',
      'Medical supply needs'
    ]
  },
  'MoW': {
    name: 'Ministry of Works',
    role: 'Infrastructure Damage Assessment',
    color: '#F57C00',
    impactDomains: ['Infrastructure Damage', 'Transport Disruption', 'Utilities'],
    reportingCapabilities: [
      'Roads damaged',
      'Bridges destroyed',
      'Transport accessibility',
      'Water infrastructure damage'
    ]
  },
  'MoA': {
    name: 'Ministry of Agriculture',
    role: 'Livelihood Impact Assessment',
    color: '#558B2F',
    impactDomains: ['Crop Loss', 'Livestock Impact', 'Food Security'],
    reportingCapabilities: [
      'Crop loss (hectares)',
      'Livestock mortality',
      'Market disruption',
      'Food security status'
    ]
  }
};

// Severity indicator categories (INFORM-aligned)
export const SEVERITY_INDICATORS = {
  HUMAN_IMPACT: {
    name: 'Human Impact',
    icon: '👥',
    color: '#E53935',
    weight: 0.4, // Highest weight - human impact is primary
    indicators: [
      {
        id: 'people_affected',
        label: 'People Affected',
        unit: 'persons',
        description: 'Total number of people directly affected by the event',
        threshold: {
          veryLow: 0,
          low: 1000,
          medium: 10000,
          high: 50000,
          veryHigh: 100000
        }
      },
      {
        id: 'people_displaced',
        label: 'People Displaced',
        unit: 'persons',
        description: 'Number of internally displaced persons (IDPs)',
        threshold: {
          veryLow: 0,
          low: 500,
          medium: 5000,
          high: 25000,
          veryHigh: 50000
        }
      },
      {
        id: 'injuries',
        label: 'Injuries',
        unit: 'persons',
        description: 'Number of people injured',
        threshold: {
          veryLow: 0,
          low: 10,
          medium: 100,
          high: 500,
          veryHigh: 1000
        }
      },
      {
        id: 'deaths',
        label: 'Deaths',
        unit: 'persons',
        description: 'Number of deaths',
        threshold: {
          veryLow: 0,
          low: 1,
          medium: 10,
          high: 50,
          veryHigh: 100
        }
      }
    ]
  },
  INFRASTRUCTURE_IMPACT: {
    name: 'Infrastructure Impact',
    icon: '🏗️',
    color: '#FB8C00',
    weight: 0.3,
    indicators: [
      {
        id: 'houses_damaged',
        label: 'Houses Damaged',
        unit: 'houses',
        description: 'Number of houses damaged or destroyed',
        threshold: {
          veryLow: 0,
          low: 50,
          medium: 500,
          high: 2000,
          veryHigh: 5000
        }
      },
      {
        id: 'roads_damaged',
        label: 'Roads Damaged',
        unit: 'km',
        description: 'Length of roads damaged',
        threshold: {
          veryLow: 0,
          low: 5,
          medium: 25,
          high: 100,
          veryHigh: 250
        }
      },
      {
        id: 'bridges_destroyed',
        label: 'Bridges Destroyed',
        unit: 'bridges',
        description: 'Number of bridges destroyed or damaged',
        threshold: {
          veryLow: 0,
          low: 1,
          medium: 5,
          high: 10,
          veryHigh: 20
        }
      },
      {
        id: 'health_facilities',
        label: 'Health Facilities Affected',
        unit: 'facilities',
        description: 'Health facilities damaged or non-operational',
        threshold: {
          veryLow: 0,
          low: 1,
          medium: 3,
          high: 10,
          veryHigh: 20
        }
      },
      {
        id: 'schools_affected',
        label: 'Schools Affected',
        unit: 'schools',
        description: 'Schools damaged or closed',
        threshold: {
          veryLow: 0,
          low: 2,
          medium: 10,
          high: 50,
          veryHigh: 100
        }
      }
    ]
  },
  LIVELIHOOD_IMPACT: {
    name: 'Livelihood Impact',
    icon: '🌾',
    color: '#43A047',
    weight: 0.3,
    indicators: [
      {
        id: 'crop_loss',
        label: 'Crop Loss',
        unit: 'hectares',
        description: 'Agricultural land with crops destroyed',
        threshold: {
          veryLow: 0,
          low: 100,
          medium: 1000,
          high: 5000,
          veryHigh: 10000
        }
      },
      {
        id: 'livestock_loss',
        label: 'Livestock Loss',
        unit: 'animals',
        description: 'Number of livestock lost',
        threshold: {
          veryLow: 0,
          low: 50,
          medium: 500,
          high: 2000,
          veryHigh: 5000
        }
      },
      {
        id: 'markets_disrupted',
        label: 'Markets Disrupted',
        unit: 'markets',
        description: 'Number of markets closed or disrupted',
        threshold: {
          veryLow: 0,
          low: 1,
          medium: 5,
          high: 15,
          veryHigh: 30
        }
      },
      {
        id: 'livelihoods_affected',
        label: 'Livelihoods Affected',
        unit: 'households',
        description: 'Households with livelihood disruption',
        threshold: {
          veryLow: 0,
          low: 500,
          medium: 5000,
          high: 25000,
          veryHigh: 50000
        }
      }
    ]
  }
};

// Severity classification levels (geometric mean like INFORM Risk)
export const SEVERITY_LEVELS = {
  VERY_LOW: {
    value: 'Very Low',
    range: [0, 2.5],
    color: '#4CAF50',
    icon: '🟢',
    description: 'Minimal impact, routine response adequate'
  },
  LOW: {
    value: 'Low',
    range: [2.5, 5.0],
    color: '#FDD835',
    icon: '🟡',
    description: 'Limited impact, local response with some support'
  },
  MEDIUM: {
    value: 'Medium',
    range: [5.0, 6.5],
    color: '#FF9800',
    icon: '🟠',
    description: 'Significant impact, regional coordination required'
  },
  HIGH: {
    value: 'High',
    range: [6.5, 8.0],
    color: '#FF5722',
    icon: '🔴',
    description: 'Severe impact, national response needed'
  },
  VERY_HIGH: {
    value: 'Very High',
    range: [8.0, 10.0],
    color: '#B71C1C',
    icon: '⚫',
    description: 'Catastrophic impact, international assistance required'
  }
};

// Response status tracking
export const RESPONSE_STATUS = {
  NOT_STARTED: {
    label: 'Not Started',
    color: '#9E9E9E',
    icon: '⏸️'
  },
  MOBILIZING: {
    label: 'Mobilizing',
    color: '#FDD835',
    icon: '⚙️'
  },
  ONGOING: {
    label: 'Ongoing',
    color: '#2196F3',
    icon: '▶️'
  },
  COMPLETED: {
    label: 'Completed',
    color: '#4CAF50',
    icon: '✅'
  },
  GAPS_IDENTIFIED: {
    label: 'Gaps Identified',
    color: '#FF5722',
    icon: '⚠️'
  }
};

// Response action types
export const RESPONSE_ACTIONS = [
  {
    id: 'search_rescue',
    name: 'Search & Rescue',
    icon: '🚁',
    category: 'Immediate Response'
  },
  {
    id: 'evacuation',
    name: 'Evacuation',
    icon: '🚌',
    category: 'Immediate Response'
  },
  {
    id: 'emergency_shelter',
    name: 'Emergency Shelter',
    icon: '⛺',
    category: 'Humanitarian Assistance'
  },
  {
    id: 'food_distribution',
    name: 'Food Distribution',
    icon: '🍲',
    category: 'Humanitarian Assistance'
  },
  {
    id: 'medical_assistance',
    name: 'Medical Assistance',
    icon: '🏥',
    category: 'Health Response'
  },
  {
    id: 'water_sanitation',
    name: 'Water & Sanitation',
    icon: '💧',
    category: 'Essential Services'
  },
  {
    id: 'infrastructure_repair',
    name: 'Infrastructure Repair',
    icon: '🔧',
    category: 'Recovery'
  },
  {
    id: 'livelihood_support',
    name: 'Livelihood Support',
    icon: '💼',
    category: 'Recovery'
  }
];

// Event timeline phases
export const EVENT_PHASES = {
  WARNING_ISSUED: {
    label: 'Warning Issued',
    icon: '📢',
    color: '#FDD835'
  },
  HAZARD_ONSET: {
    label: 'Hazard Onset',
    icon: '🌊',
    color: '#FF9800'
  },
  PEAK_IMPACT: {
    label: 'Peak Impact',
    icon: '⚠️',
    color: '#F44336'
  },
  RESPONSE_ACTIVE: {
    label: 'Response Active',
    icon: '🚨',
    color: '#2196F3'
  },
  RECOVERY_PHASE: {
    label: 'Recovery Phase',
    icon: '🔄',
    color: '#4CAF50'
  }
};

/**
 * Calculate severity score using geometric mean (INFORM approach)
 * Severity = (Human × Infrastructure × Livelihood)^(1/3)
 */
export const calculateSeverityScore = (humanScore, infrastructureScore, livelihoodScore) => {
  if (!humanScore || !infrastructureScore || !livelihoodScore) return 0;
  return Math.pow(humanScore * infrastructureScore * livelihoodScore, 1/3);
};

/**
 * Classify severity based on score
 */
export const classifySeverity = (score) => {
  if (score >= 8.0) return SEVERITY_LEVELS.VERY_HIGH;
  if (score >= 6.5) return SEVERITY_LEVELS.HIGH;
  if (score >= 5.0) return SEVERITY_LEVELS.MEDIUM;
  if (score >= 2.5) return SEVERITY_LEVELS.LOW;
  return SEVERITY_LEVELS.VERY_LOW;
};

/**
 * Normalize indicator value to 0-10 scale based on thresholds
 */
export const normalizeIndicator = (value, thresholds) => {
  if (value <= thresholds.veryLow) return 0;
  if (value <= thresholds.low) return 2.5;
  if (value <= thresholds.medium) return 5.0;
  if (value <= thresholds.high) return 7.5;
  return 10.0;
};
