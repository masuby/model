// Modified: DashboardView.jsx (minor update for map container height and responsiveness)
import React, { useState, useEffect } from 'react';
import { 
  getNumericColumns,
  getAllColumns,
  aggregateData,
  transformDataForVisualization
} from '../../../utils/dataTransform';
import BarChart from './BarChart';
import LineChart from './LineChart';
import ScatterChart from './ScatterChart';
import AreaChart from './AreaChart';
import PieChart from './PieChart';
import HeatMap from './HeatMap';
import MapChart from './MapChart/MapChart';
import './DashboardView.css';

function DashboardView({ data, columns, isOpen, onClose, onViewChart, onViewMap }) {
  const [xAxisColumn, setXAxisColumn] = useState('COUNTRY');
  const [yAxisColumn, setYAxisColumn] = useState('ADM1_PCODE');
  const [aggregationType, setAggregationType] = useState('sum');
  const [numericColumns, setNumericColumns] = useState([]);
  const [allColumns, setAllColumns] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (columns && columns.length > 0 && data && data.length > 0) {
      const cols = getAllColumns(data);
      setAllColumns(cols);
      
      if (cols.includes('COUNTRY')) {
        setXAxisColumn('COUNTRY');
      } else if (cols.length > 0) {
        setXAxisColumn(cols[0]);
      }
      
      const numericCols = getNumericColumns(data);
      setNumericColumns(numericCols);
      
      if (cols.includes('ADM1_PCODE')) {
        setYAxisColumn('ADM1_PCODE');
      } else if (numericCols.length > 0) {
        setYAxisColumn(numericCols[0]);
      } else if (cols.length > 1) {
        setYAxisColumn(cols[1]);
      }
    }
  }, [columns, data]);

  useEffect(() => {
    if (xAxisColumn && yAxisColumn && data && data.length > 0) {
      updateAllChartData();
    }
  }, [xAxisColumn, yAxisColumn, data, aggregationType]);

  const updateAllChartData = () => {
    try {
      let transformedData = [];
      
      if (aggregationType !== 'none') {
        transformedData = aggregateData(data, xAxisColumn, yAxisColumn, aggregationType);
      } else {
        transformedData = transformDataForVisualization(data, xAxisColumn, yAxisColumn);
      }
      
      setChartData(transformedData);
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  };

  const handleViewChart = (chartType) => {
    if (onViewChart) {
      onViewChart(chartType, xAxisColumn, yAxisColumn, aggregationType);
    }
  };

  const handleViewMap = () => {
    if (onViewMap) {
      onViewMap();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dashboard-modal">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>✨ Data Visualization Dashboard</h2>
          <button className="dashboard-close-btn" onClick={onClose}>×</button>
        </div>
        
        {/* Controls Section - Centered */}
        <div className="dashboard-controls">
          <div className="control-group">
            <label htmlFor="dashboard-x-axis">X-Axis Column</label>
            <select
              id="dashboard-x-axis"
              value={xAxisColumn}
              onChange={(e) => setXAxisColumn(e.target.value)}
            >
              {allColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="dashboard-y-axis">Y-Axis Column</label>
            <select
              id="dashboard-y-axis"
              value={yAxisColumn}
              onChange={(e) => setYAxisColumn(e.target.value)}
            >
              {numericColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="dashboard-aggregation">Aggregation</label>
            <select
              id="dashboard-aggregation"
              value={aggregationType}
              onChange={(e) => setAggregationType(e.target.value)}
            >
              <option value="none">None</option>
              <option value="sum">Sum</option>
              <option value="average">Average</option>
              <option value="count">Count</option>
              <option value="max">Maximum</option>
              <option value="min">Minimum</option>
            </select>
          </div>
        </div>
        
        <div className="dashboard-body">
          <div className="dashboard-charts">
            <div className="chart-grid">
              {/* Bar Chart */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3 className="chart-card-title">📈 Bar Chart</h3>
                  <button 
                    className="view-chart-btn"
                    onClick={() => handleViewChart('bar')}
                  >
                    View Chart
                  </button>
                </div>
                <div className="chart-container-small">
                  {chartData.length > 0 ? (
                    <BarChart 
                      chartData={chartData}
                      title=""
                      xAxisColumn={xAxisColumn}
                      yAxisColumn={yAxisColumn}
                      isMiniature={true}
                    />
                  ) : (
                    <div className="dashboard-empty">
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Chart */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3 className="chart-card-title">📉 Line Graph</h3>
                  <button 
                    className="view-chart-btn"
                    onClick={() => handleViewChart('line')}
                  >
                    View Chart
                  </button>
                </div>
                <div className="chart-container-small">
                  {chartData.length > 0 ? (
                    <LineChart 
                      chartData={chartData}
                      title=""
                      xAxisColumn={xAxisColumn}
                      yAxisColumn={yAxisColumn}
                      isMiniature={true}
                    />
                  ) : (
                    <div className="dashboard-empty">
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Scatter Plot */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3 className="chart-card-title">🔵 Scatter Plot</h3>
                  <button 
                    className="view-chart-btn"
                    onClick={() => handleViewChart('scatter')}
                  >
                    View Chart
                  </button>
                </div>
                <div className="chart-container-small">
                  {chartData.length > 0 ? (
                    <ScatterChart 
                      chartData={chartData}
                      title=""
                      xAxisColumn={xAxisColumn}
                      yAxisColumn={yAxisColumn}
                      isMiniature={true}
                    />
                  ) : (
                    <div className="dashboard-empty">
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Area Chart */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3 className="chart-card-title">🟩 Area Graph</h3>
                  <button 
                    className="view-chart-btn"
                    onClick={() => handleViewChart('area')}
                  >
                    View Chart
                  </button>
                </div>
                <div className="chart-container-small">
                  {chartData.length > 0 ? (
                    <AreaChart 
                      chartData={chartData}
                      title=""
                      xAxisColumn={xAxisColumn}
                      yAxisColumn={yAxisColumn}
                      isMiniature={true}
                    />
                  ) : (
                    <div className="dashboard-empty">
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie Chart */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3 className="chart-card-title">🥧 Pie Chart</h3>
                  <button 
                    className="view-chart-btn"
                    onClick={() => handleViewChart('pie')}
                  >
                    View Chart
                  </button>
                </div>
                <div className="chart-container-small">
                  {chartData.length > 0 ? (
                    <PieChart 
                      chartData={chartData}
                      title=""
                      xAxisColumn={xAxisColumn}
                      yAxisColumn={yAxisColumn}
                      isMiniature={true}
                    />
                  ) : (
                    <div className="dashboard-empty">
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Heat Map */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3 className="chart-card-title">🔥 Heat Map</h3>
                  <button 
                    className="view-chart-btn"
                    onClick={() => handleViewChart('heatmap')}
                  >
                    View Chart
                  </button>
                </div>
                <div className="chart-container-small">
                  {chartData.length > 0 ? (
                    <HeatMap 
                      chartData={chartData}
                      title=""
                      xAxisColumn={xAxisColumn}
                      yAxisColumn={yAxisColumn}
                      isMiniature={true}
                    />
                  ) : (
                    <div className="dashboard-empty">
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          
          <div className="dashboard-map">
            <div className="map-card">
              <div className="map-card-header">
                <h3 className="map-card-title">🗺️ Map</h3>
                <button 
                  className="view-map-btn"
                  onClick={handleViewMap}
                >
                  View Map
                </button>
              </div>
              <div className="map-container-small">
                <MapChart sheetData={data} isMiniature={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;