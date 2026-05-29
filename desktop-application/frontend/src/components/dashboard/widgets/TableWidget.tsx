import type React from "react";
import type { ColumnConfig, DashboardWidget, WidgetResult } from "../../../types/dashboard";

interface TableWidgetProps {
  widget: DashboardWidget;
  result?: WidgetResult;
}

export const TableWidget: React.FC<TableWidgetProps> = ({ widget, result }) => {
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

  const allColumns = result.data.columns || [];
  const rows = result.data.rows || [];

  const displayColumns =
    config.selectedColumns && config.selectedColumns.length > 0
      ? allColumns.filter((c: Record<string, unknown>) =>
          config.selectedColumns?.includes(String(c.key))
        )
      : allColumns;

  const displayRows = rows.slice(0, config.rowLimit || 50);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border font-semibold">
        {widget.label}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted text-muted-foreground sticky top-0 z-10">
            <tr>
              {displayColumns.map((col: Record<string, unknown>) => (
                <th key={String(col.key)} className="px-4 py-2 font-medium whitespace-nowrap">
                  {String(col.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row: Record<string, unknown>, i: number) => (
              <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                {displayColumns.map((col: Record<string, unknown>) => (
                  <td key={String(col.key)} className="px-4 py-2 truncate max-w-[200px]">
                    {String(row[String(col.key)] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-1 text-xs text-muted-foreground border-t border-border">
        Showing {displayRows.length} rows
      </div>
    </div>
  );
};
