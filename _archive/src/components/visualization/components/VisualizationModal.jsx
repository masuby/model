// Modified: VisualizationModal.jsx - INFORM Phase 1 Update
import React, { useState, useEffect, useRef } from 'react';
import {
  getNumericColumns,
  isConvertibleToNumber,
  convertToNumberIfPossible,
  aggregateData,
  transformDataForVisualization,
  getAllColumns
} from '../../../utils/dataTransform';
import ChartControls from './ChartControls';
import BarChart from './BarChart';
import LineChart from './LineChart';
import ScatterChart from './ScatterChart';
import AreaChart from './AreaChart';
import PieChart from './PieChart';
import HeatMap from './HeatMap';
import MapChart from './MapChart/MapChart';
import DashboardView from './DashboardView';
// INFORM Phase 1 Components
import InformDashboard from './InformDashboard';
import InformFlowDiagram from './InformFlowDiagram';
import InformSunburst from './InformSunburst';
import InformRadarChart from './InformRadarChart';
import InformChoroplethMap from './InformChoroplethMap';
import DimensionCards from './DimensionCards';
import './VisualizationModal.css';

function VisualizationModal({ data, columns, isOpen, onClose, chartType: initialChartType, adm1GeoJson, adm2GeoJson }) {
  const [currentView, setCurrentView] = useState(initialChartType || 'dashboard');
  const [xAxisColumn, setXAxisColumn] = useState('');
  const [yAxisColumn, setYAxisColumn] = useState('');
  const [aggregationType, setAggregationType] = useState('sum');
  const [chartData, setChartData] = useState([]);
  const [title, setTitle] = useState('');
  const [numericColumns, setNumericColumns] = useState([]);
  const [allColumns, setAllColumns] = useState([]);

  // Map-specific states
  const [dataColumnsMap, setDataColumnsMap] = useState([]);
  const [availableColumnsMap, setAvailableColumnsMap] = useState([]);
  const [dropdownOpenMap, setDropdownOpenMap] = useState(false);
  const dropdownRefMap = useRef(null);

  // INFORM-specific states
  const [selectedArea, setSelectedArea] = useState(null);
  const [comparisonAreas, setComparisonAreas] = useState([]);
  const [loadedAdm1, setLoadedAdm1] = useState(null);
  const [loadedAdm2, setLoadedAdm2] = useState(null);

  // Load GeoJSON for INFORM maps
  useEffect(() => {
    if (currentView.startsWith('inform-')) {
      // Load ADM1 GeoJSON
      fetch('/geojson/ADM1.geojson')
        .then(res => res.ok ? res.json() : null)
        .then(data => setLoadedAdm1(data))
        .catch(err => console.error('Error loading ADM1:', err));

      // Load ADM2 GeoJSON
      fetch('/geojson/ADM2.geojson')
        .then(res => res.ok ? res.json() : null)
        .then(data => setLoadedAdm2(data))
        .catch(err => console.error('Error loading ADM2:', err));
    }
  }, [currentView]);

  useEffect(() => {
    if (columns && columns.length > 0) {
      const cols = getAllColumns(data);
      setAllColumns(cols);
      setXAxisColumn(cols[0]);
      
      const numericCols = getNumericColumns(data);
      setNumericColumns(numericCols);
      
      if (numericCols.length > 0) {
        setYAxisColumn(numericCols[0]);
      } else if (cols.length > 1) {
        setYAxisColumn(cols[1]);
      }
    }
  }, [columns, data]);

  // Initialize map columns when entering map view
  useEffect(() => {
    if (currentView === 'map' && data.length > 0) {
      const columns = Object.keys(data[0]).filter(col => 
        !['COUNTRY', 'ADM1_NAME', 'ADM2_NAME', 'ISO3', 'ADM1_PCODE', 'ADM2_PCODE'].includes(col)
      );
      setAvailableColumnsMap(columns);
      if (columns.length > 0 && dataColumnsMap.length === 0) {
        setDataColumnsMap([columns[0]]);
      }
    } else {
      setAvailableColumnsMap([]);
      setDataColumnsMap([]);
      setDropdownOpenMap(false);
    }
  }, [currentView, data]);

  // Close dropdown on outside click for map
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRefMap.current && !dropdownRefMap.current.contains(event.target)) {
        setDropdownOpenMap(false);
      }
    };

    if (currentView === 'map') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [currentView]);

  const updateChartData = () => {
    try {
      let transformedData = [];
      let chartTitle = `${yAxisColumn} by ${xAxisColumn}`;
      
      if (aggregationType !== 'none' && !isConvertibleToNumber(data[0][xAxisColumn])) {
        transformedData = aggregateData(data, xAxisColumn, yAxisColumn, aggregationType);
        chartTitle = `${aggregationType} of ${yAxisColumn} by ${xAxisColumn}`;
      } else {
        transformedData = transformDataForVisualization(data, xAxisColumn, yAxisColumn);
      }
      
      setChartData(transformedData);
      setTitle(chartTitle);
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  };

  const handleViewChart = (chartType, xCol, yCol, aggType) => {
    setCurrentView(chartType);
    if (xCol) setXAxisColumn(xCol);
    if (yCol) setYAxisColumn(yCol);
    if (aggType) setAggregationType(aggType);
  };

  const handleViewMap = () => {
    setCurrentView('map');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Map column toggle handler
  const handleColumnToggleMap = (column) => {
    const newColumns = dataColumnsMap.includes(column)
      ? dataColumnsMap.filter(col => col !== column)
      : [...dataColumnsMap, column].slice(0, 5);
    setDataColumnsMap(newColumns);
  };

  const getChartComponent = () => {
    // INFORM Dashboard
    if (currentView === 'inform-dashboard') {
      return (
        <InformDashboard
          data={data}
          adm1GeoJson={loadedAdm1}
          adm2GeoJson={loadedAdm2}
          isOpen={true}
          onClose={onClose}
        />
      );
    }

    // INFORM Flow Diagram (Hazard-to-Risk Flow)
    if (currentView === 'inform-flow') {
      return (
        <div className="single-chart-view inform-view">
          <div className="chart-header">
            <button className="back-btn" onClick={handleBackToDashboard}>
              ← Back to Dashboard
            </button>
            <h3>🔄 INFORM Hazard-to-Risk Flow</h3>
          </div>
          <InformFlowDiagram data={data} />
        </div>
      );
    }

    // INFORM Sunburst (Indicator Hierarchy)
    if (currentView === 'inform-sunburst') {
      return (
        <div className="single-chart-view inform-view">
          <div className="chart-header">
            <button className="back-btn" onClick={handleBackToDashboard}>
              ← Back to Dashboard
            </button>
            <h3>🌐 INFORM Indicator Hierarchy</h3>
          </div>
          <InformSunburst
            data={data}
            selectedArea={selectedArea}
            onNodeClick={(node) => console.log('Node clicked:', node)}
          />
        </div>
      );
    }

    // INFORM Radar Chart (Dimension Comparison)
    if (currentView === 'inform-radar') {
      return (
        <div className="single-chart-view inform-view">
          <div className="chart-header">
            <button className="back-btn" onClick={handleBackToDashboard}>
              ← Back to Dashboard
            </button>
            <h3>📡 INFORM Dimension Comparison</h3>
          </div>
          <InformRadarChart
            data={data}
            selectedAreas={comparisonAreas}
            onAreaChange={setComparisonAreas}
          />
        </div>
      );
    }

    // INFORM Choropleth Map
    if (currentView === 'inform-map') {
      return (
        <div className="single-chart-view inform-view">
          <div className="chart-header">
            <button className="back-btn" onClick={handleBackToDashboard}>
              ← Back to Dashboard
            </button>
            <h3>🗺️ INFORM Risk Choropleth Map</h3>
          </div>
          <InformChoroplethMap
            data={data}
            adm1GeoJson={loadedAdm1}
            adm2GeoJson={loadedAdm2}
            onAreaSelect={(area, areaData) => setSelectedArea(area)}
          />
        </div>
      );
    }

    // Standard Map
    if (currentView === 'map') {
      return (
        <div className="single-chart-view">
          <div className="chart-header">
            <button className="back-btn" onClick={handleBackToDashboard}>
              ← Back to Dashboard
            </button>
            <div className="data-column-selector" ref={dropdownRefMap}>
              <button
                className="dropdown-toggle"
                onClick={() => setDropdownOpenMap(!dropdownOpenMap)}
              >
                Select Data Columns ({dataColumnsMap.length}/5 selected)
                <span className={`dropdown-arrow ${dropdownOpenMap ? 'open' : ''}`}>▼</span>
              </button>

              {dropdownOpenMap && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <span>Select up to 5 columns</span>
                    <button
                      className="clear-all-btn"
                      onClick={() => setDataColumnsMap([])}
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="dropdown-items">
                    {availableColumnsMap.map(col => (
                      <label key={col} className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={dataColumnsMap.includes(col)}
                          onChange={() => handleColumnToggleMap(col)}
                          disabled={!dataColumnsMap.includes(col) && dataColumnsMap.length >= 5}
                        />
                        <span className="checkmark"></span>
                        <span className="column-name">{col}</span>
                        {!dataColumnsMap.includes(col) && dataColumnsMap.length >= 5 && (
                          <span className="max-warning">Max reached</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="selection-info">
                {dataColumnsMap.length > 0 && (
                  <span>Selected: {dataColumnsMap.join(', ')}</span>
                )}
                {dataColumnsMap.length >= 5 && (
                  <span className="max-warning"> (Maximum reached)</span>
                )}
              </div>
            </div>
            <h3>🗺️ Tanzania Map</h3>
          </div>
          <MapChart sheetData={data} isMiniature={false} dataColumns={dataColumnsMap} />
        </div>
      );
    }

    // Standard Dashboard
    if (currentView === 'dashboard') {
      return (
        <DashboardView
          data={data}
          columns={allColumns}
          isOpen={true}
          onClose={onClose}
          onViewChart={handleViewChart}
          onViewMap={handleViewMap}
        />
      );
    }

    const props = {
      chartData,
      title,
      xAxisColumn,
      yAxisColumn
    };

    const chartComponents = {
      'bar': BarChart,
      'line': LineChart,
      'scatter': ScatterChart,
      'area': AreaChart,
      'pie': PieChart,
      'heatmap': HeatMap
    };

    const ChartComponent = chartComponents[currentView] || BarChart;

    return (
      <div className="single-chart-view">
        <div className="chart-header">
          <button className="back-btn" onClick={handleBackToDashboard}>
            ← Back to Dashboard
          </button>
          <h3>{title}</h3>
        </div>
        <ChartComponent {...props} />
      </div>
    );
  };

  useEffect(() => {
    if (xAxisColumn && yAxisColumn && data && data.length > 0 && currentView !== 'dashboard' && currentView !== 'map') {
      updateChartData();
    }
  }, [xAxisColumn, yAxisColumn, data, currentView, aggregationType]);

  if (!isOpen) return null;

  if (currentView === 'dashboard') {
    return getChartComponent();
  }

  return (
    <div className="visualization-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>✨ Data Visualization</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {currentView !== 'map' && currentView !== 'dashboard' && (
          <ChartControls
            chartType={currentView}
            handleChartTypeChange={setCurrentView}
            xAxisColumn={xAxisColumn}
            setXAxisColumn={setXAxisColumn}
            yAxisColumn={yAxisColumn}
            setYAxisColumn={setYAxisColumn}
            aggregationType={aggregationType}
            setAggregationType={setAggregationType}
            columns={allColumns}
            numericColumns={numericColumns}
            showAggregation={currentView !== 'map'}
          />
        )}
        
        <div className="chart-container">
          {getChartComponent()}
        </div>
      </div>
    </div>
  );
}

export default VisualizationModal;