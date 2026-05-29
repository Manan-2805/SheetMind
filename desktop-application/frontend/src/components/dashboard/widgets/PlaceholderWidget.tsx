import type React from "react";
import type { DashboardWidget } from "../../../types/dashboard";

interface PlaceholderWidgetProps {
  widget: DashboardWidget;
}

export const PlaceholderWidget: React.FC<PlaceholderWidgetProps> = ({ widget }) => {
  return (
    <div className="flex flex-col h-full w-full p-4 items-center justify-center text-center">
      <h3 className="text-sm font-semibold tracking-tight">{widget.label || "Section Header"}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
        Use this space for layout organization, headers, or section titles.
      </p>
    </div>
  );
};
