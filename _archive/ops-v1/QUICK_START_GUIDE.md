# INFORM Tanzania - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Application

```bash
cd /home/kaijage/model/inform/masuby-model
npm run dev
```

Access at: `http://localhost:5173`

---

## 📊 Using INFORM Visualizations

### Step 1: Load Data
1. Click **"Choose Excel"** dropdown
2. Select `Tanzania - Country Model Template.xlsx`
3. Wait for data to load (184 districts)

### Step 2: Open INFORM Dashboard
1. Click **"Select Visualization"** dropdown
2. Under **"INFORM Framework"**, choose:
   - **🎯 INFORM Risk Dashboard** ← Start here!

---

## 🎯 INFORM Risk Dashboard Features

### Overview Tab
- **Quick Stats** - 6 key metrics at a glance
- **Dimension Cards** - Interactive gauges for Hazard, Vulnerability, Coping Capacity
- **Mini Map Preview** - Click to see full map
- **Top 5 Rankings** - Highest risk districts

### Map View Tab
- **Interactive Choropleth** with INFORM colors
- **Indicator Selector** - Choose any of 50+ indicators
- **Admin Level Toggle** - Switch between Regions (ADM1) and Districts (ADM2)
- **Click Any Area** - See detailed risk profile
- **Hover for Info** - Instant data preview

### Compare Tab
- **Multi-area Radar** - Compare up to 8 districts
- **4 Comparison Profiles:**
  - Core Dimensions (3 axes)
  - Hazard Breakdown (6 axes)
  - Vulnerability Breakdown (5 axes)
  - Coping Capacity (6 axes)
- **Easy Area Selection** - Dropdown with all districts

### Framework Tab
- **Sunburst Hierarchy** - Visual INFORM indicator tree
- **Click to Explore** - Drill down from Risk → Indicators
- **Breadcrumb Navigation** - Track your path
- **Methodology Info** - Learn about INFORM

### Rankings Tab
- **Full District Rankings** - All 184 districts sorted by risk
- **Click Any Row** - Jump to that district's profile
- **Risk Classification** - Color-coded badges

---

## 🌐 Other INFORM Visualizations

### Indicator Hierarchy (Sunburst)
- Shows ALL indicators in one view
- Color-coded by risk level
- Interactive exploration

### Dimension Comparison (Radar)
- Standalone radar chart
- Compare areas across multiple dimensions
- Export-ready visualization

### Risk Choropleth Map
- Full-screen professional map
- INFORM standard colors
- Publication-quality

---

## 🎨 Understanding Colors

### Risk Classification Scale
- 🟢 **Very Low:** 0.0 - 2.0 (Green)
- 🟢 **Low:** 2.0 - 3.5 (Light Green)
- 🟡 **Medium:** 3.5 - 5.0 (Amber)
- 🟠 **High:** 5.0 - 6.5 (Orange)
- 🔴 **Very High:** 6.5 - 10.0 (Red)

### Dimension Colors
- 🔴 **Hazard** - Red
- 🟠 **Vulnerability** - Orange
- 🔵 **Coping Capacity** - Blue
- 🟤 **Risk (Composite)** - Brown

---

## 💡 Pro Tips

### Exploring Data
1. **Start with Overview** - Get the big picture
2. **Check Rankings** - Identify high-risk areas
3. **Select an Area** - Click on map or ranking
4. **Compare Similar Areas** - Use radar chart
5. **Drill Down** - Explore sunburst for root causes

### Best Workflows

**For Policy Makers:**
1. Overview → See national summary
2. Rankings → Identify priority areas
3. Map View → Spatial patterns
4. Framework → Understand indicator contributions

**For Analysts:**
1. Map View → Select indicator of interest
2. Rankings → Top/bottom performers
3. Compare → Multi-area analysis
4. Framework → Indicator relationships

**For Presentations:**
1. Overview → Executive summary slide
2. Map View → Spatial visualization
3. Dimension Cards → Key metrics
4. Rankings → Priority list

---

## 📥 Data Requirements

