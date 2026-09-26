# Implementation Guide
## INFORM Tanzania Early Warning System

### Document Information
- **Version:** 1.0.0
- **Date:** December 2024
- **Status:** Current Implementation

---

## Table of Contents

1. [Implementation Summary](#1-implementation-summary)
2. [Completed Features](#2-completed-features)
3. [File Structure](#3-file-structure)
4. [Component Details](#4-component-details)
5. [Services Implementation](#5-services-implementation)
6. [Database Implementation](#6-database-implementation)
7. [Configuration](#7-configuration)

---

## 1. Implementation Summary

### 1.1 Project Statistics

| Metric | Count |
|--------|-------|
| Total Files | 102+ |
| React Components | 45+ |
| Service Modules | 10+ |
| Lines of Code | 90,000+ |
| CSS Stylesheets | 20+ |

### 1.2 Implementation Timeline

| Phase | Description | Status | Date |
|-------|-------------|--------|------|
| Core Setup | Project initialization, routing | Complete | Nov 2024 |
| Module 01 | Education/Landing module | Complete | Nov 2024 |
| Module 02 | INFORM Risk module | Complete | Nov 2024 |
| Module 03 | Warning System (4 layers) | Complete | Dec 2024 |
| Authentication | Role-based login system | Complete | Dec 2024 |
| Data Hub | Central data management | Complete | Dec 2024 |
| Maps | Interactive Tanzania maps | Complete | Dec 2024 |
| Reports | PDF/Image export | Complete | Dec 2024 |

---

## 2. Completed Features

### 2.1 Authentication System

**Files:**
- `src/context/AuthContext.jsx` - Authentication context provider
- `src/services/authService.js` - Authentication service
- `src/components/auth/Login.jsx` - Login page
- `src/components/auth/ProtectedRoute.jsx` - Route protection
- `src/components/auth/UserProfile.jsx` - User profile page
- `src/components/auth/Auth.css` - Authentication styles

**Features Implemented:**
- Email/password authentication
- Institution-based login (TMA, MoW, MoH, MoA, GST)
- Role-based access control (5 roles)
- Session management with timeout
- Remember me functionality
- Protected route wrapper

**User Credentials (Development):**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pmo.go.tz | Inform@Admin2025 |
| PMO Officer | emmanuel.lymo@pmo.go.tz | Inform@PMO2025 |
| Regional Officer | regional@dodoma.go.tz | Inform@Regional2025 |
| TMA | tma@tma.go.tz | Inform@TMA2025 |
| MoW | mow@mow.go.tz | Inform@MOW2025 |
| MoH | moh@moh.go.tz | Inform@MOH2025 |
| MoA | moa@moa.go.tz | Inform@MOA2025 |
| GST | gst@gst.go.tz | Inform@GST2025 |

### 2.2 Data Management Hub

**Files:**
- `src/components/admin/DataManagementHub.jsx` - Main hub component
- `src/components/admin/DataManagementHub.css` - Hub styles
- `src/components/admin/tabs/InstitutionDataEntry.jsx` - Data entry
- `src/components/admin/tabs/RegionalDataView.jsx` - Regional view
- `src/components/admin/tabs/PMOReviewPanel.jsx` - Review workflow
- `src/components/admin/tabs/INFORMIndicators.jsx` - Indicators
- `src/components/admin/tabs/DataUploadWizard.jsx` - Upload wizard
- `src/components/admin/tabs/TabStyles.css` - Shared tab styles

**Features Implemented:**
- Role-based tab visibility
- Institution data entry with drafts
- Regional data view with indicators
- PMO review and approval workflow
- INFORM indicator management
- Excel/CSV upload wizard
- Export and backup functionality
- Audit log display

### 2.3 Warning System (Module 03)

**Files:**
- `src/components/warning/Module03WarningSystem.jsx` - Main module
- `src/components/warning/layers/Layer1HazardInput.jsx` - Layer 1
- `src/components/warning/layers/Layer2RiskAnalysis.jsx` - Layer 2
- `src/components/warning/layers/Layer3WarningLogic.jsx` - Layer 3
- `src/components/warning/layers/Layer4PMODashboard.jsx` - Layer 4
- `src/components/warning/components/InteractiveHazardMap.jsx` - Map
- `src/components/warning/components/AnalyticsDashboard.jsx` - Analytics
- `src/components/warning/components/ReportExportButton.jsx` - Export

**Features Implemented:**
- 4-layer warning workflow
- Institution-specific hazard input
- Institution locking (one institution per login)
- Risk analysis with INFORM integration
- Warning threshold logic
- PMO consolidation dashboard
- Warning bulletin generation
- Interactive hazard map
- Analytics dashboard

### 2.4 Risk Module (Module 02)

**Files:**
- `src/components/inform-risk/Module02InformRisk.jsx` - Main module
- `src/components/inform-risk/dimensions/HazardExposureDimension.jsx`
- `src/components/inform-risk/dimensions/VulnerabilityDimension.jsx`
- `src/components/inform-risk/dimensions/CopingCapacityDimension.jsx`
- `src/components/inform-risk/mockData.js` - Risk data

**Features Implemented:**
- Three-dimension INFORM display
- Indicator breakdown views
- Regional comparison
- Risk visualization
- Interactive charts

### 2.5 Education Module (Module 01)

**Files:**
- `src/components/landing/Module01Landing.jsx` - Main module
- `src/components/landing/sections/Section1Hazard.jsx`
- Additional section components

**Features Implemented:**
- INFORM methodology training
- Interactive learning sections
- Navigation between sections

### 2.6 Institution Dashboard

**Files:**
- `src/components/dashboard/InstitutionDashboard.jsx` - Dashboard

**Features Implemented:**
- Institution-specific view
- Embedded Layer1HazardInput
- Data filtered by institution
- Submission tracking

### 2.7 Navigation

**Files:**
- `src/components/navigation/Sidebar.jsx` - Sidebar navigation
- `src/components/navigation/Sidebar.css` - Sidebar styles

**Features Implemented:**
- Collapsible sidebar
- Module navigation
- Data views section
- Tools section (Analytics, Dashboard, Data Hub)
- User profile display
- Role indicator
- Language switcher

### 2.8 Maps and GeoJSON

**Files:**
- `public/geojson/Regions.geojson` - Tanzania regions
- `public/geojson/Districts_GIS.geojson` - Districts
- `public/geojson/Tanzania_Country.geojson` - Country boundary
- `public/geojson/Water_Body.geojson` - Water bodies

**Features Implemented:**
- Interactive Leaflet maps
- Region choropleth coloring
- District-level display
- Click/hover interactions
- Layer controls

### 2.9 Report Generation

**Files:**
- `src/services/reportGenerationService.js` - Report service

**Features Implemented:**
- PDF warning bulletins
- Image export (PNG)
- Map capture
- Professional formatting
- PMO contact information

---

## 3. File Structure

```
masuby-model/
├── docs/                           # Documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── SRS.md
│   ├── SDD.md
│   ├── IMPLEMENTATION.md
│   ├── ROADMAP.md
│   └── USER_MANUAL.md
├── public/
│   ├── geojson/                    # Map data
│   │   ├── Regions.geojson
│   │   ├── Districts_GIS.geojson
│   │   └── ...
│   ├── tmalogo.png
│   └── urt-coat-of-arms.jpeg
├── scripts/                        # Build scripts
│   ├── convertShapefile.cjs
│   └── clipBoundary.cjs
├── src/
│   ├── components/
│   │   ├── admin/                  # Admin components
│   │   │   ├── DataManagementHub.jsx
│   │   │   ├── DatabasePanel.jsx
│   │   │   └── tabs/
│   │   ├── auth/                   # Auth components
│   │   │   ├── Login.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── UserProfile.jsx
│   │   ├── dashboard/              # Dashboard
│   │   │   └── InstitutionDashboard.jsx
│   │   ├── inform-risk/            # Module 02
│   │   │   ├── Module02InformRisk.jsx
│   │   │   └── dimensions/
│   │   ├── landing/                # Module 01
│   │   │   ├── Module01Landing.jsx
│   │   │   └── sections/
│   │   ├── navigation/             # Navigation
│   │   │   └── Sidebar.jsx
│   │   ├── severity/               # Module 04 (placeholder)
│   │   ├── climate/                # Module 05 (placeholder)
│   │   └── warning/                # Module 03
│   │       ├── Module03WarningSystem.jsx
│   │       ├── components/
│   │       ├── data/
│   │       └── layers/
│   ├── context/                    # React contexts
│   │   └── AuthContext.jsx
│   ├── contexts/                   # Additional contexts
│   │   ├── DatabaseContext.jsx
│   │   └── LanguageContext.jsx
│   ├── database/                   # Database layer
│   │   ├── databaseService.js
│   │   ├── schema.js
│   │   └── seedData.js
│   ├── hooks/                      # Custom hooks
│   │   └── useDatabase.js
│   ├── services/                   # Service layer
│   │   ├── authService.js
│   │   ├── analyticsService.js
│   │   ├── auditService.js
│   │   ├── reportGenerationService.js
│   │   └── smsService.js
│   ├── App.jsx                     # Root component
│   ├── App.css                     # Global styles
│   └── main.jsx                    # Entry point
├── package.json
├── vite.config.js
└── README.md
```

---

## 4. Component Details

### 4.1 App.jsx - Root Component

```javascript
// Key routes implemented
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/institution-dashboard" element={<InstitutionDashboard />} />
  <Route path="/*" element={<MainApp />} />
</Routes>

// Main app views
switch (currentView) {
  case 'dashboard': return <Dashboard />;
  case 'module01': return <Module01Landing />;
  case 'module02': return <Module02InformRisk />;
  case 'module03': return <Module03WarningSystem />;
  case 'database': return <DataManagementHub />;
  case 'analytics': return <AnalyticsDashboard />;
  // ...
}
```

### 4.2 DataManagementHub.jsx - Central Hub

```javascript
// Role-based tabs
const getTabs = () => {
  const tabs = [];

  // Dashboard - All roles
  tabs.push({ id: 'overview', label: 'Dashboard' });

  // Data Entry - Institutions, Regional
  if (role === 'institution_user' || role === 'regional_officer') {
    tabs.push({ id: 'data-entry', label: 'My Data Entry' });
  }

  // Regional - Admin, PMO, Regional
  if (['admin', 'pmo_officer', 'regional_officer'].includes(role)) {
    tabs.push({ id: 'regional-data', label: 'Regional Data' });
  }

  // Review - Admin, PMO only
  if (['admin', 'pmo_officer'].includes(role)) {
    tabs.push({ id: 'review', label: 'Review & Approve' });
  }

  // ... more tabs
  return tabs;
};
```

### 4.3 Layer1HazardInput.jsx - Hazard Input

```javascript
// Institution locking
const getLockedInstitution = () => {
  if (user?.role === 'institution_user' && user.institution) {
    return user.institution;
  }
  return null;
};

// Institution-specific hazard types
const getHazardTypes = (institutionKey) => {
  const institution = INSTITUTIONS[institutionKey];
  return institution?.hazardTypes || [];
};
```

---

## 5. Services Implementation

### 5.1 authService.js

```javascript
// Key exports
export const USER_ROLES = {
  ADMIN: 'admin',
  PMO_OFFICER: 'pmo_officer',
  REGIONAL_OFFICER: 'regional_officer',
  INSTITUTION_USER: 'institution_user',
  PUBLIC_USER: 'public_user'
};

export const INSTITUTIONS = {
  TMA: { id: 'tma', name: 'Tanzania Meteorological Authority', ... },
  MOW: { id: 'mow', name: 'Ministry of Water', ... },
  MOH: { id: 'moh', name: 'Ministry of Health', ... },
  MOA: { id: 'moa', name: 'Ministry of Agriculture', ... },
  GST: { id: 'gst', name: 'Geological Survey of Tanzania', ... }
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: { canManageUsers: true, canIssueWarnings: true, ... },
  [USER_ROLES.PMO_OFFICER]: { canIssueWarnings: true, ... },
  // ...
};
```

### 5.2 databaseService.js

```javascript
// Core methods
class DatabaseService {
  getRegions() { /* Returns 31 regions */ }
  getDistricts() { /* Returns 184+ districts */ }
  getAllRiskData(year) { /* Returns risk data */ }
  calculateRiskIndex(hazard, vuln, coping) {
    return Math.pow(hazard * vuln * coping, 1/3);
  }
  getDatabaseHealth() { /* Returns health status */ }
}
```

### 5.3 reportGenerationService.js

```javascript
// Report generation
class ReportGenerator {
  async generateWarningBulletin(data) { /* PDF generation */ }
  async captureMap(mapElement) { /* Map screenshot */ }
  async generatePDF(content) { /* PDF export */ }
  async generateImage(element) { /* PNG export */ }
}
```

---

## 6. Database Implementation

### 6.1 Current Storage: IndexedDB

The current implementation uses browser-based IndexedDB for data storage, suitable for development and demonstration.

```javascript
// Database context provides
{
  isReady: boolean,
  isLoading: boolean,
  error: string,
  stats: object,
  getRegions: () => Region[],
  getDistricts: () => District[],
  getAllRiskData: (year) => RiskData[],
  getWarningStats: () => WarningStats,
  getDatabaseHealth: () => HealthStatus
}
```

### 6.2 Seed Data

Pre-populated data includes:
- 31 Tanzania regions with populations
- 184+ districts
- Sample risk indicators
- Mock submission data

### 6.3 Future: PostgreSQL Migration

Production will migrate to PostgreSQL with:
- Proper data persistence
- Multi-user support
- Backup and recovery
- API-based access

---

## 7. Configuration

### 7.1 package.json Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x",
    "leaflet": "^1.9.x",
    "react-leaflet": "^4.x",
    "recharts": "^2.x",
    "html2canvas": "^1.x",
    "jspdf": "^2.x"
  },
  "devDependencies": {
    "vite": "^7.x",
    "@vitejs/plugin-react": "^4.x"
  }
}
```

### 7.2 Vite Configuration

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

### 7.3 Running the Application

```bash
# Development
npm install
npm run dev

# Production build
npm run build

# Preview production
npm run preview
```

---

## 8. Known Issues and Limitations

### 8.1 Current Limitations

1. **Client-side storage:** Data stored in browser IndexedDB
2. **No real backend:** Mock data and local storage
3. **No SMS/Email:** Notification channels not connected
4. **Single language:** English only (Swahili pending)

### 8.2 Technical Debt

1. AuthContext HMR warning (export compatibility)
2. Some mock data hardcoded
3. Map performance on large datasets

### 8.3 Security Notes

- Passwords are stored in plain text in mock data
- Production requires proper hashing (bcrypt)
- JWT implementation needed for production
- HTTPS required for deployment

---

*End of Implementation Guide*
