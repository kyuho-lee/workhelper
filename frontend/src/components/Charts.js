import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// 🎨 확장된 색상 팔레트 (13가지)
const getChartColors = (color) => {
  const colors = {
    red: { default: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.1)' },
    orange: { default: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.1)' },
    amber: { default: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.1)' },
    yellow: { default: 'rgb(234, 179, 8)', bg: 'rgba(234, 179, 8, 0.1)' },
    lime: { default: 'rgb(132, 204, 22)', bg: 'rgba(132, 204, 22, 0.1)' },
    green: { default: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' },
    emerald: { default: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.1)' },
    cyan: { default: 'rgb(6, 182, 212)', bg: 'rgba(6, 182, 212, 0.1)' },
    blue: { default: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' },
    indigo: { default: 'rgb(99, 102, 241)', bg: 'rgba(99, 102, 241, 0.1)' },
    purple: { default: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.1)' },
    pink: { default: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.1)' },
    gray: { default: 'rgb(107, 114, 128)', bg: 'rgba(107, 114, 128, 0.1)' }
  };
  return colors[color] || colors.blue;
};

// 무지개 색상 배열
const getRainbowColors = (count) => {
  const rainbow = ['red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'blue', 'indigo', 'purple', 'pink'];
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(getChartColors(rainbow[i % rainbow.length]).default);
  }
  return colors;
};

// 그라데이션 색상 배열
const getGradientColors = (baseColor, count) => {
  const base = getChartColors(baseColor).default;
  const colors = [];
  
  // RGB 추출
  const rgb = base.match(/\d+/g).map(Number);
  
  for (let i = 0; i < count; i++) {
    const factor = 1 - (i * 0.15); // 점점 어두워짐
    const newRgb = rgb.map(c => Math.max(0, Math.floor(c * factor)));
    colors.push(`rgb(${newRgb[0]}, ${newRgb[1]}, ${newRgb[2]})`);
  }
  
  return colors;
};

// 1. 월별 추이 차트 (선/막대)
export const MonthlyTrendChart = ({ data, title, config = {} }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartType = config.chart_type || 'line';
    const color = config.color || 'blue';
    
    const colors = getChartColors(color);

    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels: data.map(item => item.month),
        datasets: [{
          label: '등록 건수',
          data: data.map(item => item.count),
          borderColor: colors.default,
          backgroundColor: chartType === 'bar' ? colors.default : colors.bg,
          borderWidth: chartType === 'line' ? 2 : 0,
          fill: chartType === 'line',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: title
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, title, config]);

  return <canvas ref={chartRef}></canvas>;
};

// 2. 상태 도넛/파이 차트 (장애 상태)
export const StatusDoughnutChart = ({ data, title, config = {} }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartType = config.chart_type || 'doughnut';
    
    // 🔧 영어 → 한글 매핑
    const statusMapping = {
      'open': '처리중',
      'in_progress': '진행중',
      'resolved': '해결됨',
      'closed': '종료'
    };
    
    // 🔧 레이블 기반 색상 매핑 (영어와 한글 모두 지원)
    let backgroundColors;
    if (config.custom_colors && typeof config.custom_colors === 'object' && !Array.isArray(config.custom_colors)) {
      backgroundColors = data.map(item => {
        // 영어 상태를 한글로 변환
        const koreanStatus = statusMapping[item.status] || item.status;
        // custom_colors에서 색상 찾기 (한글 키 기준)
        const colorName = config.custom_colors[koreanStatus] || 'blue';
        return getChartColors(colorName).default;
      });
    } else {
      // 기본 색상 매핑 (영어와 한글 모두 지원)
      const defaultColors = {
        '처리중': 'red',
        'open': 'red',
        '진행중': 'amber',
        'in_progress': 'amber',
        '해결됨': 'green',
        'resolved': 'green',
        '종료': 'gray',
        'closed': 'gray'
      };
      backgroundColors = data.map(item => {
        const colorName = defaultColors[item.status] || 'blue';
        return getChartColors(colorName).default;
      });
    }

    // 라벨도 한글로 변환
    const labels = data.map(item => statusMapping[item.status] || item.status);

    chartInstance.current = new Chart(ctx, {
      type: chartType === 'bar' ? 'bar' : chartType,
      data: {
        labels: labels,
        datasets: [{
          data: data.map(item => item.count),
          backgroundColor: backgroundColors,
          borderWidth: 0,
          borderColor: '#fff' 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartType !== 'bar',
            position: 'bottom'
          },
          title: {
            display: true,
            text: title
          }
        },
        scales: chartType === 'bar' ? {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        } : {}
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, title, config]);

  return <canvas ref={chartRef}></canvas>;
};

// 3. 자산 상태 막대/파이 차트
export const AssetStatusBarChart = ({ data, title, config = {} }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartType = config.chart_type || 'bar';
    
    // 🔧 영어 → 한글 매핑 (4가지 상태 지원)
    const statusMapping = {
      'active': '정상',
      'under_repair': '수리중',
      'maintenance': '정비중',
      'disposed': '폐기'
    };
    
    // 🔧 레이블 기반 색상 매핑 (영어와 한글 모두 지원)
    let backgroundColors;
    if (config.custom_colors && typeof config.custom_colors === 'object' && !Array.isArray(config.custom_colors)) {
      backgroundColors = data.map(item => {
        // 영어 상태를 한글로 변환
        const koreanStatus = statusMapping[item.status] || item.status;
        // custom_colors에서 색상 찾기 (한글 키 기준)
        const colorName = config.custom_colors[koreanStatus] || 'blue';
        return getChartColors(colorName).default;
      });
    } else {
      // 기본 색상 매핑 (영어와 한글 모두 지원 - 4가지)
      const defaultColors = {
        '정상': 'green',
        'active': 'green',
        '수리중': 'orange',
        'under_repair': 'orange',
        '정비중': 'blue',
        'maintenance': 'blue',
        '폐기': 'gray',
        'disposed': 'gray'
      };
      backgroundColors = data.map(item => {
        const colorName = defaultColors[item.status] || 'blue';
        return getChartColors(colorName).default;
      });
    }

    // 라벨도 한글로 변환
    const labels = data.map(item => statusMapping[item.status] || item.status);

    chartInstance.current = new Chart(ctx, {
      type: chartType === 'bar' ? 'bar' : chartType,
      data: {
        labels: labels,
        datasets: [{
          data: data.map(item => item.count),
          backgroundColor: backgroundColors,
          borderWidth: 0,
          borderColor: '#fff' 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartType !== 'bar',
            position: 'bottom'
          },
          title: {
            display: true,
            text: title
          }
        },
        scales: chartType === 'bar' ? {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        } : {}
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, title, config]);

  return <canvas ref={chartRef}></canvas>;
};

// 4. 우선순위 파이 차트
export const PriorityPieChart = ({ data, title, config = {} }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartType = config.chart_type || 'pie';
    
    // 🔧 영어 → 한글 매핑
    const priorityMapping = {
      'critical': '긴급',
      'high': '높음',
      'medium': '보통',
      'low': '낮음'
    };
    
    // 🔧 레이블 기반 색상 매핑 (영어와 한글 모두 지원)
    let backgroundColors;
    if (config.custom_colors && typeof config.custom_colors === 'object' && !Array.isArray(config.custom_colors)) {
      backgroundColors = data.map(item => {
        // 영어 우선순위를 한글로 변환
        const koreanPriority = priorityMapping[item.priority] || item.priority;
        // custom_colors에서 색상 찾기 (한글 키 기준)
        const colorName = config.custom_colors[koreanPriority] || 'blue';
        return getChartColors(colorName).default;
      });
    } else {
      // 기본 색상 매핑 (영어와 한글 모두 지원)
      const defaultColors = {
        '긴급': 'red',
        'critical': 'red',
        '높음': 'orange',
        'high': 'orange',
        '보통': 'yellow',
        'medium': 'yellow',
        '낮음': 'green',
        'low': 'green'
      };
      backgroundColors = data.map(item => {
        const colorName = defaultColors[item.priority] || 'blue';
        return getChartColors(colorName).default;
      });
    }

    // 라벨도 한글로 변환
    const labels = data.map(item => priorityMapping[item.priority] || item.priority);

    chartInstance.current = new Chart(ctx, {
      type: chartType === 'bar' ? 'bar' : chartType,
      data: {
        labels: labels,
        datasets: [{
          data: data.map(item => item.count),
          backgroundColor: backgroundColors,
          borderWidth: 0.5,
          borderColor: '#fff' 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartType !== 'bar',
            position: 'bottom'
          },
          title: {
            display: true,
            text: title
          }
        },
        scales: chartType === 'bar' ? {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        } : {}
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, title, config]);

  return <canvas ref={chartRef}></canvas>;
};

// 5. 카테고리 막대 차트 (단일/그라데이션/무지개)
export const CategoryBarChart = ({ data, title, config = {} }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartType = config.chart_type || 'bar';
    const colorMode = config.color_mode || 'single';
    const baseColor = config.color || 'green';
    
    // 색상 모드에 따라 색상 배열 생성
    let backgroundColors;
    if (colorMode === 'rainbow') {
      backgroundColors = getRainbowColors(data.length);
    } else if (colorMode === 'gradient') {
      backgroundColors = getGradientColors(baseColor, data.length);
    } else {
      // 단일 색상
      const color = getChartColors(baseColor).default;
      backgroundColors = Array(data.length).fill(color);
    }

    chartInstance.current = new Chart(ctx, {
      type: chartType === 'bar' ? 'bar' : chartType,
      data: {
        labels: data.map(item => item.category),
        datasets: [{
          data: data.map(item => item.count),
          backgroundColor: backgroundColors,
          borderWidth: 0,
          borderColor: '#fff' 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: chartType === 'bar' ? 'y' : undefined,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: title
          }
        },
        scales: chartType === 'bar' ? {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        } : {}
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, title, config]);

  return <canvas ref={chartRef}></canvas>;
};