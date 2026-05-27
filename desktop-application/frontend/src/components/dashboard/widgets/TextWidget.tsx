import React from 'react';
import type { DashboardWidget, ColumnConfig, WidgetResult } from '../../../types/dashboard';

interface TextWidgetProps {
  widget: DashboardWidget;
  result?: WidgetResult;
}

export const TextWidget: React.FC<TextWidgetProps> = ({ widget, result }) => {
  const config: ColumnConfig = JSON.parse(widget.column_config_json || '{}');
  const template = config.textContext || widget.label;
  
  let content = template;
  
  if (result?.data?.rows && result.data.rows.length > 0) {
    const rows = result.data.rows;
    let rowIdx = 0;
    if (config.textRowIndex === 'last') {
      rowIdx = rows.length - 1;
    } else if (config.textRowIndex && !isNaN(Number(config.textRowIndex))) {
      rowIdx = Math.min(Math.max(0, Number(config.textRowIndex)), rows.length - 1);
    }
    const selectedRow = rows[rowIdx];
    
    content = template.replace(/\{([^}]+)\}/g, (match, columnName) => {
      const trimmedColName = columnName.trim();
      if (selectedRow && trimmedColName in selectedRow) {
        return String(selectedRow[trimmedColName] ?? '');
      }
      return match;
    });
  }
  
  return (
    <div className="flex h-full w-full p-4 items-start justify-start overflow-auto">
      <div className="text-sm prose prose-sm dark:prose-invert leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

