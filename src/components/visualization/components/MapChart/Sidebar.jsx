import React from 'react';
import { getColorForValue, getScaleForColumn, getDataTypeForColumn } from './utils';
import './MapChart.css';

function Sidebar({ regions, expandedRegion, selectedRegion, selectedDistrict, onRegionClick, onDistrictClick, onHover, onHoverLeave, sheetData, dataColumns, dataTypes, colorScales }) {
  const handleRegionMouseEnter = (region) => {
    if (sheetData.length > 0 && dataColumns.length > 0) {
      const regionRows = sheetData.filter(row => row.ADM1_NAME === region.name);
      const dataValues = {};
      dataColumns.forEach(column => {
        const avgValue = regionRows.length > 0 ? 
          regionRows.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0) / regionRows.length : 
          'No data';
        dataValues[column] = typeof avgValue === 'number' ? avgValue.toFixed(2) : avgValue;
      });
      
      onHover({ 
        title: region.name, 
        data: dataValues, 
        isDistrict: false,
        dataColumns: dataColumns,
        lat: region.lat,
        lng: region.lng
      });
    } else {
      onHover({ 
        title: region.name, 
        data: {}, 
        isDistrict: false,
        dataColumns: dataColumns,
        lat: region.lat,
        lng: region.lng
      });
    }
  };

  const handleDistrictMouseEnter = (district, regionName) => {
    if (sheetData.length > 0 && dataColumns.length > 0) {
      const row = sheetData.find(r => r.ADM2_NAME === district.name && r.ADM1_NAME === regionName);
      const dataValues = {};
      dataColumns.forEach(column => {
        dataValues[column] = row ? (row[column] || 'No data') : 'No data';
      });
      
      onHover({ 
        title: district.name, 
        data: dataValues, 
        isDistrict: true, 
        region: regionName,
        dataColumns: dataColumns,
        lat: district.lat,
        lng: district.lng
      });
    } else {
      onHover({ 
        title: district.name, 
        data: {}, 
        isDistrict: true, 
        region: regionName,
        dataColumns: dataColumns,
        lat: district.lat,
        lng: district.lng
      });
    }
  };

  // Get color for district based on first data column with safe access
  const getDistrictColor = (district, regionName) => {
    if (dataColumns.length === 0) return '#9E9E9E';
    
    const primaryColumn = dataColumns[0];
    const dataType = getDataTypeForColumn(dataTypes, primaryColumn);
    const scale = getScaleForColumn(colorScales, primaryColumn);
    
    const row = sheetData.find(r => r.ADM2_NAME === district.name && r.ADM1_NAME === regionName);
    const value = row ? row[primaryColumn] : null;
    
    return getColorForValue(value, dataType, scale);
  };

  return (
    <div className="sidebar-container">
      <h3>Tanzania Regions</h3>
      {dataColumns.length > 0 && (
        <div className="data-columns-info">
          <strong>Displaying:</strong> {dataColumns.join(', ')}
        </div>
      )}
      <div className="regions-list">
        {regions.map(region => (
          <div key={region.name}>
            <div
              className={`region-item ${selectedRegion?.name === region.name ? 'selected' : ''}`}
              style={{ borderLeft: `4px solid ${getColorForValue(null, 'numerical', {})}` }}
              onClick={() => onRegionClick(region)}
              onMouseEnter={() => handleRegionMouseEnter(region)}
              onMouseLeave={onHoverLeave}
            >
              {region.name}
              <span className="toggle-icon">{expandedRegion === region.name ? '−' : '+'}</span>
            </div>
            {expandedRegion === region.name && (
              <div className="districts-container">
                <div className="districts-list">
                  {region.districts.map(district => (
                    <div
                      key={district.name}
                      className={`district-item ${selectedDistrict?.name === district.name ? 'selected' : ''}`}
                      style={{ borderLeft: `4px solid ${getDistrictColor(district, region.name)}` }}
                      onClick={() => onDistrictClick(district)}
                      onMouseEnter={() => handleDistrictMouseEnter(district, region.name)}
                      onMouseLeave={onHoverLeave}
                    >
                      {district.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;