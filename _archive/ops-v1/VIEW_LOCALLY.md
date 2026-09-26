# 🖥️ View INFORM Tanzania Locally

## Quick Start (3 Steps)

### Step 1: Install Node.js (if needed)

Check if you have Node.js:
```bash
node --version
```

If not installed, install it:
```bash
# For Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
```

---

### Step 2: Run the Start Script

Simply run:
```bash
/home/kaijage/model/inform/START_LOCAL.sh
```

Or manually:
```bash
cd /home/kaijage/model/inform/masuby-model
npm install  # First time only
npm run dev
```

---

### Step 3: Open in Browser

Open your browser to:
```
http://localhost:5173
```

---

## 🎯 What You'll See

### 1. Home Screen
```
┌────────────────────────────────────────────────┐
│  🇹🇿 INFORM TANZANIA                          │
│  [INFORM RISK ▼]                              │
├────────────────────────────────────────────────┤
│                                                │
│  📁 Upload | [Choose Excel ▼] | 🔍 Search    │
│                                                │
│  [Select Visualization ▼]                     │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  INFORM SADC 2024                        │ │
│  │────────────────────────────────────────  │ │
│  │  COUNTRY | ADM1_NAME | ADM2_NAME | ...  │ │
│  │  Tanzania| Dodoma    | Kondoa    | ...  │ │
│  │  Tanzania| Dodoma    | Mpwapwa   | ...  │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Page 1 of 10          ◀ Prev | Next ▶        │
└────────────────────────────────────────────────┘
```

---

### 2. Open Visualizations

Click **"Select Visualization"** dropdown:

```
Select Visualization
├─ INFORM Framework ───────────────
│  ├─ 🎯 INFORM Risk Dashboard     ← Click this!
│  ├─ 🌐 Indicator Hierarchy
│  ├─ 📡 Dimension Comparison
│  └─ 🗺️ Risk Choropleth Map
├─ Standard Charts ────────────────
│  ├─ 📊 Dashboard View
│  ├─ 📈 Bar Chart
│  ├─ 📉 Line Graph
│  └─ ...
```

---

### 3. INFORM Risk Dashboard Opens!

```
┌─────────────────────────────────────────────────────────────┐
│  INFORM Risk Profile Dashboard                          [×] │
│  Tanzania Subnational Risk Analysis - SADC 2024            │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Map View] [Compare] [Framework] [Rankings]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 184  │ │ 5.2  │ │  23  │ │ 45%  │ │ 8.7  │ │ 2.1  │   │
│  │Dists │ │ Avg  │ │V.High│ │High% │ │Max   │ │Min   │   │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   │
│                                                              │
│  [Interactive Dashboard Content]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Features to Explore

### Tab 1: Overview
- ✅ 6 Quick Stats Cards
- ✅ 4 Dimension Gauge Cards (Risk, Hazard, Vulnerability, Coping)
- ✅ Mini Map Preview
- ✅ Top 5 High-Risk Districts

**Try:** Click on a district in the rankings!

---

### Tab 2: Map View
- ✅ Full Interactive Map of Tanzania
- ✅ Choose any indicator (50+ options)
- ✅ Toggle between Regions (ADM1) and Districts (ADM2)
- ✅ Click any area to see details
- ✅ Hover for instant info

**Try:**
1. Change indicator to "Drought"
2. Toggle to "Regions" view
3. Click on a region

---

### Tab 3: Compare
- ✅ Radar Chart comparing multiple districts
- ✅ Add up to 8 districts
- ✅ 4 different comparison profiles
- ✅ Visual area comparison

**Try:**
1. Add "Kondoa" district
2. Add "Singida" district
3. Add "Dodoma" district
4. See how they compare!

---

### Tab 4: Framework
- ✅ Beautiful Sunburst Chart showing INFORM hierarchy
- ✅ Click to explore indicator relationships
- ✅ See how Risk → Dimensions → Components → Indicators
- ✅ Methodology explanation

**Try:** Click on the sunburst rings to drill down!

---

### Tab 5: Rankings
- ✅ Full list of all 184 districts
- ✅ Sorted by risk (highest to lowest)
- ✅ Color-coded risk levels
- ✅ Click any row to jump to that district

**Try:** Scroll through the list to see all districts!

---

## 📱 Also Try: Responsive Design

Resize your browser window to see:
- **Desktop** (wide): Multi-column layouts
- **Tablet** (medium): 2-column layouts
- **Mobile** (narrow): Single column, touch-optimized

---

## 🎯 Things to Test

### Data Loading
- [ ] Upload Excel file works
- [ ] Data displays in table
- [ ] All 184 districts show

### INFORM Dashboard
- [ ] Overview tab loads
- [ ] Quick stats are correct
- [ ] Dimension cards show gauges
- [ ] Map preview appears

### Map Functionality
- [ ] Map loads Tanzania boundaries
- [ ] Can zoom in/out
- [ ] Can click areas
- [ ] Info panel shows data
- [ ] Colors match risk levels

### Interactivity
- [ ] Hover tooltips work
- [ ] Click navigation works
- [ ] Tabs switch smoothly
- [ ] Animations are smooth

---

## 🐛 Troubleshooting

### Problem: npm command not found
**Solution:** Install Node.js (see Step 1)

### Problem: Port 5173 already in use
**Solution:**
```bash
# Kill existing process
killall node

