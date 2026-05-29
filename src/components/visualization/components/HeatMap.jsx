// HeatMap.jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import './ChartStyles.css';

function HeatMap({ chartData, title, xAxisColumn, yAxisColumn, isMiniature = false }) {
  // Safe data transformation
  const safeChartData = Array.isArray(chartData) ? chartData : [];
  
  // Create heatmap data with validation
  const heatmapData = safeChartData.map((item, index) => [
    index,
    0,
    Number(item.value) || 0
  ]);

  const maxValue = Math.max(1, ...heatmapData.map(item => item[2]));
  
  // Simple, safe color palette
  const safeColors = [
    '#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
    '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'
  ];

  const option = {
    title: isMiniature ? undefined : {
      text: `🔥 ${title}`,
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50'
      }
    },
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(44, 62, 80, 0.95)',
      borderColor: '#ff6b6b',
      borderWidth: 2,
      textStyle: {
        color: '#fff'
      },
      formatter: function(params) {
        const item = safeChartData[params.data[0]];
        return `<strong>${item?.name || 'Unknown'}</strong><br/>Value: ${params.data[2] || 0}`;
      }
    },
    toolbox: isMiniature ? undefined : {
      feature: {
        saveAsImage: { 
          title: 'Save as Image'
        },
        dataView: { 
          title: 'Data View', 
          readOnly: true
        }
      }
    },
    grid: {
      top: isMiniature ? '15%' : '20%',
      bottom: isMiniature ? '25%' : '15%',
      left: isMiniature ? '12%' : '10%',
      right: isMiniature ? '8%' : '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: safeChartData.map(item => item.name || 'Unknown'),
      axisLabel: {
        rotate: isMiniature ? 0 : 45,
        fontSize: isMiniature ? 10 : 12,
        color: '#495057'
      },
      axisLine: {
        lineStyle: {
          color: '#adb5bd'
        }
      },
      axisTick: {
        alignWithLabel: true
      },
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: 'category',
      data: ['Value'],
      axisLabel: {
        fontSize: isMiniature ? 10 : 12,
        color: '#495057'
      },
      axisLine: {
        lineStyle: {
          color: '#adb5bd'
        }
      },
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'vertical',
      left: 'right',
      top: 'center',
      inRange: {
        color: safeColors
      },
      textStyle: {
        color: '#495057'
      }
    },
    series: [{
      name: 'Heatmap',
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: !isMiniature,
        fontSize: isMiniature ? 8 : 10,
        color: '#2c3e50'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      itemStyle: {
        borderWidth: 1,
        borderColor: '#fff'
      },
      progressive: 1000,
      animation: true
    }],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };

  // If no valid data, show empty state
  if (safeChartData.length === 0) {
    return (
      <div className={`chart-container ${isMiniature ? 'miniature' : ''}`}>
        {!isMiniature && title && <div className="chart-title">🔥 {title}</div>}
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <h3>No Data Available</h3>
          <p>Please check your data source</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chart-container ${isMiniature ? 'miniature' : ''}`}>
      {!isMiniature && title && <div className="chart-title">🔥 {title}</div>}
      <ReactECharts
        option={option}
        style={{ 
          height: isMiniature ? '180px' : '400px', 
          width: '100%' 
        }}
        opts={{ 
          renderer: 'svg', // Use SVG instead of canvas to avoid gradient issues
          useDirtyRect: true 
        }}
        onEvents={{
          rendered: () => console.log('HeatMap rendered successfully'),
          'click': (params) => console.log('HeatMap clicked:', params)
        }}
      />
    </div>
  );
}

export default HeatMap;