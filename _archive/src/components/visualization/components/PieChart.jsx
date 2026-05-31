// PieChart.jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import './ChartStyles.css';
import * as echarts from 'echarts';

function PieChart({ chartData, title, xAxisColumn, yAxisColumn, isMiniature = false }) {
  // Function to darken a hex color with validation
  const darkenColor = (color, percent) => {
    if (!color || typeof color !== 'string') return '#FF6B6B';
    
    try {
      let hex = color.replace("#", "");
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      
      const num = parseInt(hex, 16);
      if (isNaN(num)) return '#FF6B6B';
      
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, Math.min(255, (num >> 16) - amt));
      const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - amt));
      const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
      
      return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1).toUpperCase();
    } catch (error) {
      return '#FF6B6B';
    }
  };

  // Validated color array
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ].filter(color => color && color !== 'undefined');

  const option = {
    title: isMiniature ? undefined : {
      text: `🥧 ${title}`,
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
      borderColor: '#FF6B6B',
      borderWidth: 2,
      textStyle: {
        color: '#fff'
      },
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    toolbox: isMiniature ? undefined : {
      feature: {
        saveAsImage: { 
          title: 'Save as Image',
          iconStyle: {
            borderColor: '#FF6B6B'
          }
        },
        dataView: { 
          title: 'Data View', 
          readOnly: true,
          iconStyle: {
            borderColor: '#FF6B6B'
          }
        }
      }
    },
    legend: isMiniature ? {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 0,
      textStyle: {
        fontSize: 10,
        color: '#495057'
      }
    } : {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 'middle',
      textStyle: {
        fontSize: 12,
        color: '#495057'
      }
    },
    series: [{
      name: title,
      type: 'pie',
      radius: isMiniature ? ['40%', '70%'] : ['45%', '75%'],
      center: isMiniature ? ['50%', '45%'] : ['40%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 3,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowBlur: 8,
        shadowOffsetX: 3,
        shadowOffsetY: 3
      },
      label: {
        show: !isMiniature,
        formatter: '{b}: {d}%',
        fontSize: isMiniature ? 10 : 12,
        color: '#495057',
        fontWeight: 'bold'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: isMiniature ? 12 : 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 15,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
          borderWidth: 4,
          borderColor: '#fff'
        }
      },
      labelLine: {
        show: !isMiniature,
        length: isMiniature ? 10 : 20,
        length2: isMiniature ? 5 : 15,
        smooth: true
      },
      data: chartData.map((item, index) => {
        const baseColor = colors[index % colors.length];
        const darkenedColor = darkenColor(baseColor, 20);
        
        return {
          name: item.name || `Item ${index + 1}`,
          value: item.value || 0,
          itemStyle: {
            color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
              { offset: 0, color: baseColor },
              { offset: 1, color: darkenedColor }
            ])
          }
        };
      }),
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: function (idx) {
        return Math.random() * 200;
      }
    }],
    animation: true,
    animationDuration: 1200
  };

  return (
    <div className={`chart-container ${isMiniature ? 'miniature' : ''}`}>
      {!isMiniature && title && <div className="chart-title">🥧 {title}</div>}
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

export default PieChart;