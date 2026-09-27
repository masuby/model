# INFORM Tanzania - Report Generation System

## Overview

The INFORM Tanzania platform now includes comprehensive report generation capabilities with PDF and image export functionality. This system allows users to generate professional reports from various modules for distribution, documentation, and decision-making.

## Features

### 1. **Warning Bulletins (Module 03)**
- **Location**: PMO-DMD Dashboard → Warning Assessment Section
- **Format**: PDF, PNG
- **Content**:
  - Official government header with Tanzania branding
  - Warning level (Advisory, Warning, Major Warning)
  - Hazard information and severity
  - Affected districts
  - Impact assessment
  - Exposure, vulnerability, and capacity analysis
  - Public advisory actions
  - Institutional directives for registered actors
  - Contact information and bulletin numbering

### 2. **Risk Assessment Reports (Module 02)**
- **Location**: INFORM Risk Module → Header Section
- **Format**: PDF, PNG
- **Content**:
  - National risk profile with overall risk score
  - INFORM formula breakdown (H and E × V × LCC)
  - Dimension scores (Hazard & Exposure, Vulnerability, Lack of Coping Capacity)
  - District risk distribution by category
  - Top 10 highest risk districts
  - Risk classification and ranges

## Technical Implementation

### Libraries Used
- **jsPDF**: PDF document generation
- **html2canvas**: High-quality screenshots for image export

### Core Components

#### 1. Report Generation Service
**File**: `src/services/reportGenerationService.js`

Functions:
- `generatePDFFromElement(element, filename, options)`: Converts any DOM element to PDF
- `exportAsImage(element, filename, options)`: Exports any DOM element as PNG
- `generateWarningBulletinPDF(warningData, riskData)`: Creates structured warning bulletins
- `generateRiskAssessmentPDF(riskData, districtName)`: Creates risk assessment reports

#### 2. Report Export Button Component
**File**: `src/components/warning/components/ReportExportButton.jsx`

Props:
- `reportType`: 'warning', 'risk', or 'custom'
- `reportData`: Data object for the report
- `elementId`: (Optional) DOM element ID for custom exports
- `buttonStyle`: 'primary', 'secondary', or 'compact'
- `buttonText`: Button label
- `disabled`: Boolean to disable the button
- `onExportComplete`: Callback after successful export

## Usage

### Exporting a Warning Bulletin

1. Navigate to **Module 03 - Early Warning System**
2. Go to **PMO-DMD Dashboard** tab
3. Select a hazard for review
4. Complete the assessment:
   - Select impact level
   - Choose final statement (Advisory/Warning/Major Warning)
   - Add exposure, vulnerability, and capacity notes
   - Select institutional actors
5. Click **"Export Warning Bulletin"**
6. Choose format:
   - **PDF Document**: Professional report format
   - **PNG Image**: High-quality screenshot

### Exporting a Risk Assessment

1. Navigate to **Module 02 - INFORM Risk**
2. Click **"Export Risk Report"** in the header section
3. Choose format:
   - **PDF Document**: Comprehensive risk analysis
   - **PNG Image**: Visual snapshot

## Report Formats

### Warning Bulletin PDF Structure

```
┌─────────────────────────────────────────┐
│ UNITED REPUBLIC OF TANZANIA             │
│ Prime Minister's Office                 │
│ Disaster Management Department          │
├─────────────────────────────────────────┤
│ ⚠️ WARNING LEVEL ⚠️                    │
├─────────────────────────────────────────┤
│ BULLETIN NO: PMO-DMD/2025/XXX          │
│ DATE: DD/MM/YYYY                        │
├─────────────────────────────────────────┤
│ HAZARD INFORMATION                      │
│ - Hazard Type                           │
│ - Reporting Institution                 │
│ - Severity                              │
├─────────────────────────────────────────┤
│ AFFECTED DISTRICTS                      │
│ - List of districts                     │
├─────────────────────────────────────────┤
│ IMPACT ASSESSMENT                       │
│ - Impact Level                          │
│ - Exposure Considerations               │
│ - Vulnerability Analysis                │
│ - Coping Capacity Assessment            │
├─────────────────────────────────────────┤
│ PUBLIC ADVISORY - ACTIONS TO TAKE       │
│ 1. Action 1                             │
│ 2. Action 2                             │
│ ...                                     │
├─────────────────────────────────────────┤
│ INSTITUTIONAL DIRECTIVES                │
│ - Actor 1: Actions                      │
│ - Actor 2: Actions                      │
│ ...                                     │
├─────────────────────────────────────────┤
│ CONTACT INFORMATION                     │
│ PMO - Disaster Management Department    │
│ Emergency: 112                          │
└─────────────────────────────────────────┘
```

