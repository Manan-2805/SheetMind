import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import type { DashboardWidget, WidgetResult, ColumnConfig } from '../../../types/dashboard';

interface ChartWidgetProps {
  widget: DashboardWidget;
  result?: WidgetResult;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({ widget, result }) => {
  const config: ColumnConfig = JSON.parse(widget.column_config_json || '{}');
  
  const chartData = useMemo(() => {
    if (!result?.data || !result.data.rows) return null;
    
    const rows = result.data.rows;
    const xAxisCol = config.xAxisColumn;
    const yAxisCol = config.yAxisColumn;
    
    if (!xAxisCol || !yAxisCol) return null;
    
    const categories = rows.map((r: Record<string, unknown>) => String(r[xAxisCol]));
    const data = rows.map((r: Record<string, unknown>) => parseFloat(String(r[yAxisCol])) || 0);
    
    return { categories, data };
  }, [result, config]);
  
  if (result?.error) {
    return <div className="p-4 text-red-500 h-full flex items-center justify-center text-sm">{result.error}</div>;
  }

  if (!chartData) {
    return <div className="p-4 text-muted-foreground h-full flex items-center justify-center text-sm">Loading...</div>;
  }

  const isPie = config.chartType?.toLowerCase() === 'pie';
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    chart: {
      type: config.chartType?.toLowerCase() || 'bar',
      toolbar: { show: false },
      background: 'transparent',
    },
    labels: isPie ? chartData.categories : undefined,
    xaxis: isPie ? undefined : { categories: chartData.categories },
    theme: { mode: 'dark' }, // Ideally pull from app context
    title: {
      text: widget.label,
      align: 'left',
      style: {
        fontSize: '12px',
        fontWeight: 'normal',
        color: '#888'
      }
    }
  };

  const series = isPie ? chartData.data : [{ name: config.yAxisColumn || 'Value', data: chartData.data }];

  return (
    <div className="w-full h-full p-2 relative">
      <div className="absolute inset-0">
        <Chart
          options={options}
          series={series}
          type={(config.chartType?.toLowerCase() || 'bar') as "bar" | "line" | "pie"}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
};
