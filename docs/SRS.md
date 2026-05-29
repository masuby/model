# Software Requirements Specification (SRS)
## INFORM Tanzania Early Warning System

### Document Information
- **Version:** 1.0.0
- **Date:** December 2024
- **Status:** Approved
- **Classification:** Internal

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [System Interfaces](#5-system-interfaces)
6. [Data Requirements](#6-data-requirements)
7. [Security Requirements](#7-security-requirements)
8. [Appendices](#8-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for the INFORM Tanzania Early Warning System. It serves as the primary reference for technical and non-technical stakeholders during the development, testing, and maintenance phases.

### 1.2 Scope

The INFORM Tanzania Early Warning System is a web-based application that:
- Calculates and displays disaster risk indices using the INFORM methodology
- Enables multi-hazard early warning generation
- Facilitates coordination between government institutions
- Provides role-based access to different stakeholders
- Generates reports and warning bulletins

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| INFORM | Index for Risk Management |
| PMO-DMD | Prime Minister's Office - Disaster Management Department |
| TMA | Tanzania Meteorological Authority |
| MoW | Ministry of Water |
| MoH | Ministry of Health |
| MoA | Ministry of Agriculture |
| GST | Geological Survey of Tanzania |
| H&E | Hazard and Exposure |
| V | Vulnerability |
| LCC | Lack of Coping Capacity |
| EWS | Early Warning System |

### 1.4 References

- INFORM Risk Index Methodology (OCHA/JRC)
- Tanzania National Disaster Risk Management Policy
- Sendai Framework for Disaster Risk Reduction

---

## 2. Overall Description

### 2.1 Product Perspective

The system operates as a standalone web application with future integration capabilities for:
- External weather APIs
- Government data systems
- SMS gateway services
- Email notification services

### 2.2 User Classes and Characteristics

#### 2.2.1 Administrator
- **Technical Level:** High
- **Access Frequency:** Daily
- **Responsibilities:** System configuration, user management, data backup

#### 2.2.2 PMO Officer
- **Technical Level:** Medium
- **Access Frequency:** Daily
- **Responsibilities:** Warning issuance, data approval, report generation

#### 2.2.3 Regional Officer
- **Technical Level:** Medium
- **Access Frequency:** Daily
- **Responsibilities:** Regional monitoring, local coordination

#### 2.2.4 Institution User
- **Technical Level:** Medium
- **Access Frequency:** Weekly/As needed
- **Responsibilities:** Hazard data submission, rollback handling

#### 2.2.5 Public User
- **Technical Level:** Low
- **Access Frequency:** As needed
- **Responsibilities:** View public warnings and information

### 2.3 Operating Environment

- **Client:** Modern web browsers (Chrome, Firefox, Safari, Edge)
- **Server:** Node.js runtime environment
- **Database:** PostgreSQL (production) / IndexedDB (development)
- **Network:** HTTPS required for all communications

### 2.4 Constraints

1. Must comply with Tanzania Government IT policies
2. Must support both English and Swahili languages
3. Must function on low-bandwidth connections
4. Must maintain data sovereignty (data stored in Tanzania)

---

## 3. Functional Requirements

### 3.1 Authentication and Authorization

#### FR-AUTH-001: User Login
- **Description:** System shall allow users to authenticate using email and password
- **Priority:** High
- **Input:** Email, Password, Institution (for institution users)
- **Output:** Authentication token, user session
- **Validation:** Email format, password complexity, institution verification

#### FR-AUTH-002: Role-Based Access Control
- **Description:** System shall restrict access based on user roles
- **Priority:** High
- **Roles:** Administrator, PMO Officer, Regional Officer, Institution User, Public User
- **Access Matrix:**

| Feature | Admin | PMO | Regional | Institution | Public |
|---------|-------|-----|----------|-------------|--------|
| User Management | Full | - | - | - | - |
| Issue Warnings | Full | Full | - | - | - |
| Submit Hazard Data | Full | Full | - | Full | - |
| View All Data | Full | Full | Region | Institution | Limited |
| Export Reports | Full | Full | Limited | Limited | - |
| System Settings | Full | - | - | - | - |

#### FR-AUTH-003: Session Management
- **Description:** System shall manage user sessions with timeout
- **Priority:** High
- **Timeout:** 30 minutes of inactivity
- **Behavior:** Automatic logout with warning, redirect to login

#### FR-AUTH-004: Institution-Based Authentication
- **Description:** Institution users must select their institution during login
- **Priority:** High
- **Institutions:** TMA, MoW, MoH, MoA, GST

### 3.2 Risk Assessment Module

#### FR-RISK-001: INFORM Risk Calculation
- **Description:** System shall calculate risk using INFORM methodology
- **Priority:** High
- **Formula:** `Risk = (H&E × V × LCC)^(1/3)`
- **Scale:** 0-10 (normalized)
- **Output:** Risk index, risk class (Very Low, Low, Medium, High, Very High)

#### FR-RISK-002: Three-Dimension Analysis
- **Description:** System shall display analysis for each INFORM dimension
- **Priority:** High
- **Dimensions:**
  - Hazard & Exposure: Natural hazards, human hazards, exposure
  - Vulnerability: Socio-economic, vulnerable groups
  - Lack of Coping Capacity: Infrastructure, institutional

#### FR-RISK-003: Regional Risk Visualization
- **Description:** System shall display risk data on interactive map
- **Priority:** High
- **Features:** Choropleth coloring, hover details, drill-down to districts

#### FR-RISK-004: Indicator Management
- **Description:** System shall manage 80+ INFORM indicators
- **Priority:** Medium
- **Operations:** View, edit (Admin/PMO), track changes

### 3.3 Data Management Hub

#### FR-DATA-001: Dashboard Overview
- **Description:** System shall display summary dashboard based on user role
- **Priority:** High
- **Content:** Statistics, recent submissions, health status, role-specific metrics

#### FR-DATA-002: Institution Data Entry
- **Description:** Institution users shall submit hazard data through forms
- **Priority:** High
- **Features:**
  - Hazard type selection (based on institution)
  - Location selection (region, district)
  - Severity and probability input
  - Date range specification
  - Description and source documentation
  - Draft save functionality
  - Submission history

#### FR-DATA-003: Regional Data View
- **Description:** Regional officers shall view data for their assigned region
- **Priority:** High
- **Features:**
  - Region statistics and indicators
  - District breakdown
  - Risk trend analysis
  - Submission tracking

#### FR-DATA-004: PMO Review Workflow
- **Description:** PMO officers shall review and approve data submissions
- **Priority:** High
- **States:** Pending → Under Review → Approved/Rejected → Published
- **Actions:** Approve, Reject (with comments), Request Revision, Publish

#### FR-DATA-005: Data Upload Wizard
- **Description:** System shall support bulk data upload via Excel/CSV
- **Priority:** Medium
- **Features:**
  - Template download
  - File upload with validation
  - Preview and confirmation
  - Error reporting

#### FR-DATA-006: Export and Backup
- **Description:** System shall export data in multiple formats
- **Priority:** Medium
- **Formats:** Excel, CSV, INFORM Template, JSON
- **Scope:** Full backup, filtered exports

#### FR-DATA-007: Audit Log
- **Description:** System shall maintain audit trail of all data operations
- **Priority:** High
- **Logged Events:** Login, data submission, approval, rejection, modification, deletion

### 3.4 Warning System

#### FR-WARN-001: Four-Layer Warning Workflow
- **Description:** System shall implement 4-layer warning process
- **Priority:** High
- **Layers:**
  1. Hazard Input (Institutions)
  2. Risk Analysis (Automated)
  3. Warning Logic (PMO)
  4. Consolidation & Issuance (PMO)

#### FR-WARN-002: Hazard Input Layer
- **Description:** Institutions shall input hazard forecasts and observations
- **Priority:** High
- **Data:** Hazard type, severity, probability, affected areas, time period

#### FR-WARN-003: Risk Analysis Layer
- **Description:** System shall automatically analyze risk based on inputs
- **Priority:** High
- **Analysis:** Combine hazard with vulnerability and coping capacity

#### FR-WARN-004: Warning Logic Layer
- **Description:** PMO shall define warning thresholds and logic
- **Priority:** High
- **Outputs:** Warning level, affected areas, recommended actions

#### FR-WARN-005: Warning Consolidation
- **Description:** PMO shall consolidate warnings into bulletins
- **Priority:** High
- **Features:** Multi-hazard integration, priority ranking, resource allocation

#### FR-WARN-006: Warning Bulletin Generation
- **Description:** System shall generate formatted warning bulletins
- **Priority:** High
- **Formats:** PDF, Image (PNG), Print-ready
- **Content:** Map, tables, recommendations, contact information

#### FR-WARN-007: Notification Distribution
- **Description:** System shall distribute warnings via multiple channels
- **Priority:** Medium
- **Channels:** SMS, Email, Dashboard, API

### 3.5 Reporting and Analytics

#### FR-RPT-001: Risk Summary Reports
- **Description:** System shall generate risk summary reports
- **Priority:** Medium
- **Types:** National overview, regional comparison, trend analysis

#### FR-RPT-002: Submission Statistics
- **Description:** System shall track data submission statistics
- **Priority:** Low
- **Metrics:** Submission rate by institution, approval rate, timeliness

#### FR-RPT-003: Analytics Dashboard
- **Description:** System shall provide analytics visualization
- **Priority:** Medium
- **Charts:** Trends, comparisons, distributions, maps

### 3.6 Education Module

#### FR-EDU-001: INFORM Methodology Training
- **Description:** System shall provide interactive training content
- **Priority:** Low
- **Content:** Risk concepts, INFORM dimensions, calculation methodology

#### FR-EDU-002: Section Navigation
- **Description:** Users shall navigate through educational sections
- **Priority:** Low
- **Sections:** Hazard, Exposure, Vulnerability, Coping Capacity, Risk Index

---

## 4. Non-Functional Requirements

### 4.1 Performance

#### NFR-PERF-001: Response Time
- **Requirement:** Page load time shall be < 3 seconds on standard connection
- **Measurement:** 95th percentile of page loads

#### NFR-PERF-002: Concurrent Users
- **Requirement:** System shall support 100 concurrent users minimum
- **Measurement:** Load testing results

#### NFR-PERF-003: Data Processing
- **Requirement:** Risk calculations shall complete within 5 seconds
- **Measurement:** Calculation time for full national assessment

### 4.2 Reliability

#### NFR-REL-001: Availability
- **Requirement:** System shall maintain 99.5% uptime
- **Measurement:** Monthly availability metrics

#### NFR-REL-002: Data Backup
- **Requirement:** Automated daily backups with 30-day retention
- **Measurement:** Backup success rate

#### NFR-REL-003: Recovery Time
- **Requirement:** System shall recover from failure within 4 hours
- **Measurement:** Time to restore from backup

### 4.3 Usability

#### NFR-USE-001: Accessibility
- **Requirement:** System shall be usable on mobile devices
- **Measurement:** Responsive design testing

#### NFR-USE-002: Language Support
- **Requirement:** System shall support English and Swahili
- **Measurement:** UI translation completeness

#### NFR-USE-003: Training Time
- **Requirement:** Users shall be proficient within 2 hours training
- **Measurement:** User testing feedback

### 4.4 Security

#### NFR-SEC-001: Authentication
- **Requirement:** All access shall require authentication (except public pages)
- **Implementation:** JWT-based session tokens

#### NFR-SEC-002: Encryption
- **Requirement:** All data transmission shall use TLS 1.2+
- **Implementation:** HTTPS enforcement

#### NFR-SEC-003: Password Policy
- **Requirement:** Passwords shall meet complexity requirements
- **Policy:** Minimum 8 characters, mixed case, numbers, special characters

#### NFR-SEC-004: Audit Logging
- **Requirement:** All sensitive operations shall be logged
- **Retention:** 1 year minimum

### 4.5 Maintainability

#### NFR-MAINT-001: Code Quality
- **Requirement:** Code shall follow established style guidelines
- **Measurement:** Linting and code review

#### NFR-MAINT-002: Documentation
- **Requirement:** All components shall be documented
- **Measurement:** Documentation coverage

---

## 5. System Interfaces

### 5.1 User Interfaces

#### UI-001: Login Page
- Email/password form
- Institution selector (for institution users)
- Remember me option
- Password recovery link

#### UI-002: Main Dashboard
- Role-specific content
- Navigation sidebar
- Quick action buttons
- Notification area

#### UI-003: Data Management Hub
- Tab-based navigation
- Data entry forms
- Review panels
- Export options

#### UI-004: Warning System
- Layer-based workflow
- Map visualization
- Bulletin preview
- Distribution controls

### 5.2 External Interfaces

#### EXT-001: Weather API (Future)
- **Provider:** TMA API / OpenWeather
- **Data:** Weather forecasts, observations
- **Frequency:** Hourly updates

#### EXT-002: SMS Gateway (Future)
- **Provider:** To be determined
- **Purpose:** Warning distribution
- **Format:** Bulk SMS with templating

#### EXT-003: Email Service (Future)
- **Provider:** SMTP / SendGrid
- **Purpose:** Notifications, reports
- **Format:** HTML templates

---

## 6. Data Requirements

### 6.1 Data Entities

#### Geographic Data
- **Regions:** 31 regions of Tanzania
- **Districts:** 184+ districts
- **Boundaries:** GeoJSON format

#### Risk Data
- **Indicators:** 80+ INFORM indicators
- **Values:** 0-10 normalized scale
- **Frequency:** Annual baseline, event-based updates

#### User Data
- **Profiles:** Name, email, role, institution, region
- **Credentials:** Hashed passwords
- **Sessions:** Token-based with expiry

#### Warning Data
- **Bulletins:** Hazard type, severity, affected areas, recommendations
- **History:** Full archive with versioning

### 6.2 Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| User Accounts | Active + 1 year after deactivation |
| Risk Data | Permanent (historical analysis) |
| Warnings | Permanent (archive) |
| Audit Logs | 1 year |
| Session Data | 30 days |

---

## 7. Security Requirements

### 7.1 Authentication Requirements

- Multi-factor authentication (future enhancement)
- Account lockout after 5 failed attempts
- Password expiry every 90 days
- Unique passwords required (no reuse of last 5)

### 7.2 Authorization Requirements

- Role-based access control (RBAC)
- Principle of least privilege
- Regular access reviews

### 7.3 Data Protection

- Encryption at rest for sensitive data
- Encryption in transit (TLS 1.2+)
- No sensitive data in URLs or logs
- PII handling compliance

---

## 8. Appendices

### Appendix A: User Stories

#### A.1 Institution User Stories

**US-INST-001:** As a TMA officer, I want to submit flood hazard data so that PMO can assess flood risks.

**US-INST-002:** As an institution user, I want to save my data entry as a draft so that I can complete it later.

**US-INST-003:** As an institution user, I want to view my submission history so that I can track what I've submitted.

#### A.2 PMO User Stories

**US-PMO-001:** As a PMO officer, I want to review submitted data so that I can verify its accuracy.

**US-PMO-002:** As a PMO officer, I want to issue warnings so that regions can prepare for hazards.

**US-PMO-003:** As a PMO officer, I want to generate warning bulletins so that stakeholders receive standardized information.

#### A.3 Regional Officer User Stories

**US-REG-001:** As a regional officer, I want to view risk data for my region so that I can monitor local conditions.

**US-REG-002:** As a regional officer, I want to receive alerts so that I can coordinate local response.

### Appendix B: Risk Classification Thresholds

| Risk Class | Index Range | Color Code |
|------------|-------------|------------|
| Very Low | 0.0 - 2.0 | Green (#22c55e) |
| Low | 2.0 - 3.5 | Light Green (#84cc16) |
| Medium | 3.5 - 5.0 | Yellow (#eab308) |
| High | 5.0 - 6.5 | Orange (#f97316) |
| Very High | 6.5 - 10.0 | Red (#ef4444) |

### Appendix C: Institution Hazard Types

| Institution | Hazard Types |
|-------------|--------------|
| TMA | Flood, Drought, Cyclone, Heavy Rain, Strong Wind |
| MoW | Flood, Drought, Water Shortage |
| MoH | Disease Outbreak, Epidemic, Health Emergency |
| MoA | Drought, Pest Outbreak, Crop Disease, Food Security |
| GST | Earthquake, Landslide, Volcanic Activity |

---

*End of Software Requirements Specification*
