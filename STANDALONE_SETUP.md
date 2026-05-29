# Standalone Warning System - Local Setup Guide

## Quick Start (5 minutes)

### Option 1: Using Existing React App

If your app is already running (`npm start`), just import the demo:

```jsx
// In your main App.jsx or routing file
import DemoApp from './components/warning-standalone/demo/DemoApp';

export default function App() {
  return <DemoApp />;
}
```

Then visit: **http://localhost:3000**

---

## Full Setup Instructions

### Prerequisites
- Node.js 14+ installed
- npm or yarn package manager
- React 17+ (already in this project)

### Step 1: Start Development Server

```bash
cd /home/kaijage/model/inform/masuby-model

# Start the React development server
npm start
```

**Output should show:**
```
Compiled successfully!

You can now view masuby-model in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://[your-ip]:3000
```

### Step 2: Access the Demo

Open browser to: **http://localhost:3000**

If you configured the demo in App.jsx, it will load automatically.

---

## Testing the System

### Navigate to Demo URL
```
http://localhost:3000
```

### Testing Checklist

#### 🟡 Hazard Input Tab
- [ ] Click "Hazard Input" tab at top
- [ ] Select TMA as institution
- [ ] Choose "Heavy Rainfall"
- [ ] Click 5-10 districts on the map (they turn yellow)
- [ ] Set warning level
- [ ] Click "Submit Warning"
- [ ] Confirmation alert appears

#### 🏛️ PMO Dashboard Tab
- [ ] Click "PMO Dashboard" tab
- [ ] See submitted hazard in "Pending Hazard Reviews"
- [ ] Click on hazard card
- [ ] Assessment panel opens on right
- [ ] Set Impact Level (Moderate)
- [ ] Select 2-3 responsible actors
- [ ] Click "Issue Warning"
- [ ] Success message appears
- [ ] Hazard moves to "Recently Issued Warnings"

#### 🎯 Simulation Mode
- [ ] Toggle "Simulation Mode" in header
- [ ] Submit another hazard
- [ ] Verify it says "(Simulation)" in submission
- [ ] Toggle back to "Live Mode"

#### 📊 Developer Console
- [ ] Press **F12** to open DevTools
- [ ] Go to **Console** tab
- [ ] Submit a hazard
- [ ] See console logs like:
  ```
  📥 Hazard submitted for PMO review: {id, hazardType, ...}
  ```

---

## File Structure

```
masuby-model/
├── src/
│   ├── components/
│   │   └── warning-standalone/          ← NEW SYSTEM
│   │       ├── HazardAndPMOSystem.jsx
│   │       ├── HazardAndPMOSystem.css
│   │       ├── index.js
│   │       ├── README.md
│   │       ├── QUICKSTART.md
│   │       │
│   │       ├── layers/
│   │       │   ├── HazardInputPanel.jsx
│   │       │   └── PMOValidationPanel.jsx
│   │       │
│   │       ├── components/
│   │       │   └── StandaloneHazardMap.jsx
│   │       │
│   │       ├── data/
│   │       │   ├── hazardConfig.js
│   │       │   └── pmoConfig.js
│   │       │
│   │       ├── services/
│   │       │   └── systemService.js
│   │       │
│   │       └── demo/
│   │           ├── DemoApp.jsx
│   │           └── DemoApp.css
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
│
├── package.json
├── vite.config.js (or webpack.config.js)
└── ...
```

---

## Usage Examples

### Basic Usage in App.jsx

```jsx
import React from 'react';
import HazardAndPMOSystem from './components/warning-standalone';

export default function App() {
  return (
    <div className="app">
      <h1>Tanzania Early Warning System</h1>
      <HazardAndPMOSystem riskDataUrl="/data/tanzania-inform-risk.xlsx" />
    </div>
  );
}
```

### With Custom Styling

```jsx
import HazardAndPMOSystem from './components/warning-standalone';
import './styles/custom-theme.css';

export default function App() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <HazardAndPMOSystem />
    </div>
  );
}
```

### In a Route

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HazardAndPMOSystem from './components/warning-standalone';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/warnings" element={<HazardAndPMOSystem />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process on port 3000
# On Mac/Linux:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm start
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Styles Not Loading

```bash
# Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
# Or hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
```

### Console Shows "Risk data not loaded"

