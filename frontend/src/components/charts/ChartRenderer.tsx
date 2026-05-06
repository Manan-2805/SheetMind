import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

import { useTheme } from "@/hooks/useTheme";
import { buildChartOptions } from "@/utils/buildChartOptions";

type ChartType =
  | "bar"
  | "horizontal-bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "histogram"
  | "heatmap";

interface ChartSeries {
  name: string;
  data: number[];
}

interface ChartRendererProps {
  type: ChartType;
  series: ChartSeries[];
  categories?: string[];
  title?: string;
  height?: number;
}

function mapType(type: ChartType): string {
  if (type === "horizontal-bar" || type === "histogram") return "bar";
  return type;
}

export function ChartRenderer({
  type,
  series,
  categories,
  title,
  height = 300,
}: ChartRendererProps) {
  const { resolvedTheme } = useTheme();
  const options = useMemo<ApexOptions>(
    () => buildChartOptions({ type, theme: resolvedTheme, title, categories, height }),
    [type, resolvedTheme, title, categories, height]
  );

  const isPieDonut = type === "pie" || type === "donut";
  const chartSeries = isPieDonut ? series.map((s) => s.data).flat() : series;

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ border: "1px solid var(--color-border-default)" }}
    >
      <ReactApexChart
        type={mapType(type) as ApexCharts.ChartType}
        series={chartSeries as ApexAxisChartSeries | ApexNonAxisChartSeries}
        options={options}
        height={height}
      />
    </div>
  );
}
