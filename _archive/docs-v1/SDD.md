# Software Design Document (SDD)
## INFORM Tanzania Early Warning System

### Document Information
- **Version:** 1.0.0
- **Date:** December 2024
- **Status:** Approved
- **Classification:** Internal

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Component Design](#3-component-design)
4. [Data Design](#4-data-design)
5. [Interface Design](#5-interface-design)
6. [Security Design](#6-security-design)
7. [Deployment Design](#7-deployment-design)

---

## 1. Introduction

### 1.1 Purpose

This Software Design Document (SDD) describes the architecture and design of the INFORM Tanzania Early Warning System. It provides a comprehensive overview of the system structure, components, interfaces, and data models.

### 1.2 Scope

This document covers:
- System architecture and technology stack
- Component breakdown and responsibilities
- Data models and database design
- API and interface specifications
- Security architecture
- Deployment strategy

### 1.3 Design Goals

1. **Modularity:** Components should be loosely coupled and independently deployable
2. **Scalability:** System should handle growth in users and data
3. **Maintainability:** Code should be clean, documented, and testable
4. **Security:** Role-based access with audit trails
5. **Performance:** Fast response times even on low-bandwidth connections

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Mobile     │  │   API Client │          │
│  │   (React)    │  │   (Future)   │  │   (Future)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React Application                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │   │
│  │  │  Auth   │ │  Risk   │ │ Warning │ │  Data   │        │   │
│  │  │ Module  │ │ Module  │ │ Module  │ │   Hub   │        │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Auth   │ │Database │ │ Report  │ │Analytics│ │  Audit  │  │
│  │ Service │ │ Service │ │ Service │ │ Service │ │ Service │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   IndexedDB  │  │   GeoJSON    │  │  Local       │          │
│  │   (Browser)  │  │   Files      │  │  Storage     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18.x | UI components and state management |
| Build | Vite | Fast development and production builds |
| Styling | CSS3 | Custom design system |
| Maps | Leaflet + GeoJSON | Interactive map visualization |
| Charts | Recharts | Data visualization |
| Storage | IndexedDB | Client-side database |
| State | React Context | Global state management |

### 2.3 Directory Structure

```
src/
├── components/              # React components
│   ├── admin/              # Admin panel components
│   │   ├── DataManagementHub.jsx
│   │   ├── DatabasePanel.jsx
│   │   └── tabs/           # Tab components
│   ├── auth/               # Authentication components
│   │   ├── Login.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── UserProfile.jsx
│   ├── dashboard/          # Dashboard components
│   │   └── InstitutionDashboard.jsx
│   ├── inform-risk/        # Risk module (Module 02)
│   │   ├── Module02InformRisk.jsx
│   │   └── dimensions/
│   ├── landing/            # Education module (Module 01)
│   │   ├── Module01Landing.jsx
│   │   └── sections/
│   ├── navigation/         # Navigation components
│   │   └── Sidebar.jsx
│   └── warning/            # Warning module (Module 03)
│       ├── Module03WarningSystem.jsx
│       ├── components/
│       ├── data/
│       └── layers/
├── context/                # React contexts
│   └── AuthContext.jsx
├── contexts/               # Additional contexts
│   ├── DatabaseContext.jsx
│   └── LanguageContext.jsx
├── database/               # Database layer
│   ├── databaseService.js
│   ├── schema.js
│   └── seedData.js
├── hooks/                  # Custom React hooks
│   └── useDatabase.js
├── services/               # Service layer
│   ├── authService.js
│   ├── analyticsService.js
│   ├── auditService.js
│   ├── reportGenerationService.js
│   └── smsService.js
├── App.jsx                 # Root component
├── App.css                 # Global styles
└── main.jsx                # Application entry
```

---

## 3. Component Design

### 3.1 Authentication Components

#### 3.1.1 AuthContext

```javascript
// Context Structure
{
  user: {
    id: string,
    email: string,
    name: string,
    role: 'admin' | 'pmo_officer' | 'regional_officer' | 'institution_user' | 'public_user',
    institution?: string,
    region?: string
  },
  loading: boolean,
  login: (email, password, rememberMe, institution) => Promise,
  logout: () => void,
  hasRole: (role) => boolean,
  hasPermission: (permission) => boolean
}
```

#### 3.1.2 Login Component

```
┌─────────────────────────────────────┐
│            INFORM Tanzania          │
│         Early Warning System        │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ Email                         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Password                      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Institution (dropdown)        │  │
│  └───────────────────────────────┘  │
│                                     │
│  [✓] Remember me                    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │          Sign In              │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 3.2 Data Management Hub

#### 3.2.1 Component Hierarchy

```
DataManagementHub
├── Header (role display, institution badge)
├── TabNavigation
│   ├── Overview Tab
│   ├── Data Entry Tab (InstitutionDataEntry)
│   ├── Regional Tab (RegionalDataView)
│   ├── Submissions Tab
│   ├── Review Tab (PMOReviewPanel)
│   ├── Indicators Tab (INFORMIndicators)
│   ├── Upload Tab (DataUploadWizard)
│   ├── Reports Tab
│   ├── Export Tab
│   └── Audit Tab
└── Content Area
```

#### 3.2.2 Role-Based Tab Visibility

```javascript
const tabAccess = {
  overview: ['admin', 'pmo_officer', 'regional_officer', 'institution_user'],
  'data-entry': ['regional_officer', 'institution_user'],
  'regional-data': ['admin', 'pmo_officer', 'regional_officer'],
  submissions: ['admin', 'pmo_officer'],
  review: ['admin', 'pmo_officer'],
  indicators: ['admin', 'pmo_officer', 'regional_officer', 'institution_user'],
  upload: ['admin', 'pmo_officer', 'institution_user'],
  reports: ['admin', 'pmo_officer', 'regional_officer', 'institution_user'],
  export: ['admin', 'pmo_officer'],
  audit: ['admin', 'pmo_officer']
};
```

### 3.3 Warning System Components

#### 3.3.1 Four-Layer Architecture

```
Layer 1: Hazard Input (Layer1HazardInput.jsx)
├── Institution-specific hazard forms
├── Severity and probability inputs
├── Geographic selection
└── Submission to Layer 2

Layer 2: Risk Analysis (Layer2RiskAnalysis.jsx)
├── Automated risk calculation
├── Vulnerability overlay
├── Exposure assessment
└── Risk index generation

Layer 3: Warning Logic (Layer3WarningLogic.jsx)
├── Warning threshold evaluation
├── Impact assessment
├── Recommended actions
└── Warning level determination

Layer 4: PMO Dashboard (Layer4PMODashboard.jsx)
├── Warning consolidation
├── Bulletin generation
├── Distribution management
└── Archive and tracking
```

### 3.4 Risk Module Components

#### 3.4.1 INFORM Dimensions

```
Module02InformRisk
├── DimensionSelector
├── HazardExposureDimension
│   ├── NaturalHazards
│   └── HumanHazards
├── VulnerabilityDimension
│   ├── SocioEconomic
│   └── VulnerableGroups
├── CopingCapacityDimension
│   ├── Infrastructure
│   └── Institutional
└── RiskVisualization
    ├── RegionalMap
    ├── IndicatorCharts
    └── ComparisonView
```

---

## 4. Data Design

### 4.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Users     │     │ Institutions │     │   Regions    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ email        │     │ name         │     │ adm1_name    │
│ password_hash│     │ shortName    │     │ adm1_code    │
│ name         │     │ hazardTypes  │     │ population   │
│ role         │────▶│ icon         │     │ area_km2     │
│ institution  │     └──────────────┘     └──────────────┘
│ region       │                                 │
└──────────────┘                                 │
       │                                         ▼
       │         ┌──────────────┐     ┌──────────────┐
       │         │  Submissions │     │  Districts   │
       │         ├──────────────┤     ├──────────────┤
       └────────▶│ id           │     │ id           │
                 │ institution  │     │ adm2_name    │
                 │ hazardType   │     │ adm2_code    │
                 │ region       │     │ adm1_name    │
                 │ status       │     │ population   │
                 │ submittedBy  │     └──────────────┘
                 │ submittedAt  │
                 │ reviewedBy   │
                 │ reviewedAt   │
                 └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   RiskData   │     │  Indicators  │     │   Warnings   │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ admin_unit   │     │ dimension    │     │ hazardType   │
│ year         │     │ category     │     │ severity     │
│ hazard_exp   │     │ name         │     │ affectedAreas│
│ vulnerability│     │ value        │     │ issuedBy     │
│ coping_cap   │     │ source       │     │ issuedAt     │
│ risk_index   │     │ weight       │     │ status       │
│ risk_class   │     └──────────────┘     │ bulletin     │
└──────────────┘                          └──────────────┘
```

### 4.2 Data Models

#### 4.2.1 User Model

```javascript
const UserSchema = {
  id: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: true }, // Hashed
  name: { type: 'string', required: true },
  role: {
    type: 'enum',
    values: ['admin', 'pmo_officer', 'regional_officer', 'institution_user', 'public_user'],
    required: true
  },
  institution: { type: 'string', required: false }, // For institution_user
  region: { type: 'string', required: false }, // For regional_officer
  department: { type: 'string', required: false },
  phone: { type: 'string', required: false },
  createdAt: { type: 'date', required: true },
  lastLogin: { type: 'date', required: false }
};
```

#### 4.2.2 Risk Data Model

```javascript
const RiskDataSchema = {
  id: { type: 'string', required: true },
  admin_unit_id: { type: 'string', required: true }, // Region or district code
  admin_level: { type: 'enum', values: ['region', 'district'], required: true },
  year: { type: 'number', required: true },
  hazard_exposure_total: { type: 'number', min: 0, max: 10 },
  vulnerability_total: { type: 'number', min: 0, max: 10 },
  lack_coping_capacity_total: { type: 'number', min: 0, max: 10 },
  risk_index: { type: 'number', min: 0, max: 10 },
  risk_class: {
    type: 'enum',
    values: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
  },
  indicators: { type: 'object' }, // Detailed indicator values
  updatedAt: { type: 'date', required: true },
  updatedBy: { type: 'string', required: false }
};
```

#### 4.2.3 Submission Model

```javascript
const SubmissionSchema = {
  id: { type: 'string', required: true },
  institution: { type: 'string', required: true },
  type: { type: 'string', required: true },
  hazardType: { type: 'string', required: true },
  region: { type: 'string', required: true },
  district: { type: 'string', required: false },
  severity: { type: 'enum', values: ['low', 'moderate', 'high', 'severe', 'extreme'] },
  probability: { type: 'number', min: 0, max: 100 },
  startDate: { type: 'date', required: false },
  endDate: { type: 'date', required: false },
  description: { type: 'string', required: true },
  dataSource: { type: 'string', required: false },
  confidence: { type: 'enum', values: ['low', 'medium', 'high'] },
  status: {
    type: 'enum',
    values: ['draft', 'pending', 'under_review', 'approved', 'rejected', 'published'],
    required: true
  },
  submittedBy: { type: 'string', required: true },
  submittedAt: { type: 'date', required: true },
  reviewedBy: { type: 'string', required: false },
  reviewedAt: { type: 'date', required: false },
  reviewComment: { type: 'string', required: false }
};
```

### 4.3 INFORM Indicator Structure

```javascript
const INFORMStructure = {
  dimensions: [
    {
      id: 'hazard_exposure',
      name: 'Hazard & Exposure',
      weight: 0.333,
      categories: [
        {
          id: 'natural',
          name: 'Natural Hazards',
          indicators: [
            { id: 'drought', name: 'Drought Probability', source: 'TMA' },
            { id: 'flood', name: 'Flood Probability', source: 'TMA/MOW' },
            { id: 'earthquake', name: 'Earthquake Intensity', source: 'GST' },
            { id: 'cyclone', name: 'Tropical Cyclone', source: 'TMA' }
          ]
        },
        {
          id: 'human',
          name: 'Human Hazards',
          indicators: [
            { id: 'conflict', name: 'Current Conflict', source: 'Internal' },
            { id: 'violence', name: 'Projected Violence', source: 'Internal' }
          ]
        }
      ]
    },
    {
      id: 'vulnerability',
      name: 'Vulnerability',
      weight: 0.333,
      categories: [
        {
          id: 'socioeconomic',
          name: 'Socio-Economic',
          indicators: [
            { id: 'poverty', name: 'Development & Deprivation', source: 'NBS' },
            { id: 'inequality', name: 'Inequality', source: 'NBS' },
            { id: 'aid_dependency', name: 'Aid Dependency', source: 'BoT' }
          ]
        },
        {
          id: 'vulnerable_groups',
          name: 'Vulnerable Groups',
          indicators: [
            { id: 'uprooted', name: 'Uprooted People', source: 'UNHCR' },
            { id: 'health', name: 'Health Conditions', source: 'MOH' },
            { id: 'children', name: 'Children U5', source: 'NBS' },
            { id: 'food_security', name: 'Food Security', source: 'MOA' }
          ]
        }
      ]
    },
    {
      id: 'coping_capacity',
      name: 'Lack of Coping Capacity',
      weight: 0.333,
      categories: [
        {
          id: 'infrastructure',
          name: 'Infrastructure',
          indicators: [
            { id: 'communication', name: 'Communication', source: 'TCRA' },
            { id: 'health_infra', name: 'Physical Health', source: 'MOH' },
            { id: 'healthcare_access', name: 'Access to Healthcare', source: 'MOH' }
          ]
        },
        {
          id: 'institutional',
          name: 'Institutional',
          indicators: [
            { id: 'drr', name: 'DRR Capacity', source: 'PMO-DMD' },
            { id: 'governance', name: 'Governance', source: 'Internal' }
          ]
        }
      ]
    }
  ]
};
```

---

## 5. Interface Design

### 5.1 Service Layer APIs

#### 5.1.1 AuthService

```javascript
// authService.js API
{
  login(email, password, rememberMe, institution): Promise<{success, user, error}>
  logout(): void
  getCurrentUser(): User | null
  isAuthenticated(): boolean
  hasRole(role): boolean
  hasPermission(permission): boolean
  refreshSession(): void
}
```

#### 5.1.2 DatabaseService

```javascript
// databaseService.js API
{
  // Region/District
  getRegions(): Region[]
  getDistricts(): District[]
  getDistrictsByRegion(regionName): District[]

  // Risk Data
  getAllRiskData(year): RiskData[]
  getRiskDataByRegion(region, year): RiskData
  calculateRiskIndex(hazard, vulnerability, coping): number

  // Submissions
  createSubmission(data): Promise<Submission>
  getSubmissions(filter): Submission[]
  updateSubmissionStatus(id, status, comment): Promise<void>

  // Health
  getDatabaseHealth(): HealthStatus
  refreshStats(): void
}
```

#### 5.1.3 ReportService

```javascript
// reportGenerationService.js API
{
  generateWarningBulletin(warningData): Promise<Blob>
  generateRiskReport(region, year): Promise<Blob>
  generatePDF(content, options): Promise<Blob>
  generateImage(element, options): Promise<Blob>
  exportToExcel(data, columns): Promise<Blob>
  exportToCSV(data, columns): string
}
```

### 5.2 Component Props Interfaces

```typescript
// TypeScript-style interface definitions

interface DataManagementHubProps {
  // No props - uses context
}

interface InstitutionDataEntryProps {
  user: User;
}

interface RegionalDataViewProps {
  user: User;
  regions: Region[];
  districts: District[];
}

interface PMOReviewPanelProps {
  user: User;
  submissions: Submission[];
  onRefresh: () => void;
}

interface INFORMIndicatorsProps {
  user: User;
  riskData: RiskData[];
}

interface DataUploadWizardProps {
  user: User;
  onUploadComplete: () => void;
}
```

---

## 6. Security Design

### 6.1 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │  Login   │     │   Auth   │     │ Session  │
│          │     │  Form    │     │ Service  │     │ Storage  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Enter creds    │                │                │
     │───────────────▶│                │                │
     │                │ Validate       │                │
     │                │───────────────▶│                │
     │                │                │ Check user     │
     │                │                │───────────────▶│
     │                │                │◀───────────────│
     │                │                │                │
     │                │ Return token   │                │
     │                │◀───────────────│                │
     │                │                │ Store session  │
     │                │                │───────────────▶│
     │ Redirect       │                │                │
     │◀───────────────│                │                │
```

### 6.2 Role Permission Matrix

```javascript
const ROLE_PERMISSIONS = {
  admin: {
    canManageUsers: true,
    canIssueWarnings: true,
    canViewAllData: true,
    canExportReports: true,
    canEditSystemSettings: true,
    canAccessAllModules: true
  },
  pmo_officer: {
    canManageUsers: false,
    canIssueWarnings: true,
    canViewAllData: true,
    canExportReports: true,
    canEditSystemSettings: false,
    canAccessAllModules: true
  },
  regional_officer: {
    canManageUsers: false,
    canIssueWarnings: false,
    canViewAllData: false, // Only their region
    canExportReports: true,
    canEditSystemSettings: false,
    canAccessAllModules: false
  },
  institution_user: {
    canManageUsers: false,
    canIssueWarnings: false,
    canSubmitHazardInput: true,
    canViewAllData: false, // Only their institution
    canExportReports: true,
    canEditSystemSettings: false,
    canAccessAllModules: false,
    canReceivePMORequests: true,
    canHandleRollbacks: true
  },
  public_user: {
    canManageUsers: false,
    canIssueWarnings: false,
    canViewAllData: false,
    canExportReports: false,
    canEditSystemSettings: false,
    canAccessAllModules: false
  }
};
```

### 6.3 Session Management

```javascript
// Session configuration
const SESSION_CONFIG = {
  timeout: 30 * 60 * 1000, // 30 minutes
  refreshThreshold: 5 * 60 * 1000, // Refresh if < 5 min remaining
  storage: 'sessionStorage', // or 'localStorage' with remember me
  tokenKey: 'inform_session',
  userKey: 'inform_user'
};
```

---

## 7. Deployment Design

### 7.1 Development Environment

```bash
# Development setup
npm install
npm run dev

# Environment variables
VITE_API_URL=http://localhost:3000
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### 7.2 Production Build

```bash
# Build for production
npm run build

# Output directory structure
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── geojson/
    ├── Regions.geojson
    └── Districts_GIS.geojson
```

### 7.3 Deployment Architecture (Planned)

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER                            │
│                    (NGINX / Cloud LB)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Web Server   │ │    Web Server   │ │    Web Server   │
│    (NGINX)      │ │    (NGINX)      │ │    (NGINX)      │
│   Static Files  │ │   Static Files  │ │   Static Files  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API SERVER                                │
│                    (Node.js / Express)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│       DATABASE          │     │      FILE STORAGE       │
│     (PostgreSQL)        │     │    (Object Storage)     │
└─────────────────────────┘     └─────────────────────────┘
```

### 7.4 Environment Configuration

| Environment | URL | Database | Features |
|-------------|-----|----------|----------|
| Development | localhost:5173 | IndexedDB | Hot reload, debug |
| Staging | staging.inform.go.tz | PostgreSQL | Testing, UAT |
| Production | inform.go.tz | PostgreSQL | Full security |

---

*End of Software Design Document*
