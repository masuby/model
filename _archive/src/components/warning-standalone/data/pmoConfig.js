/**
 * PMO CONFIGURATION DATA
 * Actors, impact levels, and actions
 */

// Impact assessment levels
export const IMPACT_LEVELS = {
  'LOW': {
    value: 'Low Impact',
    description: 'Limited impact expected',
    color: '#4CAF50'
  },
  'MODERATE': {
    value: 'Moderate Impact',
    description: 'Moderate impact expected',
    color: '#FFC107'
  },
  'HIGH': {
    value: 'High Impact',
    description: 'High impact expected',
    color: '#FF9800'
  },
  'SEVERE': {
    value: 'Severe Impact',
    description: 'Severe impact expected',
    color: '#F44336'
  },
  'CRITICAL': {
    value: 'Critical Impact',
    description: 'Critical impact expected',
    color: '#B71C1C'
  }
};

// Registered actors/stakeholders
export const REGISTERED_ACTORS = [
  {
    id: 'nac',
    name: 'National Ambition Council',
    role: 'National Coordination',
    actions: ['Coordinate national response', 'Mobilize resources', 'Issue national directives']
  },
  {
    id: 'lga',
    name: 'Local Government Authorities',
    role: 'Local Implementation',
    actions: ['Activate LGA response', 'Community mobilization', 'Resource coordination']
  },
  {
    id: 'health',
    name: 'Ministry of Health',
    role: 'Health Response',
    actions: ['Activate health emergency', 'Prepare health facilities', 'Coordinate medical response']
  },
  {
    id: 'water',
    name: 'Ministry of Water',
    role: 'Water Management',
    actions: ['Monitor water levels', 'Prepare evacuation', 'Water safety measures']
  },
  {
    id: 'agriculture',
    name: 'Ministry of Agriculture',
    role: 'Agricultural Protection',
    actions: ['Advise farmers', 'Protect livestock', 'Plan recovery measures']
  },
  {
    id: 'media',
    name: 'Media/Communication',
    role: 'Public Awareness',
    actions: ['Disseminate warning', 'Public education', 'Prepare advisories']
  },
  {
    id: 'nrc',
    name: 'National Red Cross',
    role: 'Humanitarian Response',
    actions: ['Activate emergency response', 'Prepare relief support', 'Community assistance']
  },
  {
    id: 'nga',
    name: 'Civil Society Organizations',
    role: 'Community Support',
    actions: ['Community mobilization', 'Local support', 'Advocacy and monitoring']
  }
];

// Public actions based on warning level
export const PUBLIC_ACTIONS = {
  'MONITOR': ['Stay informed about hazard situation', 'Follow official updates', 'Check weather forecasts'],
  'ADVISORY': ['Be prepared to act', 'Review emergency plans', 'Gather emergency supplies'],
  'WARNING': ['Take protective action', 'Move to safe location if needed', 'Avoid hazard areas', 'Follow authority directives'],
  'MAJOR WARNING': ['Evacuate if directed', 'Seek shelter immediately', 'Follow all emergency orders', 'Contact emergency services if needed']
};

// Technical entities/institutions
export const TECHNICAL_ENTITIES = {
  'TMA': {
    name: 'Tanzania Meteorological Authority',
    abbreviation: 'TMA',
    role: 'Meteorological Monitoring'
  },
  'MOW': {
    name: 'Ministry of Water',
    abbreviation: 'MOW',
    role: 'Water Management'
  },
  'MOH': {
    name: 'Ministry of Health',
    abbreviation: 'MOH',
    role: 'Health Monitoring'
  },
  'MOA': {
    name: 'Ministry of Agriculture',
    abbreviation: 'MOA',
    role: 'Agricultural Monitoring'
  },
  'GST': {
    name: 'Geological Survey of Tanzania',
    abbreviation: 'GST',
    role: 'Seismic Monitoring'
  }
};
