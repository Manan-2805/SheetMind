import type { PendingChange } from "@/types/ExcelEditor";

interface EditorDiffTableProps {
  change: PendingChange;
  onAccept: () => void;
  onReject: () => void;
  onContinue: () => void;
  onRestore: () => void;
}

export function EditorDiffTable({
  change,
  onAccept,
  onReject,
  onContinue,
  onRestore,
}: EditorDiffTableProps) {
  const isPending = change.status === "pending";
  const isAccepted = change.status === "accepted";
  const isRejected = change.status === "rejected";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg-base">
      {/* Header Bar */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-border-default bg-bg-elevated">
        <div className="flex items-center gap-3">
          {isAccepted && (
            <span className="rounded bg-success/20 px-1.5 py-0.5 text-[10px] font-bold text-success border border-success/30 uppercase">
              Accepted
            </span>
          )}
          {isRejected && (
            <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-bold text-destructive border border-destructive/30 uppercase">
              Rejected
            </span>
          )}
          <h4 className="text-[13px] font-medium text-primary line-clamp-1">
            {change.operationSummary}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <button onClick={onContinue} className="text-xs text-accent hover:underline px-2">
                Continue editing
              </button>
              <button
                onClick={onReject}
                className="h-8 rounded-lg px-3 text-xs font-medium border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={onAccept}
                className="h-8 rounded-lg px-4 text-xs font-medium bg-accent text-white hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                Accept
              </button>
            </>
          )}
          {isRejected && (
            <button
              onClick={onRestore}
              className="h-8 rounded-lg px-4 text-xs font-medium bg-accent text-white hover:opacity-90 transition-all"
            >
              Restore
            </button>
          )}
        </div>
      </div>

      {/* Diff Table */}
      <div className="flex-1 overflow-auto bg-bg-base">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-bg-elevated z-10 shadow-sm">
            <tr className="border-b border-border-default">
              <th className="py-2 px-3 font-semibold text-tertiary w-16">Row #</th>
              <th className="py-2 px-3 font-semibold text-tertiary">Column</th>
              <th className="py-2 px-3 font-semibold text-tertiary">Current Value</th>
              <th className="py-2 px-3 font-semibold text-tertiary">New Value</th>
            </tr>
          </thead>
          <tbody>
            {change.diffRows.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-border-default/50 hover:bg-bg-hover transition-colors animate-in fade-in slide-in-from-left-2 duration-300"
                style={{ animationDelay: `${Math.min(idx * 20, 500)}ms` }}
              >
                <td className="py-2 px-3 text-tertiary font-mono">{row.rowIndex + 1}</td>
                <td className="py-2 px-3 font-medium">{row.columnName}</td>
                <td
                  className="py-2 px-3"
                  style={{
                    backgroundColor: "rgba(254, 226, 226, 0.15)",
                    color: "var(--color-destructive)",
                  }}
                >
                  <span
                    className={
                      row.newValue === null || row.newValue === "" ? "line-through opacity-50" : ""
                    }
                  >
                    {row.oldValue === null ? (
                      <span className="italic opacity-50">empty</span>
                    ) : (
                      String(row.oldValue)
                    )}
                  </span>
                </td>
                <td
                  className="py-2 px-3"
                  style={{
                    backgroundColor: "rgba(220, 252, 231, 0.15)",
                    color: "var(--color-success)",
                  }}
                >
                  <span
                    className={
                      row.isFormula ? "font-mono bg-success/10 px-1 rounded" : "font-medium"
                    }
                  >
                    {row.newValue === null ? (
                      <span className="italic opacity-50">empty</span>
                    ) : (
                      String(row.newValue)
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border-default bg-bg-elevated/50">
        <span className="text-[10px] text-tertiary">
          {change.affectedRowCount} rows affected in {change.targetSheet}
          {isAccepted && ` • Applied at ${new Date(change.appliedAt || "").toLocaleTimeString()}`}
          {isAccepted && " • This change has been written to the file."}
        </span>
      </div>
    </div>
  );
}
