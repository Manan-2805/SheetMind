import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexAxisChartSeries, ApexNonAxisChartSeries } from "apexcharts";

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

interface ChartRendererProps {
  type: ChartType;
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  categories?: string[];
  labels?: string[];
  title?: string;
  height?: number;
  chartId?: string;
  colors?: string[];
}

function mapType(type: ChartType): string {
  if (type === "horizontal-bar" || type === "histogram") return "bar";
  return type;
}

export function ChartRenderer({
  type,
  series,
  categories,
  labels,
  title,
  height = 300,
  chartId,
  colors,
}: ChartRendererProps) {
  const { resolvedTheme } = useTheme();
  const options = useMemo(
    () => buildChartOptions({ type, theme: resolvedTheme, title, categories, labels, height, colors, chartId }),
    [type, resolvedTheme, title, categories, labels, height, colors, chartId]
  );

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ border: "1px solid var(--color-border-default)" }}
    >
      <ReactApexChart
        key={type}
        type={mapType(type) as "bar" | "line" | "area" | "pie" | "donut" | "scatter" | "heatmap"}
        series={series}
        options={options}
        height={height}
      />
    </div>
  );
}
