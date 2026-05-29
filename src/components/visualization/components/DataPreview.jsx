import React from 'react';

function DataPreview({ chartData, xAxisColumn, yAxisColumn }) {
  return (
    <div className="data-preview">
      <h3>Data Preview (First 5 rows)</h3>
      <div className="preview-table">
        <table>
          <thead>
            <tr>
              <th>{xAxisColumn}</th>
              <th>{yAxisColumn}</th>
            </tr>
          </thead>
          <tbody>
            {chartData.slice(0, 5).map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataPreview;