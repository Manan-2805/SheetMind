import React from 'react';
import type { DashboardWidget, ColumnConfig } from '../../../types/dashboard';

interface TextWidgetProps {
  widget: DashboardWidget;
}

export const TextWidget: React.FC<TextWidgetProps> = ({ widget }) => {
  const config: ColumnConfig = JSON.parse(widget.column_config_json || '{}');
  
  return (
    <div className="flex h-full w-full p-4 items-start justify-start overflow-auto">
      <div className="text-sm prose prose-sm dark:prose-invert">
        {config.textContext || widget.label}
      </div>
    </div>
  );
};