### Risk Assessment PDF Structure

```
┌─────────────────────────────────────────┐
│ INFORM RISK ASSESSMENT REPORT           │
│ Tanzania National Risk Profile          │
├─────────────────────────────────────────┤
│ NATIONAL RISK PROFILE                   │
│ Overall Risk Score: X.XX                │
│ Risk Level: High / Medium / Low         │
├─────────────────────────────────────────┤
│ INFORM Risk Formula                     │
│ Risk = (H and E × V × LCC)^(1/3)       │
│                                         │
│ Hazard and Exposure (H and E): X.XX    │
│ Vulnerability (V): X.XX                 │
│ Lack of Coping Capacity (LCC): X.XX    │
├─────────────────────────────────────────┤
│ DISTRICT RISK DISTRIBUTION              │
│ Very High Risk: XX districts            │
│ High Risk: XX districts                 │
│ Medium Risk: XX districts               │
│ Low Risk: XX districts                  │
│ Very Low Risk: XX districts             │
├─────────────────────────────────────────┤
│ TOP 10 HIGHEST RISK DISTRICTS           │
│ 1. District Name: X.XX (Risk Level)    │
│ 2. District Name: X.XX (Risk Level)    │
│ ...                                     │
└─────────────────────────────────────────┘
```

## Customization

### Adding New Report Types

To add report generation to other modules:

```javascript
import ReportExportButton from '../warning/components/ReportExportButton';

<ReportExportButton
  reportType="custom"
  elementId="my-report-section"
  buttonStyle="primary"
  buttonText="Export My Report"
  onExportComplete={(format) => {
    console.log(`Report exported as ${format}`);
  }}
/>
```

### Custom PDF Generation

```javascript
import { generatePDFFromElement } from '../services/reportGenerationService';

const handleCustomExport = async () => {
  const element = document.getElementById('my-content');
  await generatePDFFromElement(element, 'custom_report', {
    html2canvasOptions: {
      scale: 2,
      backgroundColor: '#ffffff'
    }
  });
};
```

## File Naming Convention

Reports are automatically named with timestamps:
- Warning Bulletins: `Warning_Bulletin_[HazardType]_YYYY-MM-DD.pdf`
- Risk Assessments: `Risk_Assessment_Tanzania_YYYY-MM-DD.pdf`
- Images: `report_[timestamp].png`

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Future Enhancements

- [ ] Excel export for data tables
- [ ] Email integration for direct report distribution
- [ ] Automated scheduling for periodic reports
- [ ] Multi-language support (Swahili translations)
- [ ] Digital signatures for official documents
- [ ] QR code integration for verification
- [ ] Report templates customization UI

## Troubleshooting

### PDF Generation Fails
- **Issue**: PDF doesn't download
- **Solution**: Check browser popup blocker settings

### Image Export Blank
- **Issue**: Exported PNG is blank or incomplete
- **Solution**: Ensure the target element is fully rendered before export

### Large File Size
- **Issue**: PDF/PNG files are too large
- **Solution**: Reduce `scale` option in html2canvas (default: 2)

## Support

For issues or feature requests related to report generation:
1. Check the console for error messages
2. Verify all required data is available
3. Test in different browsers
4. Contact: info@pmo.go.tz

---

**Generated with INFORM Tanzania Platform**
*Prime Minister's Office - Disaster Management Department*