### Excel File Format
- Must contain ADM2_NAME (district names)
- Must contain ADM1_NAME (region names)
- Must contain INFORM indicators:
  - RISK
  - HAZARD, VULNERABILITY, LACK OF COPING CAPACITY
  - Sub-dimensions and components
  - Individual indicators

### Supported Files
✅ Tanzania - Country Model Template.xlsx
✅ Generic - Country Model Template.xlsx
✅ Any INFORM-compliant Excel file

---

## 🔧 Troubleshooting

### Map Not Loading?
- Check GeoJSON files exist:
  - `/public/geojson/ADM1.geojson`
  - `/public/geojson/ADM2.geojson`
- Copy from: `/home/kaijage/model/inform/Boundaries/`

### Colors Not Showing?
- Ensure data has numeric values (not text)
- Check column names match INFORM framework
- Values should be 0-10 scale

### Dashboard Slow?
- Check dataset size (should be < 1000 rows)
- Clear browser cache
- Close unused tabs

---

## 📚 Understanding INFORM

### INFORM Formula
```
RISK = (Hazard × Vulnerability × Lack of Coping Capacity)^(1/3)
```

Uses **geometric mean** to ensure:
- High risk in ONE dimension cannot be compensated by low risk in others
- Balanced assessment across all dimensions

### Three Dimensions

**1. Hazard & Exposure**
- What could happen?
- Natural hazards (floods, droughts, earthquakes, etc.)
- Human hazards (conflict, accidents, etc.)

**2. Vulnerability**
- How susceptible is the population?
- Socio-economic factors (poverty, dependency, etc.)
- Vulnerable groups (IDPs, health conditions, etc.)

**3. Lack of Coping Capacity**
- Can they handle it?
- Infrastructure (healthcare, water, education, etc.)
- Institutional (governance, DRR implementation, etc.)

---

## 🎓 Key Concepts

### Risk Levels
- **Very High (6.5-10):** Immediate attention required
- **High (5.0-6.5):** Priority intervention needed
- **Medium (3.5-5.0):** Monitoring and preparation
- **Low (2.0-3.5):** Maintain resilience
- **Very Low (0-2.0):** Good conditions

### Aggregation Methods
- **Geometric Mean:** Used for Risk (top level)
- **Arithmetic Mean:** Used for Vulnerability, Coping Capacity
- **Maximum:** Used for Hazard (worst case)

### Admin Levels
- **ADM0:** Country (Tanzania)
- **ADM1:** Regions (31 total)
- **ADM2:** Districts (184 total)
- **ADM3:** Wards (future)

---

## 🆘 Support

### Documentation
- Full Implementation: `PHASE1_IMPLEMENTATION_SUMMARY.md`
- Framework Config: `src/config/informFramework.js`

### Common Questions

**Q: Can I export visualizations?**
A: Use browser's "Save as PDF" or screenshot tools (Phase 2 will add export buttons)

**Q: Can I add my own indicators?**
A: Yes! Update `informFramework.js` to add new indicators

**Q: Works on mobile?**
A: Yes! Fully responsive design

**Q: Can I compare regions instead of districts?**
A: Yes! Toggle Admin Level to "Regions" in Map View

---

## ✨ What Makes This Professional?

### vs. Static Images (Matplotlib)
- ✅ **Interactive** - Click, hover, zoom, pan
- ✅ **Real-time** - Instant filtering and updates
- ✅ **Multi-view** - All data in one dashboard
- ✅ **Responsive** - Works on any screen
- ✅ **Shareable** - Send URL, not files

### International Standards
- ✅ INFORM Methodology v2024
- ✅ UN-OCHA color scales
- ✅ WCAG accessibility
- ✅ Professional cartography

### User Experience
- ✅ Intuitive navigation
- ✅ Rich tooltips
- ✅ Smooth animations
- ✅ Clear typography
- ✅ Consistent design

---

## 🎯 Next: Try It Out!

1. **Start with Overview Tab** - Get familiar
2. **Click Around** - Everything is interactive
3. **Select Your District** - Explore your area
4. **Compare with Neighbors** - Use radar chart
5. **Discover Patterns** - Use the map

**Enjoy exploring Tanzania's risk landscape! 🇹🇿**
