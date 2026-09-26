# Warning Module - Standalone Build Guide

This guide explains how to compile and deploy the **Warning System module** as a standalone application.

## Quick Start

### Build Warning App Only
```bash
npm run build
```
This builds both the main app and the warning app into the `dist/` folder.

The warning app will be at: `dist/warning.js`

### Run Warning App in Development
```bash
npm run dev:warning
```
Opens the warning app at `http://localhost:5174/warning-app.html` with hot reload.

### Preview Built Warning App
```bash
npm run preview:warning
```

---

## Build Output Structure

After running `npm run build`, you'll have:

```
dist/
├── index.html           (Main INFORM app)
├── main.js
├── warning.js           (⭐ Warning app)
├── warning-app.html
└── [other chunks]
```

---

## Standalone Deployment

### Option 1: Deploy Warning App to Web Server

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Copy to server:**
   ```bash
   # Copy these files to your web server:
   - dist/warning-app.html  → your-domain.com/warning/index.html
   - dist/warning.js        → your-domain.com/warning/warning.js
   - dist/*.chunk.js        → your-domain.com/warning/*.js
   ```

3. **Access at:**
   ```
   https://your-domain.com/warning/
   ```

### Option 2: Docker Container

Create `Dockerfile` for warning app:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

Build and run:
```bash
docker build -t warning-app .
docker run -p 3000:3000 warning-app
```

### Option 3: GitHub Pages

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy `dist/` folder to GitHub Pages

---

## Features Included in Standalone Build

✅ Hazard Input (Layer 1)
- Institution selection
- Hazard type selection
- Interactive district map
- Warning level assignment
- Temporal validity configuration

✅ PMO Dashboard (Layer 4)
- Pending hazard review queue
- Risk assessment with INFORM formula
- Impact level selection
- Responsible actor assignment
- Request Information/More Information
- Rollback and revision requests
- Warning issuance and logging
- Simulation mode for testing

✅ No Backend Required
- All data stored in component state
- Demo/test mode by default
- Can be integrated with APIs later

---

## Configuration

### API Integration (Optional)

To connect to a backend API, modify `src/pages/WarningModule.jsx`:

```jsx
// Add API calls to handleHazardSubmit and handleApproveWarning
const response = await fetch('/api/hazards', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(hazardData)
});
```

### Custom Styling

Modify `src/components/warning/Module03WarningSystem.css` to customize colors, fonts, etc.

---

## File Structure

```
masuby-model/
├── warning-app.html                    # Standalone entry point
├── src/
│   ├── warning-app-main.jsx           # App initialization
│   ├── pages/WarningModule.jsx         # Main warning component
│   ├── components/warning/
│   │   ├── layers/Layer1HazardInput.jsx
│   │   ├── layers/Layer4PMODashboard.jsx
│   │   └── Module03WarningSystem.css
│   └── index.css
├── vite.config.js                     # Multi-entry build config
└── package.json
```

---

## Environment Variables

Create `.env` file (if using backend):
```
VITE_API_URL=https://api.example.com
VITE_APP_NAME=Warning System
VITE_ENVIRONMENT=production
```

---

## Troubleshooting

### Build fails with "module not found"
- Run `npm install`
- Check that all imports are correct
- Verify Node.js version (18+)

### Warning app loads but no styling
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for CSS errors
- Verify all assets loaded in Network tab

### Data doesn't persist on refresh
- This is normal - data is stored in component state
- To persist data, integrate with backend API or localStorage

---

## Production Checklist

- [ ] Test all hazard input workflows
- [ ] Test all PMO validation workflows
- [ ] Verify simulation mode works
- [ ] Check responsive design on mobile
- [ ] Test console logging
- [ ] Verify no console errors
- [ ] Set appropriate environment variables
- [ ] Configure backend API endpoints (if needed)
- [ ] Set up monitoring/logging
- [ ] Create user documentation

---

## Support

For issues or questions:
1. Check the browser console (F12) for errors
2. Review Module03WarningSystem documentation
3. Check test scenarios in warning-standalone demo

---

**Version:** 1.0.0
**Last Updated:** 2026-03-22
**Status:** Ready for Deployment
