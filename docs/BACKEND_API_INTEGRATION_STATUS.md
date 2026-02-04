# BACKEND API INTEGRATION - UNDER IMPLEMENTATION

**Date:** February 4, 2026
**Status:** 🚧 **UNDER IMPLEMENTATION** - Frontend connected to Go Backend
**Last Updated:** February 4, 2026

---

## Overview

Connecting the React frontend (masuby-model) to the Go backend (inform-system) API for persistent data storage, authentication, and INFORM risk calculations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  REACT FRONTEND (localhost:5174)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  authService.js ──────────┐                              │   │
│  │  committeeService.js ─────┼──▶ apiClient.js             │   │
│  │  indicatorService.js ─────┤         │                    │   │
│  │  dataEntryService.js ─────┤         │                    │   │
│  │  riskScoreService.js ─────┘         │                    │   │
│  └─────────────────────────────────────┼────────────────────┘   │
│                                        │                        │
│                            Vite Proxy  │ /api/v1/*              │
└────────────────────────────────────────┼────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  GO BACKEND (localhost:8080)                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /auth/login  │  │ /committees  │  │ /indicators  │          │
│  │ /auth/register│ │ /data        │  │ /risk/scores │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │  inform.db  │                              │
│                    │  (SQLite)   │                              │
│                    └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Status

### Phase 1: API Services (COMPLETED) ✅

| File | Purpose | Status |
|------|---------|--------|
| `src/services/apiClient.js` | HTTP client with auth, retries | ✅ Done |
| `src/services/authService.js` | Login/register via Go API | ✅ Done |
| `src/services/committeeService.js` | Committee CRUD | ✅ Done |
| `src/services/indicatorService.js` | Indicator queries | ✅ Done |
| `src/services/dataEntryService.js` | Data entry submit/verify | ✅ Done |
| `src/services/riskScoreService.js` | Risk calculation | ✅ Done |
| `src/services/index.js` | Central exports | ✅ Done |
| `vite.config.js` | Proxy to Go backend | ✅ Done |

### Phase 2: Go Backend Updates (COMPLETED) ✅

| File | Purpose | Status |
|------|---------|--------|
| `cmd/server/main.go` | CORS middleware added | ✅ Done |

### Phase 3: Component Integration (PENDING) 🔄

| Component | Status | Notes |
|-----------|--------|-------|
| Login.jsx | 🔄 Pending | Needs testing with backend |
| DataManagementHub.jsx | 🔄 Pending | Connect to data services |
| InstitutionDataEntry.jsx | 🔄 Pending | Use dataEntryService |
| PMOReviewPanel.jsx | 🔄 Pending | Use verification API |
| INFORMIndicators.jsx | 🔄 Pending | Load from backend |

### Phase 4: Testing (PENDING) ⏳

| Test | Status |
|------|--------|
| Authentication flow | ⏳ Pending |
| Committee data loading | ⏳ Pending |
| Data entry submission | ⏳ Pending |
| Risk score calculation | ⏳ Pending |
| WebSocket real-time updates | ⏳ Pending |

---

## API Endpoints Connected

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout

### Committees
- `GET /api/v1/committees` - List committees
- `POST /api/v1/committees` - Create committee (admin)

### Indicators
- `GET /api/v1/indicators` - List all indicators
- `GET /api/v1/indicators/:id` - Get indicator by ID/code

### Data Entry
- `POST /api/v1/data` - Submit data entry
- `GET /api/v1/data` - List data entries
- `PUT /api/v1/data/:id/verify` - Verify/reject entry

### Risk Scores
- `GET /api/v1/risk/calculate` - Calculate risk scores
- `GET /api/v1/risk/scores` - Get calculated scores

### Transparency
- `GET /api/v1/transparency/formulas` - Get formula docs
- `GET /api/v1/transparency/dataflow` - Get data flow
- `GET /api/v1/transparency/linkages` - Get sheet linkages

---

## Configuration

### Toggle API Mode
In `src/services/authService.js`:
```javascript
const USE_BACKEND_API = true;  // true = Go backend, false = mock data
```

### Vite Proxy
In `vite.config.js`:
```javascript
proxy: {
  '/api/v1': {
    target: 'http://localhost:8080',
    changeOrigin: true
  }
}
```

---

## How to Run

### 1. Start Go Backend
```bash
cd /home/kaijage/model/inform/inform-system
./inform-system
# Runs on http://localhost:8080
```

### 2. Start React Frontend
```bash
cd /home/kaijage/model/inform/masuby-model
npm run dev
# Runs on http://localhost:5174
```

### 3. Test Login
- URL: http://localhost:5174
- Email: `admin@inform.go.tz`
- Password: `admin123`

---

## Seeded Data (Available in Backend)

### Users
| Email | Password | Role |
|-------|----------|------|
| admin@inform.go.tz | admin123 | admin |

### Committees
- 26 Tanzania Regional Disaster Committees (TZ01-TZ26)

### Indicators
- 22 INFORM indicators across 3 dimensions:
  - HAZARD: Earthquake, Flood, Drought, Violence, etc.
  - VULNERABILITY: HDI, Poverty, Food Security, IDPs, etc.
  - COPING_CAPACITY: Health, Communication, Education, Governance

---

## Next Steps

1. [ ] Rebuild Go backend with CORS changes (requires Go installation)
2. [ ] Test authentication flow end-to-end
3. [ ] Connect DataManagementHub to backend services
4. [ ] Implement Excel data import to backend
5. [ ] Test WebSocket real-time updates
6. [ ] Add more institution users to backend
7. [ ] Connect early warning system to backend

---

## Git Commits

- `6b4db9c` - Connect React frontend to Go backend API (Feb 4, 2026)

---

**Status Legend:**
- ✅ Done - Completed and working
- 🔄 Pending - Implementation needed
- ⏳ Pending - Waiting for dependencies
- 🚧 Under Implementation - Work in progress
