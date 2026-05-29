import React from 'react';
import ReactECharts from 'echarts-for-react';
import './ChartStyles.css';
import * as echarts from 'echarts';

function AreaChart({ chartData, title, xAxisColumn, yAxisColumn, isMiniature = false }) {
  const option = {
    title: isMiniature ? undefined : {
      text: `🟩 ${title}`,
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
      borderColor: '#96CEB4',
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
            borderColor: '#96CEB4'
          }
        },
        dataView: { 
          title: 'Data View', 
          readOnly: true,
          iconStyle: {
            borderColor: '#96CEB4'
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
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: isMiniature ? 6 : 10,
      lineStyle: {
        width: isMiniature ? 3 : 5,
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#FF6B6B' },
          { offset: 0.5, color: '#4ECDC4' },
          { offset: 1, color: '#45B7D1' }
        ]),
        shadowColor: 'rgba(150, 206, 180, 0.3)',
        shadowBlur: 10,
        shadowOffsetY: 6
      },
      itemStyle: {
        color: '#96CEB4',
        borderColor: '#fff',
        borderWidth: 2,
        shadowColor: 'rgba(150, 206, 180, 0.5)',
        shadowBlur: 6
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255, 107, 107, 0.6)' },
          { offset: 0.5, color: 'rgba(78, 205, 196, 0.4)' },
          { offset: 1, color: 'rgba(69, 183, 209, 0.2)' }
        ])
      },
      emphasis: {
        itemStyle: {
          color: '#fff',
          borderColor: '#96CEB4',
          borderWidth: 3,
          shadowColor: 'rgba(150, 206, 180, 0.8)',
          shadowBlur: 10
        }
      }
    }],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };

  return (
    <div className={`chart-container ${isMiniature ? 'miniature' : ''}`}>
      {!isMiniature && title && <div className="chart-title">🟩 {title}</div>}
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

export default AreaChart;