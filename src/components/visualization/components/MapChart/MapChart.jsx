import React, { useState, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import Sidebar from './Sidebar';
import MapDisplay from './MapDisplay';
import InfoPanel from './InfoPanel';
import HoverPopup from './HoverPopup';
import { detectDataType, getColorForValue, getStyleForFeature } from './utils';
import { tanzaniaRegions } from './tanzania-data';
import 'leaflet/dist/leaflet.css';
import './MapChart.css';

function MapChart({ sheetData = [] }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [dataColumns, setDataColumns] = useState([]); // Changed to array for multiple selection
  const [districtData, setDistrictData] = useState(null);
  const [regionData, setRegionData] = useState(null);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [dataTypes, setDataTypes] = useState({}); // Object to store types for each column
  const [colorScales, setColorScales] = useState({}); // Object to store scales for each column
  const [adm1GeoJson, setAdm1GeoJson] = useState(null);
  const [adm2GeoJson, setAdm2GeoJson] = useState(null);
  const [focusedBounds, setFocusedBounds] = useState(null); // For zooming to selected area

  // Load GeoJSON
  useEffect(() => {
    fetch('/geojson/ADM1.geojson')
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to load ADM1')))
      .then(setAdm1GeoJson)
      .catch(err => console.error('Error loading ADM1 GeoJSON:', err));

    fetch('/geojson/ADM2.geojson')
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to load ADM2')))
      .then(setAdm2GeoJson)
      .catch(err => console.error('Error loading ADM2 GeoJSON:', err));
  }, []);

  // Initialize columns
  useEffect(() => {
    if (sheetData.length > 0) {
      const columns = Object.keys(sheetData[0]).filter(col => 
        !['COUNTRY', 'ADM1_NAME', 'ADM2_NAME', 'ISO3', 'ADM1_PCODE', 'ADM2_PCODE'].includes(col)
      );
      setAvailableColumns(columns);
    } else {
      setAvailableColumns([]);
      setDataColumns([]);
    }
  }, [sheetData]);

  // Detect type and scale when dataColumns change
  useEffect(() => {
    if (sheetData.length > 0 && dataColumns.length > 0) {
      const newDataTypes = {};
      const newColorScales = {};
      
      dataColumns.forEach(column => {
        const { type, scale } = detectDataType(sheetData, column);
        newDataTypes[column] = type;
        newColorScales[column] = scale;
      });
      
      setDataTypes(newDataTypes);
      setColorScales(newColorScales);
    } else {
      setDataTypes({});
      setColorScales({});
    }
  }, [sheetData, dataColumns]);

  // Region summary for multiple columns
  useEffect(() => {
    if (selectedRegion && !selectedDistrict && dataColumns.length > 0) {
      const regionRows = sheetData.filter(row => row.ADM1_NAME === selectedRegion.name);
      const summary = {};
      
      dataColumns.forEach(column => {
        const values = regionRows.map(row => row[column]).filter(v => v != null);
        if (values.length > 0) {
          const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
          const avg = numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : null;
          summary[column] = { avgValue: avg?.toFixed(2) || 'N/A', count: values.length };
        } else {
          summary[column] = { avgValue: 'No data', count: 0 };
        }
      });
      
      setRegionData(summary);
    } else {
      setRegionData(null);
    }
  }, [selectedRegion, selectedDistrict, sheetData, dataColumns]);

  // District data for multiple columns
  useEffect(() => {
    if (selectedDistrict && selectedRegion && dataColumns.length > 0) {
      const districtRow = sheetData.find(row => 
        row.ADM2_NAME === selectedDistrict.name && row.ADM1_NAME === selectedRegion.name
      );
      
      if (districtRow) {
        const displayData = {};
        dataColumns.forEach(column => {
          displayData[column] = districtRow[column] || 'No data';
        });
        setDistrictData({ ...districtRow, displayData });
      } else {
        setDistrictData(null);
      }
    } else {
      setDistrictData(null);
    }
  }, [selectedDistrict, selectedRegion, sheetData, dataColumns]);

  // Calculate bounds for focused area
  useEffect(() => {
    if (selectedDistrict && selectedRegion) {
      // Focus on district
      const district = selectedRegion.districts.find(d => d.name === selectedDistrict.name);
      if (district) {
        // Create bounds around the district with some padding
        const padding = 0.2;
        setFocusedBounds([
          [district.lat - padding, district.lng - padding],
          [district.lat + padding, district.lng + padding]
        ]);
      }
    } else if (selectedRegion) {
      // Focus on region - calculate bounds from all districts in the region
      const region = tanzaniaRegions.find(r => r.name === selectedRegion.name);
      if (region && region.districts.length > 0) {
        const lats = region.districts.map(d => d.lat);
        const lngs = region.districts.map(d => d.lng);
        const padding = 0.3;
        setFocusedBounds([
          [Math.min(...lats) - padding, Math.min(...lngs) - padding],
          [Math.max(...lats) + padding, Math.max(...lngs) + padding]
        ]);
      }
    } else {
      // Show whole Tanzania
      setFocusedBounds(null);
    }
  }, [selectedRegion, selectedDistrict]);

  const handleRegionClick = (region) => {
    if (expandedRegion === region.name) {
      setExpandedRegion(null);
      setSelectedRegion(null);
      setSelectedDistrict(null);
      setDistrictData(null);
      setRegionData(null);
      setFocusedBounds(null);
    } else {
      setExpandedRegion(region.name);
      setSelectedRegion(region);
      setSelectedDistrict(null);
      setDistrictData(null);
    }
  };

  const handleDistrictClick = (district) => {
    setSelectedDistrict(district);
  };

  const handleDataColumnChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    // Limit to maximum 5 selections
    const limitedSelection = selectedOptions.slice(0, 5);
    setDataColumns(limitedSelection);
  };

  const handleHover = (info) => setHoverInfo(info);
  const handleHoverLeave = () => setHoverInfo(null);

  const handleClearFocus = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setFocusedBounds(null);
    setExpandedRegion(null);
  };

  const mapCenter = [-6.3690, 34.8888];
  const mapZoom = 6;

  if (!adm1GeoJson || !adm2GeoJson) {
    return <div className="map-chart-container">Loading map boundaries...</div>;
  }

  return (
    <div className="map-chart-container">
      {/* Multiple Column Selector */}
      {sheetData.length > 0 && (
        <div className="data-column-selector">
          <label htmlFor="data-column">Display Data (Max 5): </label>
          <select 
            id="data-column" 
            multiple 
            value={dataColumns} 
            onChange={handleDataColumnChange}
            size={Math.min(availableColumns.length, 6)}
          >
            {availableColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <div className="selection-info">
            {dataColumns.length > 0 && (
              <span>Selected: {dataColumns.join(', ')}</span>
            )}
            {dataColumns.length >= 5 && (
              <span className="max-warning"> (Maximum reached)</span>
            )}
          </div>
        </div>
      )}

      {/* Focus Controls */}
      {(selectedRegion || selectedDistrict) && (
        <div className="focus-controls">
          <button onClick={handleClearFocus} className="clear-focus-btn">
            Show All Tanzania
          </button>
          <span className="focus-info">
            Currently viewing: {selectedDistrict ? 
              `${selectedDistrict.name} District, ${selectedRegion.name} Region` : 
              `${selectedRegion.name} Region`
            }
          </span>
        </div>
      )}

      <div className="map-content">
        <Sidebar
          regions={tanzaniaRegions}
          expandedRegion={expandedRegion}
          selectedRegion={selectedRegion}
          selectedDistrict={selectedDistrict}
          onRegionClick={handleRegionClick}
          onDistrictClick={handleDistrictClick}
          onHover={handleHover}
          onHoverLeave={handleHoverLeave}
          sheetData={sheetData}
          dataColumns={dataColumns}
          dataTypes={dataTypes}
          colorScales={colorScales}
        />

        <MapDisplay
          adm1GeoJson={adm1GeoJson}
          adm2GeoJson={adm2GeoJson}
          selectedRegion={selectedRegion}
          selectedDistrict={selectedDistrict}
          dataColumns={dataColumns}
          sheetData={sheetData}
          dataTypes={dataTypes}
          colorScales={colorScales}
          regionData={regionData}
          districtData={districtData}
          onHover={handleHover}
          onHoverLeave={handleHoverLeave}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          focusedBounds={focusedBounds}
        />
      </div>

      {/* Selected Info Panel */}
      {(selectedRegion || selectedDistrict) && (
        <InfoPanel
          selectedRegion={selectedRegion}
          selectedDistrict={selectedDistrict}
          districtData={districtData}
          regionData={regionData}
          dataColumns={dataColumns}
        />
      )}

      {/* Hover Popup */}
      {hoverInfo && <HoverPopup info={hoverInfo} dataColumns={dataColumns} />}

      {sheetData.length === 0 && (
        <div className="data-warning">
          <p>⚠️ No Excel data loaded. Please upload an Excel file with Tanzania district data.</p>
        </div>
      )}
    </div>
  );
}

export default MapChart;