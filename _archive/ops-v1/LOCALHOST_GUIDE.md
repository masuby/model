# 🌐 LOCALHOST VERIFICATION GUIDE

## Quick Start (Choose Your OS)

### 🐧 **Linux / Mac Users**

```bash
cd /home/kaijage/model/inform/masuby-model

# Make script executable (first time only)
chmod +x RUN_DEMO.sh

# Run the demo
./RUN_DEMO.sh
```

### 🪟 **Windows Users**

```bash
cd C:\path\to\masuby-model

# Run the batch file
RUN_DEMO.bat
```

### 📋 **Manual Setup (All Platforms)**

```bash
cd /home/kaijage/model/inform/masuby-model

# Install dependencies
npm install

# Start development server
npm start
```

---

## 📍 Access Points

Once the server starts, you'll see:

```
Compiled successfully!

You can now view masuby-model in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://[your-ip]:3000
```

**Open browser to:**
- **http://localhost:3000** ← Demo with full UI

---

## ✅ Testing Verification Checklist

### 1️⃣ **System Loads**
- [ ] Page loads without errors
- [ ] See header: "🚨 Hazard Input & PMO Dashboard"
- [ ] See demo instructions section
- [ ] Two tabs visible: "Hazard Input" and "PMO Dashboard"

### 2️⃣ **Hazard Input Tab Test**

```
Navigate to: http://localhost:3000

Steps:
1. Click "📥 Hazard Input" tab
2. Select institution: TMA (Tanzania Meteorological Authority)
3. Hazard type: Heavy Rainfall (auto-selected)
4. Click WARNING LEVEL: Select "Advisory" (yellow)
5. Click on MAP to select districts:
   - Click "Ilala"
   - Click "Kinondoni"
   - Click "Temeke"
   - Click "Ubungo"
   - Click "Morogoro Urban"
   (should turn yellow on map)
6. Set validity period (defaults ok)
7. Click "🚨 Submit Warning" button
8. Confirmation alert appears

Expected Output: ✅ Hazard submitted successfully
```

### 3️⃣ **PMO Dashboard Tab Test**

```
Steps:
1. Click "🏛️ PMO Dashboard" tab
2. See "Pending Hazard Reviews (1)"
3. Click on the hazard card (Heavy Rainfall)
4. Right panel opens with assessment
5. See map preview of selected districts
6. Set "Impact Assessment": Moderate
7. Select 2-3 actors (click checkboxes):
   - Local Government Authorities
   - Ministry of Water
8. Click "✅ Issue Warning" button
9. Success alert appears
10. Check "Recently Issued Warnings (1)" section

Expected Output: ✅ Warning issued and logged
```

### 4️⃣ **Simulation Mode Test**

```
Steps:
1. Click "🎯 Simulation" button in header
2. Go to Hazard Input tab
3. Submit another hazard
4. Notice "(Simulation)" badge on form
5. Submit and verify it appears in PMO queue
6. All functionality works same way

Expected Output: ✅ Simulation mode works independently
```

### 5️⃣ **Console Logging Test**

```
1. Press F12 (Windows/Linux) or Cmd+Option+I (Mac)
2. Click "Console" tab
3. Go to Hazard Input tab
4. Submit a hazard
5. Look for logs in console:

   📥 Hazard submitted for PMO review: {
     id: "HAZARD-...",
     hazardType: "Heavy Rainfall",
     institution: "TMA",
     spatialExtent: ["Ilala", "Kinondoni", ...],
     warningLevel: "Advisory",
     ...
   }

Expected Output: ✅ Console shows detailed logs
```

---

## 📊 Expected Behavior

### After Hazard Submission
| Action | Expected Result |
|--------|-----------------|
| Submit hazard | Popup confirms "Hazard submitted" |
| Switch to PMO | Hazard appears in pending queue |
| Click hazard | Assessment panel opens |
| Issue warning | "Warning Successfully Issued" alert |
| Check warnings | Issued warning shows in list |

### Statistics Updates (Real-Time)
| Metric | Updates When |
|--------|--------------|
| Hazards Pending | Submit new hazard |
| Warnings Issued | PMO issues a warning |
| Institutions | Add hazard from new institution |

---

## 🐛 Debugging Guide

### Issue: Page Won't Load
**Cause:** Port 3000 already in use
**Fix:**
```bash
# Kill process on port 3000
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port:
PORT=3001 npm start
```

### Issue: Districts Not Appearing on Map
**Cause:** CSS not loaded
**Fix:**
```bash
# Hard refresh browser
# Windows/Linux: Ctrl+Shift+Delete
# Mac: Cmd+Shift+Delete
# Then ctrl+F5 (or Cmd+Shift+R on Mac)
```

### Issue: "Risk data not loaded" in Console
**This is normal** - System uses mock data as fallback
**To load real data:**
- Place Excel file at: `public/data/tanzania-inform-risk.xlsx`
- Or pass custom URL: `<HazardAndPMOSystem riskDataUrl="/api/risk-data" />`

