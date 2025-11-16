// Modified: MapDisplay.jsx
import React, { useCallback, useRef, useEffect } from 'react';
import { TileLayer, GeoJSON, Marker, MapContainer, ScaleControl } from 'react-leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import Legend from './Legend';
import { getStyleForFeature, getColorForValue, getScaleForColumn, getDataTypeForColumn } from './utils';
import { tanzaniaRegions } from './tanzania-data';
import './MapChart.css';

function MapDisplay({ 
  adm1GeoJson, 
  adm2GeoJson, 
  selectedRegion, 
  selectedDistrict, 
  dataColumns, 
  sheetData, 
  dataTypes, 
  colorScales, 
  regionData, 
  districtData, 
  onHover, 
  onHoverLeave, 
  onMapClick,
  mapCenter, 
  mapZoom, 
  focusedBounds,
  clickLevel,
  isMiniature = false
}) {
  const mapRef = useRef();
  
  // Tanzania bounds
  const tanzaniaBounds = [
    [-11.75, 29.34],
    [-1.05, 40.43]
  ];

  // Effect to handle zooming to focused bounds
  useEffect(() => {
    if (mapRef.current && focusedBounds) {
      const map = mapRef.current;
      try {
        const bounds = latLngBounds(focusedBounds);
        map.fitBounds(bounds, { padding: [20, 20], duration: 1 });
      } catch (error) {
        console.error('Error setting bounds:', error);
      }
    } else if (mapRef.current && !focusedBounds) {
      // Reset to show all Tanzania (small view)
      const map = mapRef.current;
      map.setView(mapCenter, mapZoom, { animate: true, duration: 1 });
    }
  }, [focusedBounds, mapCenter, mapZoom]);

  // Find lat/lng for a region
  const getRegionCoords = (regionName) => {
    const region = tanzaniaRegions.find(r => r.name === regionName);
    return region ? { lat: region.lat, lng: region.lng } : { lat: null, lng: null };
  };

  // Find lat/lng for a district
  const getDistrictCoords = (districtName, regionName) => {
    const region = tanzaniaRegions.find(r => r.name === regionName);
    if (!region) return { lat: null, lng: null };
    const district = region.districts.find(d => d.name === districtName);
    return district ? { lat: district.lat, lng: district.lng } : getRegionCoords(regionName);
  };

  // Handle feature click
  const handleFeatureClick = useCallback((feature, isDistrict) => {
    if (onMapClick) {
      onMapClick(feature, isDistrict);
    }
  }, [onMapClick]);

  // ADM1 onEachFeature
  const onEachAdm1 = useCallback((feature, layer) => {
    const regionName = feature.properties?.shapeName;
    const coords = getRegionCoords(regionName);
    
    if (tanzaniaRegions.find(r => r.name === regionName)) {
      layer.on({
        mouseover: () => {
          const dataValues = {};
          dataColumns.forEach(column => {
            const regionRows = sheetData.filter(row => row.ADM1_NAME === regionName);
            const avgValue = regionRows.length > 0 ? 
              regionRows.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0) / regionRows.length : 
              'No data';
            dataValues[column] = typeof avgValue === 'number' ? avgValue.toFixed(2) : avgValue;
          });
          
          onHover({ 
            title: regionName, 
            data: dataValues, 
            isDistrict: false,
            dataColumns: dataColumns,
            lat: coords.lat,
            lng: coords.lng
          });
        },
        mouseout: onHoverLeave,
        click: () => handleFeatureClick(feature, false),
      });
    }
  }, [dataColumns, sheetData, onHover, onHoverLeave, handleFeatureClick]);

  // ADM2 onEachFeature
  const onEachAdm2 = useCallback((feature, layer) => {
    const districtName = feature.properties?.shapeName;
    let regionName = null;
    for (const r of tanzaniaRegions) {
      if (r.districts.some(d => d.name === districtName)) {
        regionName = r.name;
        break;
      }
    }
    
    if (regionName) {
      const coords = getDistrictCoords(districtName, regionName);
      layer.on({
        mouseover: () => {
          const row = sheetData.find(r => r.ADM2_NAME === districtName && r.ADM1_NAME === regionName);
          const dataValues = {};
          dataColumns.forEach(column => {
            dataValues[column] = row ? (row[column] || 'No data') : 'No data';
          });
          
          onHover({ 
            title: districtName, 
            data: dataValues, 
            isDistrict: true, 
            region: regionName,
            dataColumns: dataColumns,
            lat: coords.lat,
            lng: coords.lng
          });
        },
        mouseout: onHoverLeave,
        click: () => handleFeatureClick(feature, true),
      });
    }
  }, [dataColumns, sheetData, onHover, onHoverLeave, handleFeatureClick]);

  // ADM1 style with click highlighting
  const adm1Style = useCallback((feature) => {
    const regionName = feature.properties?.shapeName;
    
    // Default style when no columns selected
    if (dataColumns.length === 0) {
      const baseStyle = getStyleForFeature(null, 'numerical', {}, false, false);
      return {
        ...baseStyle,
        className: selectedRegion?.name === regionName ? 'region-clicked' : ''
      };
    }
    
    // Use first column for coloring
    const primaryColumn = dataColumns[0];
    const dataType = getDataTypeForColumn(dataTypes, primaryColumn);
    const scale = getScaleForColumn(colorScales, primaryColumn);
    
    const regionRows = sheetData.filter(row => row.ADM1_NAME === regionName);
    const avgValue = regionRows.length > 0 ? 
      regionRows.reduce((sum, row) => sum + (parseFloat(row[primaryColumn]) || 0), 0) / regionRows.length : 
      null;
    
    const isSelected = selectedRegion?.name === regionName && !selectedDistrict;
    const baseStyle = getStyleForFeature(avgValue, dataType, scale, isSelected, false);
    
    return {
      ...baseStyle,
      className: isSelected ? 'region-clicked' : ''
    };
  }, [sheetData, dataColumns, selectedRegion, selectedDistrict, dataTypes, colorScales]);

  // ADM2 style with click highlighting
  const adm2Style = useCallback((feature) => {
    const districtName = feature.properties?.shapeName;
    
    // Default style when no columns selected
    if (dataColumns.length === 0) {
      const baseStyle = getStyleForFeature(null, 'numerical', {}, false, false);
      return {
        ...baseStyle,
        className: selectedDistrict?.name === districtName ? 'district-clicked' : ''
      };
    }
    
    let regionName = null;
    for (const r of tanzaniaRegions) {
      if (r.districts.some(d => d.name === districtName)) {
        regionName = r.name;
        break;
      }
    }
    
    // Use first column for coloring
    const primaryColumn = dataColumns[0];
    const dataType = getDataTypeForColumn(dataTypes, primaryColumn);
    const scale = getScaleForColumn(colorScales, primaryColumn);
    
    const row = regionName ? sheetData.find(r => r.ADM2_NAME === districtName && r.ADM1_NAME === regionName) : null;
    const value = row ? row[primaryColumn] : null;
    const isSelected = selectedDistrict?.name === districtName;
    const baseStyle = getStyleForFeature(value, dataType, scale, isSelected, false);
    
    return {
      ...baseStyle,
      className: isSelected ? 'district-clicked' : ''
    };
  }, [sheetData, dataColumns, selectedDistrict, dataTypes, colorScales]);

  // Markers - Only show in full view
  const getRegionIcon = () => {
    let content = `📍<br/><strong>${selectedRegion.name}</strong><br/>`;
    dataColumns.forEach((column, index) => {
      if (index < 3) {
        const value = regionData?.[column]?.avgValue || 'N/A';
        content += `${column}: ${value}<br/>`;
      }
    });
    if (dataColumns.length > 3) {
      content += `...and ${dataColumns.length - 3} more`;
    }
    
    return divIcon({ 
      html: `<div class="custom-marker">${content}</div>`, 
      className: 'custom-div-icon', 
      iconSize: null, 
      iconAnchor: [0, 0] 
    });
  };

  const getDistrictIcon = () => {
    let content = `📍<br/><strong>${selectedDistrict.name}</strong><br/>`;
    dataColumns.forEach((column, index) => {
      if (index < 3) {
        const value = districtData?.displayData?.[column] || 'N/A';
        content += `${column}: ${value}<br/>`;
      }
    });
    if (dataColumns.length > 3) {
      content += `...and ${dataColumns.length - 3} more`;
    }
    
    return divIcon({ 
      html: `<div class="custom-marker">${content}</div>`, 
      className: 'custom-div-icon', 
      iconSize: null, 
      iconAnchor: [0, 0] 
    });
  };

  return (
    <div className="map-display-container">
      <MapContainer 
        ref={mapRef}
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        maxBounds={tanzaniaBounds}
        maxBoundsViscosity={1.0}
        minZoom={5}
        maxZoom={12}
        whenCreated={(mapInstance) => { mapRef.current = mapInstance }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
        />
        <GeoJSON 
          key={`adm1-${dataColumns.join('-')}`}
          data={adm1GeoJson} 
          style={adm1Style} 
          onEachFeature={onEachAdm1} 
        />
        <GeoJSON 
          key={`adm2-${dataColumns.join('-')}`}
          data={adm2GeoJson} 
          style={adm2Style} 
          onEachFeature={onEachAdm2} 
        />
        
        {/* Only show markers in full view */}
        {!isMiniature && selectedRegion && !selectedDistrict && selectedRegion.lat && selectedRegion.lng && (
          <Marker position={[selectedRegion.lat, selectedRegion.lng]} icon={getRegionIcon()} />
        )}
        {!isMiniature && selectedDistrict && selectedDistrict.lat && selectedDistrict.lng && (
          <Marker position={[selectedDistrict.lat, selectedDistrict.lng]} icon={getDistrictIcon()} />
        )}
        
        {/* Legend - Only show in full view */}
        {!isMiniature && (
          <Legend 
            dataColumns={dataColumns}
            dataTypes={dataTypes}
            colorScales={colorScales}
            position="topright"
          />
        )}
        
        <ScaleControl position="bottomright" imperial={false} metric={true} />
      </MapContainer>
      
      {/* Attribution - Only show in full view */}
      {!isMiniature && (
        <div className="map-attribution">
          <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">View Larger Map</a><br />
          Boundaries: <a href="https://www.geoboundaries.org/" target="_blank" rel="noopener noreferrer">geoBoundaries</a>
        </div>
      )}
    </div>
  );
}

export default MapDisplay;