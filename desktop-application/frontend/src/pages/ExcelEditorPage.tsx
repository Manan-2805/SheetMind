import { AlertTriangle, ChevronLeft, Save, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EditorAIPanel } from "@/components/editor/EditorAIPanel";
import { EditorFileSelector } from "@/components/editor/EditorFileSelector";
import { EditorGrid } from "@/components/editor/EditorGrid";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { useExcelEditor } from "@/hooks/useExcelEditor";

interface ExcelEditorPageProps {
  onViewChange: (
    view: "chat" | "data-sources" | "settings" | "saved-queries" | "artifacts" | "excel-editor"
  ) => void;
}

export function ExcelEditorPage({ onViewChange }: ExcelEditorPageProps) {
  const {
    availableFiles,
    loadAvailableFiles,
    openFile,
    closeFile,
    session,
    isLoading,
    workbookVersion,
    activeSheetIndex,
    univerRef,
    onWorkbookReady,
    onCellChanged,
    setFrozen,
    addRowBelow,
    deleteSelectedRows,
    addColumnRight,
    deleteSelectedColumns,
    isGenerating,
    submitMutationPrompt,
    acceptChange,
    rejectChange,
    selectedChangeId,
    setSelectedChangeId,
    isSaving,
    saveFile,
  } = useExcelEditor();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleSelectFile = useCallback(
    (fileId: string) => {
      openFile(fileId);
      navigate(`/excel-editor?fileId=${encodeURIComponent(fileId)}`, { replace: true });
    },
    [navigate, openFile]
  );

  useEffect(() => {
    const fileId = searchParams.get("fileId");
    if (fileId && !session && !isLoading) {
      openFile(fileId);
    }
  }, [searchParams, session, isLoading, openFile]);

  useEffect(() => {
    if (!session) {
      loadAvailableFiles();
    }
  }, [session, loadAvailableFiles]);

  useEffect(() => {
    if (!import.meta.env.DEV || !session) return;
    const active = session.sheets[activeSheetIndex];
    console.debug("[ExcelEditor] active sheet", {
      fileId: session.fileId,
      sheetName: active?.sheetName,
      rowCount: active?.rowCount,
      colCount: active?.colCount,
    });
  }, [session, activeSheetIndex]);

  if (!session) {
    return (
      <div className="flex h-full flex-col bg-bg-base">
        <EditorFileSelector
          files={availableFiles}
          onSelect={handleSelectFile}
          isLoading={isLoading}
          onGoToDataSources={() => onViewChange("data-sources")}
        />
      </div>
    );
  }

  const activeSheet = session.sheets[activeSheetIndex];

  return (
    <div className="flex h-full flex-col bg-bg-base animate-in fade-in duration-300">
      {/* Editor Header */}
      <header
        className="flex h-12 shrink-0 items-center justify-between px-4"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              closeFile();
              navigate("/excel-editor", { replace: true });
            }}
            className="flex items-center gap-1.5  hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-[13px] font-medium">Back</span>
          </button>

          <div className="h-4 w-[1px] bg-border-default" />

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-primary">{session.filename}</h1>
            <span className="rounded-full bg-bg-base border border-border-default px-2 py-0.5 text-[10px] text-tertiary">
              {session.sheets.length} sheets
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session.isDirty && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-warning/10 text-warning animate-pulse">
              <div className="h-1.5 w-1.5 rounded-full bg-warning" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Unsaved Changes
              </span>
            </div>
          )}

          <button
            onClick={saveFile}
            disabled={!session.isDirty || isSaving}
            className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100"
          >
            {isSaving ? (
              <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save to File
          </button>

          <button
            onClick={() => {
              closeFile();
              navigate("/excel-editor", { replace: true });
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-tertiary hover:bg-bg-hover hover:text-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Editor Toolbar */}
      <EditorToolbar
        onAddRow={addRowBelow}
        onDeleteRow={deleteSelectedRows}
        onAddCol={addColumnRight}
        onDeleteCol={deleteSelectedColumns}
        onFreeze={setFrozen}
      />

      {/* Editor Content Area */}
      <Group orientation="vertical" className="flex-1 min-h-0">
        <Panel defaultSize={60} minSize={30} className="min-h-0">
          <div className="flex flex-col h-full min-h-0 bg-bg-base">
            <div className="flex-1 relative min-h-0 h-full w-full">
              <EditorGrid
                key={workbookVersion}
                sheets={session.sheets}
                activeSheetIndex={activeSheetIndex}
                formattingMap={session.formattingMap}
                frozenRows={session.frozenRows}
                frozenCols={session.frozenCols}
                univerRef={univerRef}
                onWorkbookReady={onWorkbookReady}
                onCellChanged={onCellChanged}
              />
              {activeSheet.rowCount > 5000 && (
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-lg bg-warning px-3 py-2 text-white shadow-xl animate-in slide-in-from-right-4">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Large sheet ({activeSheet.rowCount} rows). Virtualization active.
                  </span>
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Separator className="h-2 bg-transparent hover:bg-accent/10 transition-colors group relative z-50">
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="h-1 w-8 rounded-full bg-accent/40" />
          </div>
        </Separator>

        <Panel minSize={25} defaultSize={40} className="min-h-0">
          <EditorAIPanel
            changeStack={session.changeStack}
            selectedChangeId={selectedChangeId}
            onSelectChange={setSelectedChangeId}
            onAcceptChange={acceptChange}
            onRejectChange={rejectChange}
            onSubmitPrompt={submitMutationPrompt}
            isGenerating={isGenerating}
            activeSheetName={activeSheet.sheetName}
          />
        </Panel>
      </Group>
    </div>
  );
}
