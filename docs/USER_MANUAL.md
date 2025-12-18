# User Manual
## INFORM Tanzania Early Warning System

### Document Information
- **Version:** 1.0.0
- **Date:** December 2024
- **Audience:** All System Users

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [User Roles and Permissions](#2-user-roles-and-permissions)
3. [Login and Authentication](#3-login-and-authentication)
4. [Navigation](#4-navigation)
5. [Module 01: Education](#5-module-01-education)
6. [Module 02: Risk Assessment](#6-module-02-risk-assessment)
7. [Module 03: Warning System](#7-module-03-warning-system)
8. [Data Management Hub](#8-data-management-hub)
9. [Reports and Export](#9-reports-and-export)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Getting Started

### 1.1 System Requirements

**Web Browser:**
- Google Chrome (recommended) - Version 90+
- Mozilla Firefox - Version 88+
- Microsoft Edge - Version 90+
- Safari - Version 14+

**Internet Connection:**
- Minimum: 1 Mbps
- Recommended: 5 Mbps or higher

**Screen Resolution:**
- Minimum: 1280 x 720
- Recommended: 1920 x 1080

### 1.2 Accessing the System

1. Open your web browser
2. Navigate to the system URL: `http://inform.go.tz` (or development URL)
3. You will see the login page

### 1.3 First-Time Login

1. Enter your assigned email address
2. Enter your password
3. If you are an institution user, select your institution from the dropdown
4. Click "Sign In"

---

## 2. User Roles and Permissions

### 2.1 Role Overview

| Role | Description | Access Level |
|------|-------------|--------------|
| **Administrator** | System managers at PMO-DMD | Full access to all features |
| **PMO Officer** | Disaster management officers | Issue warnings, approve data |
| **Regional Officer** | Regional disaster officers | Monitor regional data |
| **Institution User** | Officers at TMA, MoW, MoH, MoA, GST | Submit hazard data |
| **Public User** | General public | View public information |

### 2.2 Permission Matrix

| Feature | Admin | PMO | Regional | Institution | Public |
|---------|-------|-----|----------|-------------|--------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ | Limited |
| Submit Hazard Data | ✓ | ✓ | - | ✓ | - |
| Issue Warnings | ✓ | ✓ | - | - | - |
| Approve Submissions | ✓ | ✓ | - | - | - |
| View All Data | ✓ | ✓ | Region Only | Institution Only | - |
| Export Reports | ✓ | ✓ | ✓ | ✓ | - |
| User Management | ✓ | - | - | - | - |
| System Settings | ✓ | - | - | - | - |

### 2.3 Institution Users

Institution users represent specific government agencies:

| Institution | Full Name | Hazard Types |
|-------------|-----------|--------------|
| **TMA** | Tanzania Meteorological Authority | Flood, Drought, Cyclone, Heavy Rain, Strong Wind |
| **MoW** | Ministry of Water | Flood, Drought, Water Shortage |
| **MoH** | Ministry of Health | Disease Outbreak, Epidemic, Health Emergency |
| **MoA** | Ministry of Agriculture | Drought, Pest Outbreak, Crop Disease, Food Security |
| **GST** | Geological Survey of Tanzania | Earthquake, Landslide, Volcanic Activity |

---

## 3. Login and Authentication

### 3.1 Login Process

**Step 1: Access Login Page**
- Navigate to the system URL
- The login form will be displayed

**Step 2: Enter Credentials**
- **Email:** Enter your registered email address
- **Password:** Enter your password
- **Institution:** (For institution users only) Select your institution

**Step 3: Optional Settings**
- **Remember Me:** Check this box to stay logged in

**Step 4: Sign In**
- Click the "Sign In" button
- Wait for authentication

### 3.2 Login Screen

```
┌─────────────────────────────────────────┐
│                                         │
│        🇹🇿 INFORM Tanzania              │
│       Early Warning System              │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Email Address                          │
│  ┌───────────────────────────────────┐  │
│  │ example@domain.go.tz              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Password                               │
│  ┌───────────────────────────────────┐  │
│  │ ••••••••••••                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Institution (if applicable)            │
│  ┌───────────────────────────────────┐  │
│  │ Select your institution...     ▼  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ☐ Remember me                          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │           Sign In                 │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### 3.3 Session Timeout

- Sessions automatically expire after **30 minutes** of inactivity
- You will be redirected to the login page
- Any unsaved work may be lost
- Save your work regularly

### 3.4 Logout

1. Click on your profile in the sidebar
2. Click "Logout" button
3. You will be redirected to the login page

---

## 4. Navigation

### 4.1 Sidebar Navigation

The sidebar provides access to all system features:

```
┌──────────────────────┐
│ 🇹🇿 INFORM Tanzania  │
├──────────────────────┤
│ MODULES              │
│ ├── 📚 Education     │
│ ├── ⚠️ Risk          │
│ ├── 📢 Warning       │
│ ├── 📊 Severity      │
│ └── 🌍 Climate       │
├──────────────────────┤
│ DATA VIEWS           │
│ ├── 📈 Risk Data     │
│ ├── ⚡ Warning Data   │
│ ├── 📉 Severity Data │
│ └── 🌤️ Climate Data  │
├──────────────────────┤
│ TOOLS                │
│ ├── 📊 Analytics     │
│ ├── 🏠 Dashboard     │
│ └── 📦 Data Hub      │
├──────────────────────┤
│ LANGUAGE             │
│ [EN] [SW]            │
├──────────────────────┤
│ 👤 User Name         │
│    Role              │
│ [Profile] [Logout]   │
└──────────────────────┘
```

### 4.2 Collapsing the Sidebar

- Click the arrow button (◀/▶) to collapse/expand
- In collapsed mode, only icons are shown
- Hover over icons to see tooltips

### 4.3 Mobile Navigation

- On mobile devices, the sidebar collapses automatically
- Tap the menu icon to open
- Tap outside or the overlay to close

---

## 5. Module 01: Education

### 5.1 Purpose

The Education module provides training on the INFORM methodology and disaster risk concepts.

### 5.2 Sections

**Section 1: Hazards**
- Types of natural and human hazards
- Hazard identification
- Hazard probability assessment

**Section 2: Exposure**
- Population exposure
- Infrastructure exposure
- Economic exposure

**Section 3: Vulnerability**
- Socio-economic vulnerability
- Vulnerable groups
- Vulnerability indicators

**Section 4: Coping Capacity**
- Infrastructure capacity
- Institutional capacity
- Response capabilities

**Section 5: Risk Index**
- INFORM formula explanation
- Risk calculation example
- Risk classification

### 5.3 Navigation

1. Click "Education" in the sidebar
2. Use "Next" and "Previous" buttons to navigate sections
3. Complete all sections for full understanding

---

## 6. Module 02: Risk Assessment

### 6.1 Purpose

View and analyze INFORM risk data for Tanzania's regions and districts.

### 6.2 Accessing Risk Data

1. Click "Risk" in the sidebar
2. The risk dashboard will load

### 6.3 Understanding the Display

**Risk Index Circle:**
- Shows overall INFORM risk score (0-10)
- Color indicates risk level

**Three Dimensions:**
- **Hazard & Exposure (Red):** Natural and human hazards
- **Vulnerability (Orange):** Social and economic factors
- **Lack of Coping Capacity (Blue):** Infrastructure and institutional gaps

### 6.4 Dimension Views

**Hazard & Exposure View:**
- Natural hazards (drought, flood, earthquake, etc.)
- Human hazards (conflict, violence)
- Exposure factors

**Vulnerability View:**
- Socio-economic indicators
- Vulnerable groups (children, elderly, displaced)
- Health and nutrition status

**Coping Capacity View:**
- Infrastructure (communication, health, WASH)
- Institutional capacity (governance, DRR)

### 6.5 Regional Comparison

1. Select regions to compare
2. View side-by-side indicator values
3. Identify areas needing attention

---

## 7. Module 03: Warning System

### 7.1 Purpose

The Warning System enables multi-hazard early warning through a 4-layer workflow.

### 7.2 Four-Layer Workflow

```
Layer 1: Hazard Input (Institutions)
         ↓
Layer 2: Risk Analysis (Automated)
         ↓
Layer 3: Warning Logic (PMO)
         ↓
Layer 4: Consolidation & Issuance (PMO)
```

### 7.3 Layer 1: Hazard Input

**Who uses this:** Institution Users (TMA, MoW, MoH, MoA, GST)

**How to submit hazard data:**

1. Navigate to Warning module
2. Select "Layer 1: Hazard Input"
3. Your institution is automatically selected
4. Fill in the form:
   - **Hazard Type:** Select from your institution's hazards
   - **Severity:** Low, Moderate, High, Severe, Extreme
   - **Probability:** 0-100%
   - **Region:** Select affected region
   - **District:** Select specific district (optional)
   - **Start Date:** When hazard begins
   - **End Date:** When hazard ends
   - **Description:** Detailed description
5. Click "Submit"

**Hazard Types by Institution:**

| Institution | Available Hazards |
|-------------|-------------------|
| TMA | Flood, Drought, Cyclone, Heavy Rain, Strong Wind |
| MoW | Flood, Drought, Water Shortage |
| MoH | Disease Outbreak, Epidemic, Health Emergency |
| MoA | Drought, Pest Outbreak, Crop Disease, Food Security |
| GST | Earthquake, Landslide, Volcanic Activity |

### 7.4 Layer 2: Risk Analysis

**Automatic process:**
- System combines hazard data with vulnerability
- Calculates risk index for affected areas
- Generates risk assessment

**View results:**
- Risk scores by region
- Vulnerability overlay
- Exposure assessment

### 7.5 Layer 3: Warning Logic

**Who uses this:** PMO Officers

**Steps:**
1. Review analyzed hazards
2. Set warning thresholds
3. Determine warning levels:
   - **Green:** Normal conditions
   - **Yellow:** Be aware
   - **Orange:** Be prepared
   - **Red:** Take action
4. Add recommended actions
5. Proceed to consolidation

### 7.6 Layer 4: PMO Dashboard

**Who uses this:** PMO Officers, Administrators

**Features:**
- View all pending warnings
- Consolidate multiple hazards
- Generate warning bulletin
- Distribute warnings
- Track warning history

**Generating a Warning Bulletin:**

1. Select warnings to include
2. Review affected areas
3. Add PMO comments
4. Click "Generate Bulletin"
5. Download PDF or Image
6. Distribute via channels

---

## 8. Data Management Hub

### 8.1 Purpose

Central hub for managing INFORM data, submissions, and indicators.

### 8.2 Accessing the Hub

1. Click "Data Hub" in the Tools section
2. You will see tabs based on your role

### 8.3 Available Tabs

| Tab | Available To | Purpose |
|-----|--------------|---------|
| Dashboard | All users | Overview and statistics |
| My Data Entry | Institution, Regional | Submit new data |
| Regional Data | Admin, PMO, Regional | View regional information |
| All Submissions | Admin, PMO | View all submitted data |
| Review & Approve | Admin, PMO | Approve/reject submissions |
| INFORM Indicators | All users | View/edit indicators |
| Data Upload | Admin, PMO, Institution | Bulk upload via Excel |
| Reports | All users | Generate reports |
| Export & Backup | Admin, PMO | Export data |
| Audit Log | Admin, PMO | View system activity |

### 8.4 Dashboard Overview

Shows role-specific statistics:

**For Institution Users:**
- Pending submissions
- Approved this month
- Under review count

**For Regional Officers:**
- Region statistics
- Active alerts
- Recent updates

**For PMO/Admin:**
- Recent submissions
- Approval queue
- Database health

### 8.5 My Data Entry (Institution/Regional)

**Creating a new entry:**

1. Click "New Entry" button
2. Fill in hazard information:
   - Hazard type
   - Severity level
   - Probability
3. Fill in location:
   - Region
   - District (optional)
4. Fill in time period:
   - Start date
   - End date
5. Fill in details:
   - Description
   - Data source
   - Confidence level
6. Choose action:
   - "Save as Draft" - Save for later
   - "Submit for Review" - Send to PMO

**Managing Drafts:**
- Click "Drafts" tab
- View saved drafts
- Click "Edit" to continue
- Click "Delete" to remove

**Submission History:**
- Click "Submission History" tab
- View all past submissions
- Check status (Pending, Approved, Rejected)

### 8.6 Review & Approve (PMO/Admin)

**Reviewing Submissions:**

1. Click "Review & Approve" tab
2. Filter by status:
   - Pending
   - Under Review
   - Approved
   - All
3. Click on a submission to view details

**Approval Actions:**
- **Approve (✓):** Accept the submission
- **Request Revision (↺):** Ask for changes (add comment)
- **Reject (✕):** Decline the submission (add reason)
- **Publish (🚀):** Make approved data live

### 8.7 INFORM Indicators

**Viewing Indicators:**

1. Click "INFORM Indicators" tab
2. Expand dimension sections:
   - Hazard & Exposure
   - Vulnerability
   - Lack of Coping Capacity
3. View indicator values and sources

**Editing Indicators (Admin/PMO only):**

1. Click "Edit" on an indicator
2. Update the value (0-10 scale)
3. Update the source if needed
4. Add notes explaining the change
5. Click "Save Changes"

### 8.8 Data Upload Wizard

**Uploading bulk data:**

1. Click "Data Upload" tab
2. Select data type:
   - Hazard Data
   - Vulnerability Data
   - Coping Capacity
   - Full INFORM Template
3. Download template (optional)
4. Upload your file (Excel/CSV)
5. System validates data
6. Review validation results
7. Fix any errors
8. Confirm and submit

**Supported file formats:**
- Excel (.xlsx, .xls)
- CSV (.csv)

### 8.9 Export & Backup (Admin/PMO)

**Exporting Data:**

1. Click "Export & Backup" tab
2. Choose export format:
   - Excel
   - CSV
   - INFORM Template
3. Select data scope:
   - All Data
   - Risk Indicators
   - Hazard Data
   - Vulnerability Data
4. Click "Download"

**Creating Backup:**
1. Click "Create Backup" button
2. Wait for backup to complete
3. Download backup file

---

## 9. Reports and Export

### 9.1 Available Reports

| Report Type | Description | Formats |
|-------------|-------------|---------|
| Warning Bulletin | Official warning document | PDF, PNG |
| Risk Summary | Regional risk overview | PDF, Excel |
| Trend Analysis | Historical trends | PDF, Excel |
| Submission Report | Data submission statistics | PDF, Excel |

### 9.2 Generating a Report

1. Navigate to Reports section
2. Select report type
3. Choose parameters:
   - Region (optional)
   - Date range
   - Format
4. Click "Generate"
5. Download when ready

### 9.3 Warning Bulletin

**Components:**
- Header with logos and title
- Map of affected areas
- Hazard details table
- Severity classification
- Recommended actions
- PMO contact information

**Generating:**
1. Go to Module 03 > Layer 4
2. Select warnings to include
3. Click "Generate Bulletin"
4. Choose format (PDF/Image)
5. Download

---

## 10. Troubleshooting

### 10.1 Login Issues

**Problem:** Cannot log in

**Solutions:**
1. Check email is correct
2. Check password (case-sensitive)
3. For institution users, ensure correct institution selected
4. Clear browser cache
5. Contact administrator if problem persists

**Problem:** Session expired

**Solutions:**
1. Log in again
2. Check "Remember Me" for longer sessions
3. Save work frequently

### 10.2 Data Entry Issues

**Problem:** Cannot submit data

**Solutions:**
1. Check all required fields are filled
2. Ensure date range is valid
3. Check internet connection
4. Try refreshing the page

**Problem:** Draft not saving

**Solutions:**
1. Check internet connection
2. Reduce description length
3. Try again after a moment

### 10.3 Map Issues

**Problem:** Map not loading

**Solutions:**
1. Refresh the page
2. Check internet connection
3. Clear browser cache
4. Try a different browser

**Problem:** Map is slow

**Solutions:**
1. Zoom in to reduce data
2. Disable layers not needed
3. Use a faster connection

### 10.4 Export Issues

**Problem:** Export fails

**Solutions:**
1. Reduce data range
2. Try different format
3. Check popup blocker settings
4. Try again later

### 10.5 General Issues

**Problem:** Page not loading

**Solutions:**
1. Check internet connection
2. Refresh the page (Ctrl+F5)
3. Clear browser cache
4. Try incognito/private mode
5. Try a different browser

**Problem:** Error message displayed

**Solutions:**
1. Note the error message
2. Refresh the page
3. If persists, contact support with error details

### 10.6 Contact Support

**Technical Support:**
- Email: support@inform.go.tz
- Phone: +255 26 232 2480
- Hours: Monday-Friday, 8:00 AM - 5:00 PM

**When contacting support, provide:**
- Your username
- Description of the problem
- Error messages (if any)
- Steps to reproduce the issue
- Browser and device type

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + S | Save (in forms) |
| Ctrl + P | Print |
| Esc | Close modal/dialog |
| Tab | Move to next field |
| Enter | Submit form |

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **INFORM** | Index for Risk Management |
| **H&E** | Hazard and Exposure dimension |
| **LCC** | Lack of Coping Capacity dimension |
| **PMO-DMD** | Prime Minister's Office - Disaster Management Department |
| **Risk Index** | Calculated score from 0-10 indicating risk level |
| **Warning Bulletin** | Official document issued for hazard alerts |

## Appendix C: Quick Reference Cards

### Institution User Quick Reference

```
╔══════════════════════════════════════════════════╗
║  INSTITUTION USER QUICK REFERENCE                 ║
╠══════════════════════════════════════════════════╣
║  LOGIN:                                           ║
║  1. Enter email and password                      ║
║  2. Select your institution                       ║
║  3. Click Sign In                                 ║
║                                                   ║
║  SUBMIT HAZARD DATA:                              ║
║  1. Go to Warning > Layer 1                       ║
║  2. Fill hazard form                              ║
║  3. Click Submit                                  ║
║                                                   ║
║  CHECK SUBMISSIONS:                               ║
║  1. Go to Data Hub                                ║
║  2. Click "Submission History"                    ║
║  3. View status of each entry                     ║
╚══════════════════════════════════════════════════╝
```

### PMO Officer Quick Reference

```
╔══════════════════════════════════════════════════╗
║  PMO OFFICER QUICK REFERENCE                      ║
╠══════════════════════════════════════════════════╣
║  REVIEW SUBMISSIONS:                              ║
║  1. Go to Data Hub > Review & Approve             ║
║  2. Click submission to review                    ║
║  3. Approve, Request Revision, or Reject          ║
║                                                   ║
║  ISSUE WARNING:                                   ║
║  1. Go to Warning > Layer 4                       ║
║  2. Select warnings to consolidate                ║
║  3. Click "Generate Bulletin"                     ║
║  4. Download and distribute                       ║
║                                                   ║
║  GENERATE REPORTS:                                ║
║  1. Go to Data Hub > Reports                      ║
║  2. Select report type                            ║
║  3. Click Generate                                ║
╚══════════════════════════════════════════════════╝
```

---

*For additional help, contact the PMO-DMD Technical Support Team.*
