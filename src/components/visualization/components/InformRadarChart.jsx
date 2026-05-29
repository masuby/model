/**
 * INFORM Radar Chart - PROFESSIONAL VERSION
 * Compare risk dimensions and components across multiple areas
 * Enhanced with better visuals, error handling, and interactivity
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import {
  INFORM_COLORS,
  INFORM_FRAMEWORK,
  getRiskClass
} from '../../../config/informFramework';
import './InformRadarChart.css';

// Define comparison profiles
const COMPARISON_PROFILES = {
  dimensions: {
    name: 'Core Dimensions',
    indicators: [
      { column: 'RISK', name: 'Risk' },
      { column: 'HAZARD', name: 'Hazard' },
      { column: 'VULNERABILITY', name: 'Vulnerability' },
      { column: 'LACK OF COPING CAPACITY', name: 'Lack of Coping' }
    ]
  },
  hazardBreakdown: {
    name: 'Hazard Breakdown',
    indicators: [
      { column: 'NATURAL', name: 'Natural' },
      { column: 'HUMAN', name: 'Human' },
      { column: 'Flood', name: 'Flood' },
      { column: 'Drought', name: 'Drought' },
      { column: 'Earthquake', name: 'Earthquake' },
      { column: 'Conflict Intensity', name: 'Conflict' }
    ]
  },
  vulnerabilityBreakdown: {
    name: 'Vulnerability Breakdown',
    indicators: [
      { column: 'SOCIO-ECONOMIC VULNERABILITY', name: 'Socio-Economic' },
      { column: 'VULNERABLE GROUPS', name: 'Vulnerable Groups' },
      { column: 'Development and Poverty', name: 'Dev & Poverty' },
      { column: 'Health Conditions', name: 'Health' },
      { column: 'Children Health and Nutrition', name: 'Child Health' }
    ]
  },
  capacityBreakdown: {
    name: 'Coping Capacity',
    indicators: [
      { column: 'INFRASTRUCTURE', name: 'Infrastructure' },
      { column: 'INSTITUTIONAL', name: 'Institutional' },
      { column: 'Access to health care', name: 'Healthcare' },
      { column: 'WASH', name: 'WASH' },
      { column: 'Education', name: 'Education' },
      { column: 'Governance', name: 'Governance' }
    ]
  }
};

// Generate distinct colors for comparison
const COMPARISON_COLORS = [
  '#1976d2', // Blue
  '#d32f2f', // Red
  '#388e3c', // Green
  '#f57c00', // Orange
  '#7b1fa2', // Purple
  '#00796b', // Teal
  '#c2185b', // Pink
  '#455a64', // Blue Grey
];

function InformRadarChart({
  data,
  selectedAreas = [],
  onAreaChange,
  comparisonProfile = 'dimensions',
  isMiniature = false
}) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [profile, setProfile] = useState(comparisonProfile);
  const [areas, setAreas] = useState(selectedAreas);

  // Get all unique areas from data
  const availableAreas = useMemo(() => {
    if (!data || data.length === 0) return [];
    const areaSet = new Set();
    data.forEach(row => {
      if (row.ADM2_NAME) areaSet.add(row.ADM2_NAME);
    });
    return Array.from(areaSet).sort();
  }, [data]);

  // Get data for selected areas
  const getAreaData = (areaName) => {
    if (!data) return null;
    return data.find(row => row.ADM2_NAME === areaName || row.ADM1_NAME === areaName);
  };

  // Build chart when data or selection changes
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) {
      console.log('InformRadarChart: Missing chart ref or data', { hasRef: !!chartRef.current, dataLength: data?.length });
      return;
    }

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const currentProfile = COMPARISON_PROFILES[profile];
    const indicators = currentProfile.indicators;

    // Build radar indicator configuration
    const radarIndicators = indicators.map(ind => ({
      name: ind.name,
      max: 10,
      color: '#333'
    }));

    // Build series data for each selected area
    const seriesData = areas.map((areaName, index) => {
      const areaRow = getAreaData(areaName);
      const values = indicators.map(ind => {
        if (!areaRow) return 0;
        const val = parseFloat(areaRow[ind.column]);
        return isNaN(val) ? 0 : val;
      });

      return {
        value: values,
        name: areaName,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          type: 'solid'
        },
        areaStyle: {
          opacity: 0.2
        },
        itemStyle: {
          color: COMPARISON_COLORS[index % COMPARISON_COLORS.length]
        }
      };
    });

    // If no areas selected, show national average or first 3 high-risk areas
    if (seriesData.length === 0 && data.length > 0) {
      // Calculate average across all areas
      const avgValues = indicators.map(ind => {
        const values = data.map(row => parseFloat(row[ind.column])).filter(v => !isNaN(v));
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      });

      seriesData.push({
        value: avgValues,
        name: 'National Average',
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, type: 'dashed' },
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#1976d2' }
      });
    }

    const option = {
      backgroundColor: 'transparent',
      title: isMiniature ? null : {
        text: currentProfile.name,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 700,
          color: '#1a1a2e'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 12,
        textStyle: {
          color: '#333'
        },
        formatter: (params) => {
          const { name, value } = params;
          let html = `<div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">${name}</div>`;
          indicators.forEach((ind, i) => {
            const val = value[i];
            const riskClass = getRiskClass(val);
            html += `<div style="margin: 4px 0;"><span style="color: #666;">${ind.name}:</span> <span style="color: ${riskClass?.color || '#666'}; font-weight: 600;">${val?.toFixed(2) || 'N/A'}</span></div>`;
          });
          return html;
        }
      },
      legend: isMiniature ? null : {
        data: seriesData.map(s => s.name),
        bottom: 15,
        type: 'scroll',
        textStyle: { fontSize: 12, color: '#555' },
        icon: 'circle'
      },
      radar: {
        center: ['50%', isMiniature ? '50%' : '56%'],
        radius: isMiniature ? '70%' : '58%',
        indicator: radarIndicators,
        axisName: {
          color: '#444',
          fontSize: isMiniature ? 10 : 13,
          fontWeight: 600
        },
        splitNumber: 5,
        shape: 'polygon',
        splitArea: {
          areaStyle: {
            color: ['rgba(114, 172, 209, 0.05)', 'rgba(114, 172, 209, 0.08)', 'rgba(114, 172, 209, 0.12)', 'rgba(114, 172, 209, 0.16)', 'rgba(114, 172, 209, 0.2)']
          }
        },
        axisLine: {
          lineStyle: { color: '#bbb', width: 2 }
        },
        splitLine: {
          lineStyle: { color: '#ddd', width: 1 }
        }
      },
      series: [{
        type: 'radar',
        data: seriesData,
        emphasis: {
          lineStyle: { width: 4 },
          areaStyle: { opacity: 0.35 }
        }
      }]
    };

    chartInstance.current.setOption(option, true);

    // Handle resize
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [data, areas, profile, isMiniature]);

  // Cleanup
  useEffect(() => {
    return () => chartInstance.current?.dispose();
  }, []);

  // Handle area selection
  const handleAreaToggle = (areaName) => {
    setAreas(prev => {
      const newAreas = prev.includes(areaName)
        ? prev.filter(a => a !== areaName)
        : [...prev, areaName].slice(0, 8); // Max 8 areas

      if (onAreaChange) onAreaChange(newAreas);
      return newAreas;
    });
  };

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className={`inform-radar-chart ${isMiniature ? 'miniature' : ''}`} style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ color: '#666', fontSize: '16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>No Data Available</h3>
          <p style={{ fontSize: '14px', color: '#888', maxWidth: '400px', margin: '0 auto' }}>
            Please upload an INFORM dataset to compare risk profiles across different areas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inform-radar-chart ${isMiniature ? 'miniature' : ''}`}>
      {!isMiniature && (
        <div className="radar-controls" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div className="control-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>Comparison Profile:</label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              {Object.entries(COMPARISON_PROFILES).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>Compare Areas (max 8):</label>
            <div className="area-selector">
              <select
                onChange={(e) => {
                  if (e.target.value) handleAreaToggle(e.target.value);
                  e.target.value = '';
                }}
                style={{ width: '100%', padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">+ Add area to compare...</option>
                {availableAreas.filter(a => !areas.includes(a)).map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {!isMiniature && areas.length > 0 && (
        <div className="selected-areas" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {areas.map((area, index) => (
            <span
              key={area}
              className="area-tag"
              style={{
                backgroundColor: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {area}
              <button
                onClick={() => handleAreaToggle(area)}
                style={{
                  background: 'rgba(255,255,255,0.3)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  lineHeight: '1'
                }}
              >×</button>
            </span>
          ))}
          {areas.length > 1 && (
            <button
              className="clear-all"
              onClick={() => setAreas([])}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <div
        ref={chartRef}
        className="radar-chart-container"
        style={{ height: isMiniature ? '100%' : '500px', width: '100%' }}
      />

      {!isMiniature && (
        <div className="radar-footer" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '8px', borderLeft: '4px solid #1976d2' }}>
          <p className="chart-note" style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.6 }}>
            <strong>Note:</strong> Values range from 0 (low risk) to 10 (high risk). Larger area coverage indicates higher overall risk profile. Use the dropdown to compare different risk dimensions across selected areas.
          </p>
        </div>
      )}
    </div>
  );
}

export default InformRadarChart;
