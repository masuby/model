# Quick Start Guide - Hazard & PMO Standalone System

## Installation

1. **Import the component** in your React application:

```jsx
import HazardAndPMOSystem from './components/warning-standalone';
```

2. **Use in your app**:

```jsx
function App() {
  return (
    <div>
      <HazardAndPMOSystem riskDataUrl="/data/tanzania-inform-risk.xlsx" />
    </div>
  );
}

export default App;
```

## Complete Example

```jsx
import React from 'react';
import HazardAndPMOSystem from './components/warning-standalone';

function WarningSystemPage() {
  return (
    <div className="app">
      <HazardAndPMOSystem
        riskDataUrl="/api/risk-data"
      />
    </div>
  );
}

export default WarningSystemPage;
```

## Configuration Props

### HazardAndPMOSystem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `riskDataUrl` | string | '/data/tanzania-inform-risk.xlsx' | URL to risk data Excel file or API endpoint |

## Main Workflow

### For Institutional Users (Hazard Input Tab)

1. **Select Institution**
   - Your institution is pre-filled if you have role-based access
   - Otherwise, choose from TMA, MOW, MOH, MOA, GST

2. **Choose Hazard Type**
   - Options depend on your institution's mandate

3. **Select Affected Districts**
   - Use map (click districts) or form (checkbox list)
   - Assign warning level to each district
   - Level-specific colors:
     - 🟡 Yellow = Advisory
     - 🟠 Orange = Warning
     - 🔴 Red = Major Warning

4. **Set Temporal Validity**
   - Choose start and end dates
   - Defaults to today → tomorrow (24 hours)

5. **Add Details**
   - Likelihood (High/Medium/Low)
   - Quantitative intensity (optional)
   - Additional notes (optional)

6. **Submit**
   - Click "Submit Warning" button
   - Hazard goes to PMO pending queue

### For PMO-DMD Users (PMO Dashboard Tab)

1. **View Pending Hazards**
   - See all submitted hazards awaiting review
   - Color-coded by calculated warning level
   - Shows institution and districts affected

2. **Select Hazard for Assessment**
   - Click any hazard card to open assessment panel
   - Map preview shows affected districts

3. **Assess Risk**
   - Review INFORM risk calculation
   - Set impact level (Low → Critical)
   - Assign responsible actors

4. **Document Assessment**
   - Add exposure notes
   - Add vulnerability notes
   - Add coping capacity notes

5. **Select Actors**
   - Check boxes for responsible agencies
   - Each actor gets role-specific directives

6. **Issue Warning or Request Revision**
   - Issue: Creates formal warning (logged to audit)
   - Revise: Sends back to institution for clarification

## Testing Features

### Simulation Mode
- Toggle "Simulation Mode" in header
- Submit test scenarios without affecting production
- Same validation and workflow as live mode
- Useful for training and testing

### Mock Data
- System provides mock Tanzania risk data if file not available
- All 39 districts included
- Mock hazard exposure and vulnerability scores

## Tips & Best Practices

### For Hazard Input
✓ Use map selection for visual clarity
✓ Provide specific temporal validity (not all-day)
✓ Include notes explaining your assessment
✓ Test in simulation mode first

### For PMO Validation
✓ Review affected population estimates
✓ Check INFORM risk scores for context
✓ Document all assessment decisions
✓ Assign actors appropriate to hazard type
✓ Use revision requests for incomplete data

## Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Submit Form | Enter (when button focused) |
| Switch Tab | Click tab or use arrow keys |
| Escape Modal | Esc key |

## Common Tasks

### How to Change District Selection?
- **Map view**: Click district again to toggle or change level
- **Form view**: Use checkboxes to select/deselect

### How to Change Warning Level?
1. Click new warning level card (Advisory/Warning/Major)
2. Select affected districts with new level
3. Different districts can have different levels

### How to Undo Form Changes?
- Click "Clear Form" button to reset all fields
- **Note**: Already submitted hazards cannot be undone (request revision instead)

### How to Export Warnings?
- System logs all actions to audit trail
- Future enhancement: Direct PDF/CSV export buttons

### How to View Submitted Hazards?
- Submitted hazards appear in PMO Dashboard tab
- "Hazards Pending Review" section shows count badge
- Click hazard to view details

## Troubleshooting

### "Risk data not loaded"
- Check console for errors
- Verify Excel file path or API endpoint
- System will use mock data as fallback

### Districts not appearing on map
- Refresh page (Ctrl+F5 or Cmd+Shift+R)
- Check browser console for JavaScript errors
- Ensure all assets loaded correctly

### Forms not submitting
- Verify at least one district is selected
- Check console for validation errors
- Try in simulation mode first

### Audit logging not working
- Ensure auditService is properly imported
- Check browser console for service errors
- Verify audit service configuration

## System Permissions

### Hazard Input Tab
- TMA users: Can input meteorological hazards only
- MOW users: Can input water/flood hazards only
- MOH users: Can input health hazards only
- MOA users: Can input agricultural hazards only
- GST users: Can input seismic hazards only
- PMO users: Can input for any institution (for data completion)

### PMO Dashboard Tab
- PMO-DMD users: Full access (review, assess, issue, revise)
- Institutional users: View-only access to issued warnings
- Other users: No access (authentication required)

## System Limits

- **Max districts**: 100+ supported (all 39 Tanzania districts included)
- **Max hazards pending**: Unlimited (performance tested to 1000+)
- **Max character notes**: 5000 characters
- **File upload**: Max 10MB per attachment

## Reporting Issues

1. **Check simulation mode first** - reproduce issue there
2. **Gather details**:
   - Browser (Chrome, Firefox, Safari, Edge)
   - Steps to reproduce
   - Error messages from console
   - Screenshots
3. **Report to**: [Contact information]

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore sample workflow in [WORKFLOW.md](WORKFLOW.md)
- Review data configuration in [data/](data/)
- Check service functions in [services/](services/)

---

**Version**: 1.0.0
**Last Updated**: 2026-03-21
**Status**: Ready for Deployment
