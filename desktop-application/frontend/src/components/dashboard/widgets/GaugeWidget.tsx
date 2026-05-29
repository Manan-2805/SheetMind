import type React from "react";
import type { ColumnConfig, DashboardWidget, WidgetResult } from "../../../types/dashboard";

interface GaugeWidgetProps {
  widget: DashboardWidget;
  result?: WidgetResult;
}

export const GaugeWidget: React.FC<GaugeWidgetProps> = ({ widget, result }) => {
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
  let target = config.targetValue ?? 100;

  if (rows.length > 0) {
    const firstRow = rows[0];
    if (config.progressColumn && config.progressColumn in firstRow) {
      value = parseFloat(String(firstRow[config.progressColumn])) || 0;
    }
    if (config.targetColumn && config.targetColumn in firstRow) {
      target = parseFloat(String(firstRow[config.targetColumn])) || target;
    }
  }

  if (target <= 0) target = 100;
  const percentage = Math.min(100, Math.max(0, Math.round((value / target) * 100)));

  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col h-full p-4 justify-center items-center">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 text-center w-full truncate">
        {widget.label}
      </div>

      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-muted-foreground/20"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-primary transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute text-lg font-bold tracking-tight">{percentage}%</div>
      </div>

      <div className="text-[10px] text-muted-foreground mt-2 truncate max-w-full text-center">
        {value.toLocaleString()} / {target.toLocaleString()} ({percentage}%)
      </div>
    </div>
  );
};
