/**
 * MULTI-HAZARD EARLY WARNING SYSTEM WORKFLOW DATA
 *
 * Defines the operational workflow, actors, and data structures
 * for Tanzania's risk-informed early warning system
 */

// Step 1: Technical Warning Entities
export const TECHNICAL_ENTITIES = {
  TMA: {
    name: 'Tanzania Meteorological Authority',
    abbreviation: 'TMA',
    hazards: [
      'Heavy Rainfall',
      'Strong Winds',
      'Large Waves',
      'Flash Floods',
      'Dry Spells',
      'Heatwave'
    ],
    role: 'Monitor weather hazards and enter hazard likelihood + affected regions',
    icon: '🌧️',
    color: '#2196F3'
  },
  MoW: {
    name: 'Ministry of Water',
    abbreviation: 'MoW',
    hazards: [
      'Riverine Floods',
      'Rising Water Levels',
      'Dam Level Alert'
    ],
    role: 'Provide hydrological risk information and likelihood levels',
    icon: '🌊',
    color: '#03A9F4'
  },
  MoH: {
    name: 'Ministry of Health',
    abbreviation: 'MoH',
    hazards: [
      'Epidemics',
      'Disease Outbreak',
      'Health-Related Hazards'
    ],
    role: 'Provide alerts on disease outbreaks and potential impacts',
    icon: '🏥',
    color: '#F44336'
  },
  MoA: {
    name: 'Ministry of Agriculture',
    abbreviation: 'MoA',
    hazards: [
      'Agrometeorological Drought',
      'Crop Stress',
      'Pest Infestation',
      'Livestock Disease'
    ],
    role: 'Provide drought/stress assessments and early alerts',
    icon: '🌾',
    color: '#8BC34A'
  }
};

// Likelihood Levels (Step 1.2.B)
export const LIKELIHOOD_LEVELS = {
  LOW: {
    value: 'Low',
    score: 2.5,
    color: '#8BC34A',
    description: 'Hazard occurrence is possible but not likely'
  },
  MEDIUM: {
    value: 'Medium',
    score: 5.0,
    color: '#FFC107',
    description: 'Hazard occurrence is moderately likely'
  },
  HIGH: {
    value: 'High',
    score: 7.5,
    color: '#F44336',
    description: 'Hazard occurrence is very likely or imminent'
  }
};

// Preliminary Warning Levels (Step 1.2.D)
export const PRELIMINARY_WARNING_LEVELS = {
  ADVISORY: {
    value: 'Advisory',
    severity: 'Low',
    color: '#FFC107',
    icon: '🟡',
    technicalAdvice: 'Please be prepared'
  },
  WARNING: {
    value: 'Warning',
    severity: 'Medium',
    color: '#FF9800',
    icon: '🟠',
    technicalAdvice: 'Take Action'
  },
  MAJOR_WARNING: {
    value: 'Major Warning',
    severity: 'High',
    color: '#F44336',
    icon: '🔴',
    technicalAdvice: 'Take Action Now'
  }
};

// Impact Levels (Step 2.3)
export const IMPACT_LEVELS = {
  LOW: {
    value: 'Low Impact',
    score: 2.5,
    color: '#8BC34A',
    description: 'Minimal disruption to normal activities'
  },
  MODERATE: {
    value: 'Moderate Impact',
    score: 5.0,
    color: '#FFC107',
    description: 'Some disruption, localized damage'
  },
  HIGH: {
    value: 'High Impact',
    score: 7.5,
    color: '#FF9800',
    description: 'Significant damage, widespread disruption'
  },
  EXTREME: {
    value: 'Extreme Impact',
    score: 9.5,
    color: '#D32F2F',
    description: 'Catastrophic damage, major humanitarian crisis'
  }
};

