import { ChevronRight, FileSpreadsheet, TableProperties } from "lucide-react";
import type { ExcelEditorFile } from "@/types/ExcelEditor";

interface EditorFileSelectorProps {
  files: ExcelEditorFile[];
  onSelect: (fileId: string) => void;
  isLoading: boolean;
  onGoToDataSources: () => void;
}

export function EditorFileSelector({
  files,
  onSelect,
  isLoading,
  onGoToDataSources,
}: EditorFileSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div
          className="w-full max-w-[520px] rounded-xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
            boxShadow: "0 0 40px -10px var(--color-accent-subtle)",
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
              <TableProperties className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-primary">Excel Editor</h2>
            <p className="mt-1 text-sm ">Loading your files...</p>
          </div>

          <div className="mt-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-11 w-full animate-pulse rounded-lg bg-bg-hover"
                style={{ backgroundColor: "var(--color-bg-hover)" }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div
        className="w-full max-w-[520px] rounded-xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-default)",
          boxShadow: "0 0 40px -10px var(--color-accent-subtle)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
            <TableProperties className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-primary">Excel Editor</h2>
          <p className="mt-1 text-sm ">Select an uploaded .xlsx workbook to edit.</p>
        </div>

        <div className="mt-8">
          {files.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-tertiary">No files uploaded yet.</p>
              <button
                onClick={onGoToDataSources}
                className="mt-2 text-sm font-medium text-accent hover:underline"
              >
                Go to Data Sources
              </button>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto pr-1">
              {files.map((file) => (
                <button
                  key={file.fileId}
                  onClick={() => onSelect(file.fileId)}
                  disabled={!file.editable}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-hover disabled:opacity-50"
                  style={{ height: "44px" }}
                >
                  <FileSpreadsheet className="h-5 w-5 text-accent" />
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-[13px] font-medium text-primary line-clamp-1 text-left">
                      {file.filename}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-bg-base px-1.5 py-0.5 text-[10px] border border-border-default">
                        {file.editable ? `${file.sheetCount} sheets` : "Read only"}
                      </span>
                      <ChevronRight className="h-3 w-3 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-border-default pt-4">
          <p className="text-center text-[11px] text-tertiary">
            Files uploaded in Data Sources appear here automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