### Issue: Console Shows Errors
**Check DevTools Console tab:**
```javascript
// Good logs look like:
📥 Hazard submitted...
📢 Warning issued...

// Bad logs show:
❌ Error: ...
```

### Issue: Buttons Not Responding
**Cause:** Not enough districts selected
**Fix:** Click 5+ districts on map before submitting

---

## 📱 Responsive Testing

Test on different screen sizes:

```
Mobile (320px):
  npm start
  Press F12
  Click device toggle icon (top-left of DevTools)
  Select iPhone

Tablet (768px):
  In DevTools, set width to 768px

Desktop (1440px):
  Full browser window
```

**Expected:** Layout adapts smoothly without breaking

---

## 🔍 Network & Performance

### Check Network Requests
```
1. Open DevTools (F12)
2. Click "Network" tab
3. Reload page
4. Check for any red errors
5. Look for risk data file loading
```

### Check Performance
```
1. Open DevTools (F12)
2. Click "Performance" tab
3. Click record (red circle)
4. Submit a hazard
5. Stop recording
6. Analyze performance timeline
   - Should be <100ms for form submission
```

---

## ✅ Full Verification Report

Create a test report by checking all items:

```
SYSTEM VERIFICATION CHECKLIST
═════════════════════════════════════════

ENVIRONMENT:
☐ Node.js installed (npm --version)
☐ Project located at: /home/kaijage/model/inform/masuby-model
☐ npm install completed successfully
☐ npm start runs without errors

BASIC FUNCTIONALITY:
☐ Page loads at http://localhost:3000
☐ Demo app displays with header and instructions
☐ Tabs visible: Hazard Input and PMO Dashboard

HAZARD INPUT:
☐ Can select institution (TMA/MOW/MOH/MOA/GST)
☐ Can select hazard type from dropdown
☐ Can click districts on map
☐ Can set warning level
☐ Can set validity dates
☐ Can submit hazard form
☐ Confirmation alert appears

PMO DASHBOARD:
☐ Submitted hazards appear in queue
☐ Can select hazard for assessment
☐ Can set impact level
☐ Can select responsible actors
☐ Can issue warning
☐ Warning appears in issued list
☐ Audit logs updated

SIMULATION MODE:
☐ Toggle switches to simulation
☐ Submit works in simulation
☐ (Simulation) badge appears
☐ Data isolated from live mode

CONSOLE LOGGING:
☐ F12 Console shows detailed logs
☐ No JavaScript errors
☐ Events logged with timestamps
☐ Warning creation logged

RESPONSIVE DESIGN:
☐ Works on 320px (mobile)
☐ Works on 768px (tablet)
☐ Works on 1440px (desktop)
☐ Layout adapts properly

PERFORMANCE:
☐ Page loads in <2 seconds
☐ Form submission <100ms
☐ No lag with 40+ districts
☐ Smooth CSS transitions

═════════════════════════════════════════
Status: [PASS/FAIL]
Test Date: [DATE]
Tester: [NAME]
Notes: [COMMENTS]
```

---

## 🚀 Next Steps

After verification:

1. **Review Documentation**
   - Read: [README.md](src/components/warning-standalone/README.md)
   - Read: [QUICKSTART.md](src/components/warning-standalone/QUICKSTART.md)

2. **Integration Testing**
   - Test with actual risk data
   - Test authentication/permissions
   - Test with production data

3. **Production Deployment**
   - Build optimized version: `npm run build`
   - Deploy `dist/` folder to server
   - Configure risk data URL for production
   - Set up audit logging API endpoint

---

## 📞 Support

### Common Questions

**Q: Can I access from another computer?**
A: Yes, use the "On Your Network" URL shown when server starts

**Q: Will data persist on page reload?**
A: No, all data is in memory. Reload = fresh start

**Q: Can I test without submitting?**
A: Yes, use Simulation Mode - no audit logging occurs

**Q: How do I stop the server?**
A: Press `Ctrl+C` in terminal running `npm start`

---

## 🎉 Success Indicators

✅ **Green checks when:**
- Page loads without 404 or error messages
- Can submit hazard and see confirmation
- Can switch to PMO tab and see submitted hazard
- Can issue warning without errors
- Console has no red error messages
- All UI elements respond to clicks

---

## Final Checklist

Before declaring ready:

```
Pre-Launch:
  ✅ RUN_DEMO.sh / RUN_DEMO.bat works
  ✅ Verification checklist passed
  ✅ No console errors
  ✅ All tabs functional
  ✅ Full workflow tested

Launch:
  ✅ npm start working
  ✅ http://localhost:3000 accessible
  ✅ Demo instructions visible
  ✅ Ready for production deployment
```

---

**🎊 Congratulations! Your Standalone Warning System is Ready! 🎊**

**Localhost URL:** http://localhost:3000
