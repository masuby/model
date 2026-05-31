import React from 'react';
import ReactECharts from 'echarts-for-react';
import './ChartStyles.css';
import * as echarts from 'echarts';

function BarChart({ chartData, title, xAxisColumn, yAxisColumn, isMiniature = false }) {
  const option = {
    title: isMiniature ? undefined : {
      text: `📈 ${title}`,
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(44, 62, 80, 0.95)',
      borderColor: '#667eea',
      borderWidth: 2,
      textStyle: {
        color: '#fff'
      },
      formatter: function(params) {
        return `<strong>${params[0].name}</strong><br/>${yAxisColumn}: ${params[0].value}`;
      }
    },
    toolbox: isMiniature ? undefined : {
      feature: {
        saveAsImage: { 
          title: 'Save as Image',
          iconStyle: {
            borderColor: '#667eea'
          }
        },
        dataView: { 
          title: 'Data View', 
          readOnly: true,
          iconStyle: {
            borderColor: '#667eea'
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
      data: chartData.map(item => item.value),
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#FF6B6B' },
          { offset: 0.5, color: '#4ECDC4' },
          { offset: 1, color: '#45B7D1' }
        ]),
        borderRadius: [6, 6, 0, 0],
        shadowColor: 'rgba(78, 205, 196, 0.5)',
        shadowBlur: 8,
        shadowOffsetY: 3
      },
      emphasis: {
        itemStyle: {
          shadowColor: 'rgba(78, 205, 196, 0.8)',
          shadowBlur: 12,
          shadowOffsetY: 6
        }
      },
      barWidth: isMiniature ? '50%' : '65%'
    }],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'elasticOut'
  };

  return (
    <div className={`chart-container ${isMiniature ? 'miniature' : ''}`}>
      {!isMiniature && title && <div className="chart-title">📈 {title}</div>}
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

export default BarChart;