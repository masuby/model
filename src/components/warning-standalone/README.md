# Hazard Input & PMO Dashboard - Standalone System

A streamlined, independent early warning system combining institutional hazard input (Layer 1) and PMO validation (Layer 4) from the full INFORM warning framework.

## Overview

This standalone system provides:
- **Hazard Input Panel**: Institutions (TMA, MOW, MOH, MOA, GST) submit hazard forecasts
- **PMO Dashboard**: National PMO-DMD validates, assesses, and issues risk-informed warnings
- **Minimal Dependencies**: Works independently without requiring other system modules

## Directory Structure

```
warning-standalone/
├── HazardAndPMOSystem.jsx          # Main container component
├── HazardAndPMOSystem.css           # Styling
├── README.md                         # This file
│
├── layers/
│   ├── HazardInputPanel.jsx         # Hazard submission interface (Layer 1)
│   └── PMOValidationPanel.jsx       # PMO validation interface (Layer 4)
│
├── components/
│   └── StandaloneHazardMap.jsx      # Interactive district map
│
├── data/
│   ├── hazardConfig.js              # Institutions, regions, hazards
│   └── pmoConfig.js                 # Actors, impact levels, actions
│
└── services/
    └── systemService.js             # System initialization, data loading, validation
```

## Usage

### Basic Implementation

```jsx
import HazardAndPMOSystem from './components/warning-standalone/HazardAndPMOSystem';

function App() {
  return (
    <HazardAndPMOSystem riskDataUrl="/data/tanzania-inform-risk.xlsx" />
  );
}
```

### With Custom Risk Data

```jsx
<HazardAndPMOSystem riskDataUrl="/api/risk-data" />
```

### Standalone Mode (No Risk Data)

```jsx
<HazardAndPMOSystem />
```

## Features

### Hazard Input (Layer 1)
- Institution-specific hazard type selection
- Interactive district map for spatial selection
- Warning level assignment (Advisory, Warning, Major Warning)
- Temporal validity configuration
- Likelihood and quantitative intensity input
- Form-based and map-based selection methods
- Simulation mode for testing

### PMO Dashboard (Layer 4)
- Review submitted hazards
- Risk assessment using INFORM formula
- Impact level selection
- Responsible actor assignment
- Hazard rollback/revision requests
- Warning issuance with audit logging
- Recently issued warnings preview

## Key Components

### HazardAndPMOSystem.jsx
Main container managing:
- View switching between Hazard Input and PMO Dashboard
- Hazard submission workflow
- Statistics tracking
- System state management
- Mode toggle (Live/Simulation)

### HazardInputPanel.jsx
Allows institutional users to:
- Select their institution (pre-filled for institution users)
- Choose hazard type from their mandate
- Select affected districts via map or form
- Set temporal validity and intensity
- Submit hazard forecast for PMO review

### PMOValidationPanel.jsx
Allows PMO-DMD to:
- Review pending hazards
- Assess risk using INFORM framework
- Document exposure, vulnerability, coping capacity
- Select responsible actors
- Issue warnings or request revisions
- Track audit trail

### StandaloneHazardMap.jsx
Interactive map featuring:
- All Tanzania districts in grid layout
- Color-coded by warning level
- Click to select/deselect districts
- Coverage statistics
- Legend and selection summary

## Data Configuration

### Hazard Types (by Institution)
- **TMA**: Heavy Rainfall, Strong Winds, Large Waves, Dry Spells, Extreme Temperature
- **MOW**: River Flood, Dam Level Alert, Coastal Flood
- **MOH**: Disease Outbreak, Epidemic, Health Emergency
- **MOA**: Agricultural Drought, Crop Disease, Livestock Disease, Pest Infestation
- **GST**: Earthquake, Landslide, Volcanic Activity, Ground Subsidence

### Impact Levels
- Low Impact
- Moderate Impact
- High Impact
- Severe Impact
- Critical Impact

### Responsible Actors
- National Ambition Council
- Local Government Authorities
- Ministry of Health
- Ministry of Water
- Ministry of Agriculture
- Media/Communication
- National Red Cross
- Civil Society Organizations

## Workflow

```
1. Institution submits hazard
   ↓
2. Hazard added to pending review queue
   ↓
3. PMO-DMD selects hazard from list
   ↓
4. PMO assesses risk and impact
   ↓
5. PMO selects responsible actors
   ↓
6. PMO issues warning OR requests revision
   ↓
7. Warning logged and tracked
```

## Service Functions

### systemService.js
- `initializeSystem()` - Initialize system state
- `loadRiskData(url)` - Load risk data from Excel or API
- `calculateWarningScore(hazardScore, riskData)` - INFORM formula calculation
- `getWarningLevelFromScore(score)` - Convert score to level
- `validateHazardData(hazardData)` - Validate hazard submission
- `exportWarningAsJSON(warningData)` - Export warning to JSON
- `exportWarningAsCSV(warningData)` - Export warning to CSV

## Modes

### Live Mode
- Real hazard submissions
- Full audit logging
- Production workflow

### Simulation Mode
- Testing and training
- Same UI but marked as simulation
- Preserves submitted scenarios
- Useful for institution training

## Integration Points

### Audit Service
```javascript
import { logWarningCreated, logWarningApproved, logWarningPublished } from '../../../services/auditService';

// Logged events:
- Hazard created
- Warning approved by PMO
- Warning published/disseminated
```

### Risk Data
Expects structure:
```javascript
{
  national: {
    hazardExposure: number,
    vulnerability: number,
    lackCopingCapacity: number
  },
  subnational: {
    adm2: Array<{
      admin: { adm2Name: string },
      hazardExposure: number,
      vulnerability: number,
      lackCopingCapacity: number
    }>
  }
}
```

## Styling

All styling is self-contained in `HazardAndPMOSystem.css` with:
- Mobile-responsive design
- Color-coded warning levels
- Accessible form controls
- Loading animations
- Modal dialogs

## State Management

### Main Container State
- `currentView`: 'hazard' or 'pmo'
- `activeHazards`: Pending hazard submissions
- `validatedWarnings`: Issued warnings
- `riskData`: Loaded risk context
- `loading`: System initialization state
- `simulationMode`: Test vs. live mode

### Component State
Each panel manages its own form state and selections independently.

## Error Handling

- Risk data load fallback with mock data
- Form validation with user feedback
- Error logging to console
- User alerts for critical actions

## Performance Considerations

- Lazy loading of risk data
- Efficient district grid rendering (100+ districts)
- Memoized callback functions
- CSS transitions for smooth UX

## Future Enhancements

- Real-time collaboration on hazards
- GIS integration for actual map visualization
- SMS/Email notification system
- Historical warning trends
- Impact assessment post-analysis
- API integration for direct hazard feeds
- Multi-language support

## Support

For issues, enhancements, or questions:
- Check the parent Module03WarningSystem documentation
- Review audit logs for troubleshooting
- Test in simulation mode first

## License

Part of INFORM Risk-Informed Decision Support Platform - Tanzania