- This is normal - system falls back to mock data
- To load real data, provide Excel file at: `/public/data/tanzania-inform-risk.xlsx`
- Or pass custom URL: `<HazardAndPMOSystem riskDataUrl="/api/risk-data" />`

### Dependencies Missing

```bash
# Install all dependencies
npm install

# If specific service is missing
npm install axios (if needed for APIs)
```

---

## Development Tools

### Browser DevTools (F12)

**Console Tab:**
- View all system logs and errors
- Debug hazard submissions
- Watch warning issuance

**Network Tab:**
- Check if risk data file loads
- Monitor any API calls
- Verify request/response payloads

**Elements/Inspector Tab:**
- Inspect HTML structure
- Debug CSS styling
- Check responsive layout

### React DevTools Extension

Install [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools) browser extension to:
- Inspect React component tree
- View component props and state
- Track state changes in real-time

---

## Performance Testing

### Test Different Screen Sizes

```javascript
// In browser console, simulate mobile:
// Use DevTools device emulation (Ctrl+Shift+M)
```

Recommended test widths:
- 320px (Mobile)
- 768px (Tablet)
- 1024px (Laptop)
- 1440px (Desktop)

### Test with Multiple Hazards

1. Submit 5+ hazards in sequence
2. Verify PMO queue updates correctly
3. Check for any lag or performance issues
4. Open DevTools Performance tab to profile

---

## Data Testing

### Test Scenarios

**Scenario 1: Single Institution, Single District**
```
Institution: TMA
Hazard: Heavy Rainfall
Districts: Ilala
Warning Level: Advisory
Expected: Quick submission, no validation errors
```

**Scenario 2: Multi-District Alert**
```
Institution: MOW
Hazard: River Flood
Districts: 10+ coastal districts
Warning Level: Major Warning
Expected: Handles large selection without lag
```

**Scenario 3: PMO Full Workflow**
```
1. Submit hazard from TMA
2. Switch to PMO tab
3. Select hazard
4. Assess and assign all actors
5. Issue warning
6. Verify in issued warnings list
Expected: Complete workflow with audit logging
```

---

## Integration Checklist

Before deploying to production:

- [ ] Risk data loads from correct URL
- [ ] Audit logging works (check console)
- [ ] All institutions and hazards configured correctly
- [ ] Districts map displays all regions
- [ ] Responsive design tested (mobile/tablet/desktop)
- [ ] Warning issuance creates proper output
- [ ] Browser compatibility tested (Chrome, Firefox, Safari)
- [ ] No console errors or warnings
- [ ] Performance acceptable with 100+ districts
- [ ] User permissions/authentication integrated

---

## Building for Production

### Create Optimized Build

```bash
# Build production bundle
npm run build

# Output goes to: ./dist/ or ./build/

# Test production build locally
npm run serve
```

### Deploy to Server

```bash
# Copy dist folder to web server
# Or deploy using your CI/CD pipeline

# Ensure:
# - Risk data file accessible at configured path
# - Audit service API endpoint configured
# - CORS headers allow requests
# - HTTPS enabled for production
```

---

## Support & Documentation

- **README.md** - Full technical documentation
- **QUICKSTART.md** - User guide with examples
- **DemoApp.jsx** - Live demo with instructions
- **Console Logs** - Detailed event logging (F12 Console)

---

## Environment Variables (Optional)

Create `.env` file for configuration:

```env
REACT_APP_RISK_DATA_URL=/data/tanzania-inform-risk.xlsx
REACT_APP_AUDIT_API=http://localhost:3001/api/audit
REACT_APP_MODE=development
```

Then use in code:

```jsx
<HazardAndPMOSystem
  riskDataUrl={process.env.REACT_APP_RISK_DATA_URL}
/>
```

---

## Localhost URLs Reference

```
Main App:        http://localhost:3000
Demo System:     http://localhost:3000 (if configured)
DevTools:        F12 or Right-click → Inspect
Network Tab:     F12 → Network tab
Console Logs:    F12 → Console tab
```

---

## Next Steps

1. ✅ Start dev server (`npm start`)
2. ✅ Open http://localhost:3000
3. ✅ Test hazard submission
4. ✅ Test PMO validation
5. ✅ Check console logs
6. ✅ Review [README.md](./src/components/warning-standalone/README.md)
7. ✅ Ready for production deployment

---

**Happy Testing! 🎉**

For issues or questions, check the console logs first (F12 → Console).
