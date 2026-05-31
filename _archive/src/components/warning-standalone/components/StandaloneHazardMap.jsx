/**
 * STANDALONE HAZARD MAP
 * Simplified interactive map for district selection
 */

import React, { useState } from 'react';
import { REGIONS } from '../data/hazardConfig';

const StandaloneHazardMap = ({
  selectedHazardType,
  selectedDistricts = {},
  onDistrictSelect,
  riskData = null,
  warningLevel = 'Advisory',
  readOnly = false
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // Get color based on warning level
  const getLevelColor = (level) => {
    const colors = {
      'Advisory': '#FFFF00',
      'Warning': '#FF6600',
      'Major Warning': '#FF0000',
      'ADVISORY': '#FFFF00',
      'WARNING': '#FF6600',
      'MAJOR WARNING': '#FF0000'
    };
    return colors[level] || '#FFC107';
  };

  // Get all districts
  const allDistricts = Object.values(REGIONS).flat();

  // Get distinct regions in selected districts
  const getRegionForDistrict = (district) => {
    for (const [region, districts] of Object.entries(REGIONS)) {
      if (districts.includes(district)) return region;
    }
    return null;
  };

  const handleDistrictClick = (district) => {
    if (!readOnly) {
      onDistrictSelect(district);
    }
  };

  return (
    <div className="standalone-map-container">
      <div className="map-header">
        <h4>🗺️ District Map</h4>
        <p className="map-help-text">
          {readOnly
            ? 'Affected districts preview'
            : 'Click districts to select affected areas'}
        </p>
      </div>

      {/* Map Grid */}
      <div className="districts-map-grid">
        {allDistricts.map(district => {
          const isSelected = district in selectedDistricts;
          const region = getRegionForDistrict(district);
          const levelColor = selectedDistricts[district]
            ? getLevelColor(selectedDistricts[district])
            : getLevelColor(warningLevel);

          return (
            <div
              key={district}
              className={`district-cell ${isSelected ? 'selected' : ''} ${
                hoveredDistrict === district ? 'hovered' : ''
              }`}
              onClick={() => handleDistrictClick(district)}
              onMouseEnter={() => !readOnly && setHoveredDistrict(district)}
              onMouseLeave={() => setHoveredDistrict(null)}
              style={{
                backgroundColor: isSelected ? levelColor : '#F5F5F5',
                cursor: readOnly ? 'default' : 'pointer',
                borderColor: isSelected ? levelColor : '#E0E0E0',
                opacity: isSelected ? 1 : 0.7
              }}
            >
              <div className="district-name">{district}</div>
              <div className="district-region">{region?.substring(0, 3)}</div>
              {isSelected && <div className="district-selected-check">✓</div>}
            </div>
          );
        })}
      </div>

      {/* Statistics */}
      <div className="map-stats">
        <div className="stat">
          <span className="stat-label">Total Districts:</span>
          <span className="stat-value">{allDistricts.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Selected:</span>
          <span className="stat-value">{Object.keys(selectedDistricts).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Coverage:</span>
          <span className="stat-value">
            {Object.keys(selectedDistricts).length > 0
              ? `${((Object.keys(selectedDistricts).length / allDistricts.length) * 100).toFixed(1)}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Warning Levels</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FFFF00' }}></div>
            <span>Advisory</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FF6600' }}></div>
            <span>Warning</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FF0000' }}></div>
            <span>Major Warning</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneHazardMap;