// Step 3.B: Registered Actors and Their Roles
export const REGISTERED_ACTORS = [
  {
    id: 'rddc',
    name: 'Regional and District Disaster Committees',
    role: 'Activate preparedness teams',
    actions: [
      'Convene emergency meeting',
      'Activate district disaster teams',
      'Coordinate sector responses',
      'Monitor situation and report to PMO-DMD'
    ],
    category: 'Coordination'
  },
  {
    id: 'police_fire',
    name: 'Police and Fire Services',
    role: 'Prepare evacuation and rescue',
    actions: [
      'Pre-position rescue equipment',
      'Identify evacuation routes',
      'Prepare rescue teams',
      'Coordinate with health facilities'
    ],
    category: 'Emergency Services'
  },
  {
    id: 'local_auth',
    name: 'Local Authorities (Ward/Village)',
    role: 'Identify shelters, clear drains, monitor high-risk zones',
    actions: [
      'Open and prepare emergency shelters',
      'Clear drainage systems',
      'Monitor flood-prone areas',
      'Organize community volunteers',
      'Disseminate warnings door-to-door'
    ],
    category: 'Local Response'
  },
  {
    id: 'media',
    name: 'Media (TV, Radio, Social Media)',
    role: 'Disseminate public warnings',
    actions: [
      'Broadcast warnings every hour',
      'Share PMO-DMD advisories',
      'Provide safety instructions',
      'Avoid spreading unverified information'
    ],
    category: 'Communication'
  },
  {
    id: 'health',
    name: 'Health Facilities',
    role: 'Activate disease surveillance',
    actions: [
      'Activate disease surveillance protocols',
      'Prepare emergency medical supplies',
      'Brief medical staff on anticipated cases',
      'Coordinate with ambulance services'
    ],
    category: 'Health'
  },
  {
    id: 'agriculture',
    name: 'Agriculture Extension Officers',
    role: 'Guide farmers based on drought/rainfall alerts',
    actions: [
      'Advise farmers on planting decisions',
      'Provide drought-resistant crop recommendations',
      'Coordinate livestock protection',
      'Assess crop damage after event'
    ],
    category: 'Agriculture'
  },
  {
    id: 'ngo',
    name: 'NGOs and Humanitarian Agencies',
    role: 'Support vulnerable populations',
    actions: [
      'Pre-position relief supplies',
      'Identify vulnerable households',
      'Coordinate with local authorities',
      'Prepare rapid assessment teams'
    ],
    category: 'Humanitarian'
  },
  {
    id: 'private_sector',
    name: 'Private Sector (Transport, Utilities)',
    role: 'Maintain critical services',
    actions: [
      'Secure infrastructure',
      'Prepare backup systems',
      'Coordinate with emergency services',
      'Plan service restoration'
    ],
    category: 'Services'
  }
];

// Step 3.C: Public Actions (by Warning Level)
export const PUBLIC_ACTIONS = {
  ADVISORY: [
    {
      action: 'Stay informed',
      details: 'Follow updates from TMA and PMO-DMD'
    },
    {
      action: 'Review preparedness',
      details: 'Check emergency supplies and family plan'
    },
    {
      action: 'Avoid risky areas',
      details: 'Stay away from known flood-prone zones'
    },
    {
      action: 'Protect vulnerable members',
      details: 'Ensure children, elders, and PWDs are safe'
    }
  ],
  WARNING: [
    {
      action: 'Avoid crossing flooded roads',
      details: 'Do not drive or walk through flood waters'
    },
    {
      action: 'Secure property',
      details: 'Move valuable items to higher ground'
    },
    {
      action: 'Fishermen avoid going to the sea',
      details: 'Do not go fishing during strong winds and large waves'
    },
    {
      action: 'Protect children, elders, and PWDs',
      details: 'Move vulnerable persons to safe locations'
    },
    {
      action: 'Follow continuous updates',
      details: 'Monitor radio/TV for TMA and PMO-DMD advisories'
    },
    {
      action: 'Prepare to evacuate',
      details: 'Pack essentials and identify evacuation route'
    }
  ],
  MAJOR_WARNING: [
    {
      action: 'Move to higher ground immediately',
      details: 'If in flood-prone area, evacuate now'
    },
    {
      action: 'Evacuate if instructed',
      details: 'Follow local authority evacuation orders'
    },
    {
      action: 'Avoid crossing flooded roads',
      details: 'Water may be deeper and faster than it appears'
    },
    {
      action: 'Stay indoors during strong winds',
      details: 'Avoid open areas, stay away from windows'
    },
    {
      action: 'Protect children, elders, and PWDs',
      details: 'Ensure vulnerable persons are in safe shelter'
    },
    {
      action: 'Fishermen must not go to sea',
      details: 'Extremely dangerous conditions - stay on land'
    },
    {
      action: 'Emergency contacts ready',
      details: 'Have emergency numbers accessible'
    },
    {
      action: 'Follow TMA continuous updates',
      details: 'Listen to radio/TV every hour'
    }
  ]
};

