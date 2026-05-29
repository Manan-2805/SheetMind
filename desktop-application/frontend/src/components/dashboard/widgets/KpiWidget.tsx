import type React from "react";
import type { ColumnConfig, DashboardWidget, WidgetResult } from "../../../types/dashboard";

interface KpiWidgetProps {
  widget: DashboardWidget;
  result?: WidgetResult;
}

export const KpiWidget: React.FC<KpiWidgetProps> = ({ widget, result }) => {
  const config: ColumnConfig = JSON.parse(widget.column_config_json || "{}");

  if (result?.error) {
    return (
      <div className="p-4 text-red-500 h-full flex items-center justify-center text-sm">
        {result.error}
      </div>
    );
  }

  if (!result?.data || !result.data.rows) {
    return (
      <div className="p-4 text-muted-foreground h-full flex items-center justify-center text-sm">
        Loading...
      </div>
    );
  }

  const rows = result.data.rows;
  let value = 0;

  if (rows.length > 0 && config.valueColumn) {
    const vals = rows.map(
      (r: Record<string, unknown>) => parseFloat(String(r[config.valueColumn as string])) || 0
    );
    if (config.aggregation === "SUM") value = vals.reduce((a: number, b: number) => a + b, 0);
    else if (config.aggregation === "AVG")
      value = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
    else if (config.aggregation === "MAX") value = Math.max(...vals);
    else if (config.aggregation === "MIN") value = Math.min(...vals);
    else if (config.aggregation === "COUNT") value = vals.length;
    else value = vals[0];
  }

  // Very basic number formatting
  const formattedValue = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    notation: value > 1000000 ? "compact" : "standard",
  }).format(value);

  return (
    <div className="flex flex-col h-full p-4 justify-center">
      <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
        {widget.label}
      </div>
      <div className="text-3xl font-bold tracking-tight truncate">{formattedValue}</div>
      {/* Percentage change would go here if we executed the comparison query */}
    </div>
  );
};
