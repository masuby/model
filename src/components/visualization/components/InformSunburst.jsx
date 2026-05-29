/**
 * INFORM Sunburst Chart
 * Visualizes the hierarchical relationship between Risk, Dimensions, Categories, Components, and Indicators
 */
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import {
  INFORM_FRAMEWORK,
  getHierarchyData,
  getRiskClass,
  INFORM_COLORS,
  RISK_THRESHOLDS
} from '../../../config/informFramework';
import './InformSunburst.css';

function InformSunburst({ data, selectedArea, onNodeClick, isMiniature = false }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) {
      console.log('InformSunburst: Missing chart ref or data', { hasRef: !!chartRef.current, dataLength: data?.length });
      return;
    }

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const hierarchyData = getHierarchyData(data, selectedArea);
    console.log('InformSunburst: Building hierarchy', { selectedArea, hierarchyData });

    // Build sunburst data with colors based on values
    const buildSunburstData = (node, depth = 0) => {
      const riskClass = getRiskClass(node.value);
      const color = depth === 0
        ? INFORM_COLORS.dimensions.risk
        : node.color || (riskClass ? riskClass.color : '#BDBDBD');

      const item = {
        name: node.name,
        value: node.value || 0,
        itemStyle: {
          color: color,
          borderColor: '#fff',
          borderWidth: 1,
        },
        label: {
          show: !isMiniature && depth < 3,
          rotate: 'tangential',
          fontSize: depth === 0 ? 14 : depth === 1 ? 12 : 10,
          fontWeight: depth < 2 ? 'bold' : 'normal',
        },
        emphasis: {
          focus: 'ancestor',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          }
        },
        data: {
          id: node.id,
          column: node.column,
          riskClass: riskClass,
          originalValue: node.value,
        }
      };

      if (node.children && node.children.length > 0) {
        item.children = node.children.map(child => buildSunburstData(child, depth + 1));
      }

      return item;
    };

    const sunburstData = buildSunburstData(hierarchyData);

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const { name, value, data } = params;
          const riskClass = data?.data?.riskClass;
          const riskLabel = riskClass ? riskClass.label : 'N/A';
          return `
            <div style="padding: 8px;">
              <strong>${name}</strong><br/>
              <span style="color: ${riskClass?.color || '#666'}">
                Value: ${value?.toFixed(2) || 'N/A'}
              </span><br/>
              <span>Risk Level: ${riskLabel}</span>
            </div>
          `;
        }
      },
      series: [{
        type: 'sunburst',
        data: [sunburstData],
        radius: isMiniature ? ['15%', '95%'] : ['20%', '90%'],
        sort: null,
        emphasis: {
          focus: 'ancestor'
        },
        levels: [
          {},
          {
            r0: isMiniature ? '15%' : '20%',
            r: isMiniature ? '35%' : '35%',
            itemStyle: { borderWidth: 2 },
            label: { rotate: 'tangential', fontSize: isMiniature ? 8 : 12 }
          },
          {
            r0: isMiniature ? '35%' : '35%',
            r: isMiniature ? '55%' : '55%',
            itemStyle: { borderWidth: 1.5 },
            label: { rotate: 'tangential', fontSize: isMiniature ? 7 : 10 }
          },
          {
            r0: isMiniature ? '55%' : '55%',
            r: isMiniature ? '75%' : '75%',
            itemStyle: { borderWidth: 1 },
            label: { rotate: 'tangential', fontSize: isMiniature ? 6 : 9 }
          },
          {
            r0: isMiniature ? '75%' : '75%',
            r: isMiniature ? '95%' : '90%',
            itemStyle: { borderWidth: 0.5 },
            label: { rotate: 'radial', fontSize: isMiniature ? 5 : 8, position: 'outside' }
          }
        ],
        label: {
          show: !isMiniature,
          color: '#333',
        },
        itemStyle: {
          borderRadius: 4,
        }
      }]
    };

    chartInstance.current.setOption(option, true);

    // Handle click events
    chartInstance.current.off('click');
    chartInstance.current.on('click', (params) => {
      const nodeData = params.data?.data;
      setSelectedNode(nodeData);

      // Build breadcrumb
      const path = params.treePathInfo || [];
      setBreadcrumb(path.map(p => p.name));

      if (onNodeClick && nodeData) {
        onNodeClick(nodeData);
      }
    });

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, selectedArea, isMiniature, onNodeClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className={`inform-sunburst ${isMiniature ? 'miniature' : ''}`} style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#666', fontSize: '16px' }}>
          <p>📊 No data available</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>Please upload an INFORM dataset to visualize the framework hierarchy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inform-sunburst ${isMiniature ? 'miniature' : ''}`}>
      {!isMiniature && (
        <div className="sunburst-header">
          <h3>INFORM Risk Framework Hierarchy</h3>
          <p className="subtitle">
            {selectedArea || 'National Overview'} - Click rings to explore indicator relationships
          </p>
        </div>
      )}

      {!isMiniature && breadcrumb.length > 0 && (
        <div className="breadcrumb">
          {breadcrumb.map((item, index) => (
            <span key={index}>
              {index > 0 && <span className="separator"> &gt; </span>}
              <span className={index === breadcrumb.length - 1 ? 'current' : ''}>
                {item}
              </span>
            </span>
          ))}
        </div>
      )}

      <div
        ref={chartRef}
        className="sunburst-chart"
        style={{ height: isMiniature ? '100%' : '600px', width: '100%' }}
      />

      {!isMiniature && (
        <div className="sunburst-legend">
          <h4>Risk Classification</h4>
          <div className="legend-items">
            {Object.values(RISK_THRESHOLDS).map(threshold => (
              <div key={threshold.label} className="legend-item">
                <span
                  className="legend-color"
                  style={{ backgroundColor: threshold.color }}
                />
                <span className="legend-label">
                  {threshold.label} ({threshold.min.toFixed(1)} - {threshold.max.toFixed(1)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isMiniature && selectedNode && (
        <div className="node-details">
          <h4>Selected: {selectedNode.id}</h4>
          <p>Column: {selectedNode.column}</p>
          <p>
            Value: {selectedNode.originalValue?.toFixed(2) || 'N/A'}
            {selectedNode.riskClass && (
              <span
                className="risk-badge"
                style={{ backgroundColor: selectedNode.riskClass.color }}
              >
                {selectedNode.riskClass.label}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default InformSunburst;
