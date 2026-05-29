import { Plus } from "lucide-react";
import type { SheetData } from "@/types/ExcelEditor";

interface EditorSheetTabsProps {
  sheets: SheetData[];
  activeIndex: number;
  onSwitch: (index: number) => void;
}

export function EditorSheetTabs({ sheets, activeIndex, onSwitch }: EditorSheetTabsProps) {
  return (
    <div
      className="flex h-9 items-center border-b border-border-default overflow-x-auto no-scrollbar"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      {sheets.map((sheet, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={sheet.sheetName + index}
            onClick={() => onSwitch(index)}
            className="flex h-full min-w-[80px] max-w-[160px] items-center px-4 transition-colors relative"
            style={{
              backgroundColor: isActive ? "var(--color-bg-elevated)" : "transparent",
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            }}
          >
            <span className="text-xs font-medium truncate">{sheet.sheetName}</span>
            {isActive && (
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
            )}
            {!isActive && <div className="absolute inset-0 hover:bg-bg-hover -z-10" />}
          </button>
        );
      })}

      <button
        disabled
        className="flex h-full w-9 items-center justify-center text-tertiary opacity-50 cursor-not-allowed group relative"
        title="Add sheet coming in a future version"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
