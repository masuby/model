import React from 'react';

function ChartControls({
  chartType,
  handleChartTypeChange,
  xAxisColumn,
  setXAxisColumn,
  yAxisColumn,
  setYAxisColumn,
  aggregationType,
  setAggregationType,
  columns,
  numericColumns,
  showAggregation = true
}) {
  return (
    <div className="controls">
      <div className="control-group">
        <label htmlFor="chart-type">Chart Type</label>
        <select
          id="chart-type"
          value={chartType}
          onChange={(e) => handleChartTypeChange(e.target.value)}
        >
          <option value="bar">Bar Chart</option>
          <option value="line">Line Graph</option>
          <option value="pie">Pie Chart</option>
          <option value="scatter">Scatter Plot</option>
          <option value="area">Area Graph</option>
          <option value="map">Tanzania Map</option>
        </select>
      </div>

      {chartType !== 'map' && chartType !== 'dashboard' && (
        <>
          <div className="control-group">
            <label htmlFor="x-axis">X-Axis Column</label>
            <select
              id="x-axis"
              value={xAxisColumn}
              onChange={(e) => setXAxisColumn(e.target.value)}
            >
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="y-axis">Y-Axis Column</label>
            <select
              id="y-axis"
              value={yAxisColumn}
              onChange={(e) => setYAxisColumn(e.target.value)}
            >
              {numericColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {showAggregation && (
            <div className="control-group">
              <label htmlFor="aggregation">Aggregation</label>
              <select
                id="aggregation"
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
          )}
        </>
      )}
      
      {chartType === 'map' && (
        <div className="map-info">
          <p>💡 Map shows Tanzania districts with data from your Excel file</p>
        </div>
      )}
    </div>
  );
}

export default ChartControls;