// PMO-DMD Assessment Factors (Step 2.2)
export const ASSESSMENT_FACTORS = {
  EXPOSURE: {
    name: 'Exposure',
    description: 'Population, livelihood, and infrastructure in affected areas',
    components: [
      'Total population in hazard zone',
      'Number of households',
      'Critical infrastructure (hospitals, schools, power)',
      'Economic assets (businesses, agriculture)',
      'Transport networks (roads, bridges)'
    ]
  },
  VULNERABILITY: {
    name: 'Vulnerability',
    description: 'Children, elders, PWDs, slum areas, flood-prone settlements',
    components: [
      'Children under 5',
      'Elderly (65+ years)',
      'Persons with Disabilities (PWDs)',
      'Pregnant women',
      'Slum/informal settlements',
      'Flood-prone settlements',
      'Remote/hard-to-reach areas'
    ]
  },
  CAPACITY: {
    name: 'Capacity',
    description: 'Response readiness, accessibility, resources',
    components: [
      'Emergency services availability',
      'Health facility capacity',
      'Evacuation shelter availability',
      'Road accessibility',
      'Communication systems',
      'Local response teams',
      'Pre-positioned relief supplies'
    ]
  }
};

// Data Entry Template for Technical Entities (Step 1.2)
export const HAZARD_ENTRY_TEMPLATE = {
  hazardType: '',              // From entity's authorized list
  institution: '',             // TMA, MoW, MoH, MoA
  likelihoodLevel: '',         // Low, Medium, High
  spatialCoverage: {
    regions: [],
    districts: [],
    wards: [],                 // Optional
    villages: []               // Optional
  },
  preliminaryWarningLevel: '', // Advisory, Warning, Major Warning
  technicalAdvice: '',         // Please be prepared / Take Action / Take Action Now
  additionalDetails: '',
  submittedAt: '',
  submittedBy: ''              // User name/ID
};

// PMO-DMD Consolidation Template (Step 2)
export const PMO_CONSOLIDATION_TEMPLATE = {
  consolidationId: '',
  hazardInputs: [],            // Array of hazard entries from technical entities
  impactAssessment: {
    exposure: {
      totalPopulation: 0,
      households: 0,
      criticalInfrastructure: []
    },
    vulnerability: {
      children: 0,
      elderly: 0,
      pwds: 0,
      slumAreas: [],
      floodProneSettlements: []
    },
    capacity: {
      emergencyServices: '',
      healthCapacity: '',
      shelterAvailability: '',
      roadAccessibility: ''
    }
  },
  impactLevel: '',             // Low, Moderate, High, Extreme
  finalStatement: '',          // Advisory, Warning, Major Warning
  directivesToActors: [],      // Array of {actor, directive}
  publicActions: [],           // Array of public safety instructions
  issuedAt: '',
  issuedBy: ''                 // PMO-DMD officer
};

export default {
  TECHNICAL_ENTITIES,
  LIKELIHOOD_LEVELS,
  PRELIMINARY_WARNING_LEVELS,
  IMPACT_LEVELS,
  REGISTERED_ACTORS,
  PUBLIC_ACTIONS,
  ASSESSMENT_FACTORS,
  HAZARD_ENTRY_TEMPLATE,
  PMO_CONSOLIDATION_TEMPLATE
};
