import React from 'react';
import ReactECharts from 'echarts-for-react';
import './ChartStyles.css';
import * as echarts from 'echarts';

function ScatterChart({ chartData, title, xAxisColumn, yAxisColumn, isMiniature = false }) {
  const option = {
    title: isMiniature ? undefined : {
      text: `🔵 ${title}`,
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(44, 62, 80, 0.95)',
      borderColor: '#fac858',
      borderWidth: 2,
      textStyle: {
        color: '#fff'
      },
      formatter: function(params) {
        return `<strong>${params.name}</strong><br/>${yAxisColumn}: ${params.value}`;
      }
    },
    toolbox: isMiniature ? undefined : {
      feature: {
        saveAsImage: { 
          title: 'Save as Image',
          iconStyle: {
            borderColor: '#fac858'
          }
        },
        dataView: { 
          title: 'Data View', 
          readOnly: true,
          iconStyle: {
            borderColor: '#fac858'
          }
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
      data: chartData.map(item => item.name),
      axisLabel: {
        rotate: isMiniature ? 0 : 45,
        fontSize: isMiniature ? 10 : 12,
        color: '#495057'
      },
      axisLine: {
        lineStyle: {
          color: '#adb5bd',
          width: 2
        }
      },
      axisTick: {
        alignWithLabel: true,
        lineStyle: {
          color: '#adb5bd'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: isMiniature ? 10 : 12,
        color: '#495057'
      },
      axisLine: {
        lineStyle: {
          color: '#adb5bd',
          width: 2
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f8f9fa',
          type: 'dashed'
        }
      }
    },
    series: [{
      data: chartData.map(item => ({
        name: item.name,
        value: item.value,
        symbolSize: Math.min(isMiniature ? 15 : 30, 8 + item.value / 10)
      })),
      type: 'scatter',
      itemStyle: {
        color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
          { offset: 0, color: '#FF6B6B' },
          { offset: 0.5, color: '#4ECDC4' },
          { offset: 1, color: '#45B7D1' }
        ]),
        shadowBlur: 12,
        shadowColor: 'rgba(255, 107, 107, 0.5)'
      },
      emphasis: {
        itemStyle: {
          shadowColor: 'rgba(255, 107, 107, 0.8)',
          shadowBlur: 18,
          borderColor: '#fff',
          borderWidth: 3
        }
      }
    }],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };

  return (
    <div className={`chart-container ${isMiniature ? 'miniature' : ''}`}>
      {!isMiniature && title && <div className="chart-title">🔵 {title}</div>}
      <ReactECharts
        option={option}
        style={{ 
          height: isMiniature ? '180px' : '400px', 
          width: '100%' 
        }}
        opts={{ 
          renderer: 'canvas',
          useDirtyRect: true 
        }}
      />
    </div>
  );
}

export default ScatterChart;