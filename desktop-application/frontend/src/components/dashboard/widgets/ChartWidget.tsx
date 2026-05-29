import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import type { DashboardWidget, WidgetResult, ColumnConfig } from '../../../types/dashboard';

class ChartErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("[ChartWidget] ApexCharts crashed:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-muted-foreground h-full flex flex-col items-center justify-center text-xs text-center bg-muted/20 rounded-lg">
          <span className="font-semibold text-destructive mb-1">Chart Display Error</span>
          <span>Data structure is incompatible or incomplete.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ChartWidgetProps {
  widget: DashboardWidget;
  result?: WidgetResult;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({ widget, result }) => {
  let config: ColumnConfig = {};
  try {
    config = JSON.parse(widget.column_config_json || '{}');
  } catch (e) {
    console.error('Failed to parse column config', e);
  }
  
  const chartData = useMemo(() => {
    if (!result?.data || !result.data.rows || !Array.isArray(result.data.rows) || result.data.rows.length === 0) return null;
    
    const rows = result.data.rows;
    const xAxisCol = config.xAxisColumn;
    const yAxisCol = config.yAxisColumn;
    
    if (!xAxisCol || !yAxisCol) return null;
    
    const categories = rows.map((r: Record<string, unknown>) => r[xAxisCol] !== undefined && r[xAxisCol] !== null ? String(r[xAxisCol]) : '');
    const data = rows.map((r: Record<string, unknown>) => {
      const val = parseFloat(String(r[yAxisCol]));
      return isFinite(val) ? val : 0;
    });
    
    if (categories.length === 0 || data.length === 0) return null;
    
    return { categories, data };
  }, [result, config]);
  
  if (result?.error) {
    return <div className="p-4 text-red-500 h-full flex items-center justify-center text-sm">{result.error}</div>;
  }

  if (!chartData) {
    return <div className="p-4 text-muted-foreground h-full flex items-center justify-center text-sm">Loading...</div>;
  }

  const chartType = config.chartType?.toLowerCase() || 'bar';
  const isPie = chartType === 'pie' || chartType === 'donut';
  const isScatter = chartType === 'scatter';
  
  // Detect theme from classList
  const isDarkTheme = document.documentElement.classList.contains('dark') || 
                      document.body.classList.contains('dark') || 
                      document.querySelector('[data-theme="dark"]') !== null;
  const themeMode = isDarkTheme ? 'dark' : 'light';
  const textColor = isDarkTheme ? '#A3A3A3' : '#737373';
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    chart: {
      type: isPie ? 'pie' : (isScatter ? 'scatter' : chartType),
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true }
    },
    labels: isPie ? chartData.categories : undefined,
    xaxis: isPie ? undefined : (isScatter ? { type: 'numeric' } : { categories: chartData.categories }),
    theme: { mode: themeMode },
    title: {
      text: widget.label,
      align: 'left',
      style: {
        fontSize: '12px',
        fontWeight: 'medium',
        color: textColor
      }
    }
  };

  let series: unknown = [];
  if (isPie) {
    series = chartData.data;
  } else if (isScatter) {
    const scatterData = result?.data?.rows?.map((r: Record<string, unknown>, idx: number) => {
      const xVal = parseFloat(String(r[config.xAxisColumn || '']));
      const yVal = parseFloat(String(r[config.yAxisColumn || '']));
      const x = isFinite(xVal) ? xVal : idx;
      const y = isFinite(yVal) ? yVal : 0;
      return [x, y];
    }) || [];
    series = [{ name: config.yAxisColumn || 'Value', data: scatterData }];
  } else {
    series = [{ name: config.yAxisColumn || 'Value', data: chartData.data }];
  }

  return (
    <ChartErrorBoundary>
      <div className="w-full h-full p-2 relative">
        <div className="absolute inset-0">
          <Chart
            options={options}
            series={series as never}
            type={(isPie ? 'pie' : (isScatter ? 'scatter' : chartType)) as never}
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </ChartErrorBoundary>
  );
};
