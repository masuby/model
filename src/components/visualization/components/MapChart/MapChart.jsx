// Modified: MapChart.jsx
import React, { useState, useEffect } from 'react';
import MapDisplay from './MapDisplay';
import InfoPanel from './InfoPanel';
import HoverPopup from './HoverPopup';
import { detectDataType, getColorForValue, getStyleForFeature } from './utils';
import { tanzaniaRegions } from './tanzania-data';
import 'leaflet/dist/leaflet.css';
import './MapChart.css';

function MapChart({ sheetData = [], isMiniature = false, dataColumns = [] }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtData, setDistrictData] = useState(null);
  const [regionData, setRegionData] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [dataTypes, setDataTypes] = useState({});
  const [colorScales, setColorScales] = useState({});
  const [adm1GeoJson, setAdm1GeoJson] = useState(null);
  const [adm2GeoJson, setAdm2GeoJson] = useState(null);
  const [focusedBounds, setFocusedBounds] = useState(null);
  const [clickLevel, setClickLevel] = useState('region');

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
      const district = selectedRegion.districts.find(d => d.name === selectedDistrict.name);
      if (district) {
        const padding = 0.2;
        setFocusedBounds([
          [district.lat - padding, district.lng - padding],
          [district.lat + padding, district.lng + padding]
        ]);
      }
    } else if (selectedRegion) {
      const region = tanzaniaRegions.find(r => r.name === selectedRegion.name);
      if (region && region.districts.length > 0) {
        const lats = region.districts.map(d => d.lat);
        const lngs = region.districts.map(d => d.lng);
        const padding = 0.5; // Larger padding for region view
        const minLat = Math.min(...lats) - padding;
        const maxLat = Math.max(...lats) + padding;
        const minLng = Math.min(...lngs) - padding;
        const maxLng = Math.max(...lngs) + padding;
        setFocusedBounds([[minLat, minLng], [maxLat, maxLng]]);
      }
    } else {
      setFocusedBounds(null);
    }
  }, [selectedRegion, selectedDistrict]);

  const handleMapClick = (feature, isDistrict) => {
    if (isDistrict) {
      const districtName = feature.properties?.shapeName;
      let regionName = null;
      for (const r of tanzaniaRegions) {
        if (r.districts.some(d => d.name === districtName)) {
          regionName = r.name;
          break;
        }
      }
      if (regionName) {
        setSelectedRegion({ name: regionName, districts: tanzaniaRegions.find(r => r.name === regionName).districts });
        setSelectedDistrict({ name: districtName });
        setClickLevel('district');
      }
    } else {
      const regionName = feature.properties?.shapeName;
      const region = tanzaniaRegions.find(r => r.name === regionName);
      if (region) {
        setSelectedRegion({ name: regionName, districts: region.districts });
        setSelectedDistrict(null);
        setClickLevel('region');
      }
    }
  };

  const handleHover = (info) => {
    setHoverInfo(info);
  };

  const handleHoverLeave = () => {
    setHoverInfo(null);
  };

  const handleClearFocus = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setFocusedBounds(null);
    setClickLevel('region');
  };

  const mapCenter = [-6.3690, 34.8888];
  const mapZoom = isMiniature ? 5 : 5; // Default small view (country level) for both

  if (!adm1GeoJson || !adm2GeoJson) {
    return <div className="map-chart-container">Loading map boundaries...</div>;
  }

  return (
    <div className={`map-chart-container ${isMiniature ? 'miniature' : ''}`}>
      {/* Focus Controls - Only in full view */}
      {!isMiniature && (selectedRegion || selectedDistrict) && (
        <div className="focus-controls">
          <button onClick={handleClearFocus} className="clear-focus-btn">
            Show All Tanzania
          </button>
          <span className="focus-info">
            {selectedDistrict ? 
              `Viewing: ${selectedDistrict.name} District, ${selectedRegion.name} Region` : 
              selectedRegion ? `Viewing: ${selectedRegion.name} Region` : ''
            }
          </span>
        </div>
      )}

      {/* Map Display - Fills entire remaining space */}
      <div className={`map-content-full ${isMiniature ? 'miniature' : ''}`}>
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
          onMapClick={handleMapClick}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          focusedBounds={focusedBounds}
          clickLevel={clickLevel}
          isMiniature={isMiniature}
        />
      </div>

      {/* Selected Info Panel - Only in full view */}
      {!isMiniature && (selectedRegion || selectedDistrict) && (
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