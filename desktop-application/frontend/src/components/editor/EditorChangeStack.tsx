import type { PendingChange } from "@/types/ExcelEditor";

interface EditorChangeStackProps {
  changes: PendingChange[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function EditorChangeStack({ changes, selectedId, onSelect }: EditorChangeStackProps) {
  return (
    <div className="flex h-full w-[200px] flex-col border-r border-border-default">
      <div className="p-3 border-b border-border-default">
        <h3 className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Changes</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {changes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-[11px] text-tertiary">
              No changes yet. Describe a modification below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {changes.map((change) => {
              const isSelected = change.changeId === selectedId;
              const statusColors = {
                pending: "var(--color-warning)",
                accepted: "var(--color-success)",
                rejected: "var(--color-destructive)",
              };

              return (
                <button
                  key={change.changeId}
                  onClick={() => onSelect(change.changeId)}
                  className="flex flex-col gap-1 p-3 text-left border-b border-border-default transition-colors"
                  style={{
                    backgroundColor: isSelected ? "var(--color-bg-hover)" : "transparent",
                    borderLeft: isSelected
                      ? "3px solid var(--color-accent)"
                      : "3px solid transparent",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded px-1 py-0.5 text-[9px] font-bold uppercase border border-border-default"
                      style={{
                        color: statusColors[change.status],
                        borderColor: statusColors[change.status],
                      }}
                    >
                      {change.operationType.replace("_", " ")}
                    </span>
                    <span className="text-[9px] text-tertiary">{change.targetSheet}</span>
                  </div>

                  <p className="text-[11px] line-clamp-2 leading-relaxed">
                    {change.operationSummary}
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-tertiary font-medium">
                      {change.affectedRowCount} rows affected
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
