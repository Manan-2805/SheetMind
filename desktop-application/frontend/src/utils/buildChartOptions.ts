import type { ApexChart, ApexOptions } from "apexcharts";

import type { Theme } from "@/types/Settings";

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

interface BuildChartOptionsParams {
  type: ChartType;
  theme: Theme;
  title?: string;
  categories?: string[];
  labels?: string[];
  height?: number;
  colors?: string[];
  chartId?: string;
}

export function buildChartOptions({
  type,
  theme,
  title,
  categories,
  labels,
  height = 300,
  colors,
  chartId,
}: BuildChartOptionsParams): ApexOptions {
  const isDark = theme === "dark" || theme === "system";
  const textColor = isDark ? "#A1A1AA" : "#52525B";
  const borderColor = isDark ? "#2A2A32" : "#E4E4E7";
  const accentColor = "#7C3AED";

  const baseOptions: ApexOptions = {
    chart: {
      id: chartId,
      background: "transparent",
      toolbar: { show: false },
      animations: {
        enabled: true,
        speed: 400,
      },
      height,
      type: mapChartType(type),
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    },
    theme: {
      mode: isDark ? "dark" : "light",
    },
    colors: colors ?? [accentColor, "#A78BFA", "#C4B5FD", "#DDD6FE", "#EDE9FE"],
    grid: {
      borderColor,
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: categories ?? [],
      labels: {
        style: { colors: textColor, fontSize: "11px", fontWeight: 500 },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: textColor, fontSize: "11px" },
      },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      style: { fontSize: "12px", fontFamily: "Inter, sans-serif" },
      fillSeriesColor: false,
    },
    legend: {
      labels: { colors: textColor },
      fontSize: "12px",
    },
    labels: type === "pie" || type === "donut" ? labels : undefined,
    title: title
      ? {
          text: title,
          style: {
            fontSize: "14px",
            fontWeight: "600",
            color: isDark ? "#F4F4F5" : "#09090B",
            fontFamily: "Inter, sans-serif",
          },
          margin: 12,
        }
      : undefined,
    plotOptions: buildPlotOptions(type),
    dataLabels: {
      enabled: type === "pie" || type === "donut",
      style: { fontSize: "11px", fontFamily: "Inter, sans-serif" },
    },
    stroke: type === "line" || type === "area" ? { curve: "smooth", width: 2 } : { width: 0 },
    fill:
      type === "area"
        ? {
            type: "gradient",
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.4,
              opacityTo: 0.05,
              stops: [0, 100],
            },
          }
        : undefined,
  };

  return baseOptions;
}

function mapChartType(type: ChartType): ApexChart["type"] {
  if (type === "horizontal-bar") return "bar";
  if (type === "histogram") return "bar";
  return type;
}

function buildPlotOptions(type: ChartType): ApexOptions["plotOptions"] {
  if (type === "horizontal-bar") {
    return { bar: { horizontal: true, borderRadius: 4 } };
  }
  if (type === "bar" || type === "histogram") {
    return { bar: { horizontal: false, borderRadius: 4 } };
  }
  return undefined;
}
