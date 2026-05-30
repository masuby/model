// UI constants for the Risk module's hazard selector (pure labels, not data).

export const OVERALL_RISK = { id: 'overall', name: 'Overall Risk', icon: '⚠️', description: 'Combined INFORM Risk Index' };

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