# Or use different port
npm run dev -- --port 5174
```

### Problem: Map not showing
**Solution:** Check GeoJSON files:
```bash
ls -lh /home/kaijage/model/inform/masuby-model/public/geojson/
# Should show ADM1.geojson and ADM2.geojson
```

### Problem: Charts not loading
**Solution:** Check browser console (F12) for errors

### Problem: Slow performance
**Solution:**
- Close other browser tabs
- Use Chrome or Firefox (not Safari)
- Check if dataset is too large

---

## 📸 Take Screenshots!

Capture these views:
1. Dashboard Overview with all cards
2. Map View with a district selected
3. Sunburst hierarchy fully displayed
4. Radar chart with 3+ districts
5. Rankings table
6. Mobile view (narrow browser)

---

## 🎓 Tips for Best Experience

### For Presentations:
1. Use **Overview Tab** for executive summary
2. Switch to **Map View** for spatial patterns
3. Use **Compare Tab** for multi-area analysis
4. Show **Framework Tab** to explain methodology

### For Analysis:
1. Start with **Rankings** to identify priorities
2. Use **Map View** to see spatial distribution
3. Select high-risk areas
4. **Compare** them to understand differences
5. Check **Framework** to see contributing factors

### For Reports:
1. Take screenshots of each visualization
2. Export data from tables (Phase 2 will add PDF export)
3. Document findings in separate document

---

## ✨ What Makes It Special

### vs. Static Images (Matplotlib):
- ✅ **Interactive** - Click, hover, explore
- ✅ **All-in-one** - Everything in one dashboard
- ✅ **Real-time** - Instant updates
- ✅ **Responsive** - Works on any screen
- ✅ **Shareable** - Send URL, not files

### International Standards:
- ✅ INFORM Methodology v2024
- ✅ UN-OCHA colors
- ✅ Professional cartography
- ✅ Accessible design

---

## 🚀 Next: Phase 2 Features

After you've explored Phase 1, we can add:
- 📄 **PDF Export** - Generate reports
- 📊 **Advanced Analytics** - Trends, correlations, clusters
- 👥 **Multi-user** - Login, save views, collaborate
- 🔔 **Alerts** - Get notified of changes
- 📈 **What-if Scenarios** - Test interventions

See [TESTING_AND_PHASE2_PLAN.md](TESTING_AND_PHASE2_PLAN.md) for details.

---

## 💬 Getting Help

If you encounter issues:
1. Check browser console (F12 → Console tab)
2. Look for error messages
3. Check the troubleshooting section above
4. Review [PHASE1_IMPLEMENTATION_SUMMARY.md](PHASE1_IMPLEMENTATION_SUMMARY.md)

---

**Enjoy exploring the INFORM Tanzania system! 🇹🇿✨**

Your feedback will help prioritize Phase 2 features!
