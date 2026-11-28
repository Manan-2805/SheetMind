import type { FUniver } from "@univerjs/presets";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import * as api from "@/api/excelEditorApi";
import { useToast } from "@/hooks/useToast";
import type {
  CellFormatting,
  CellFormattingMap,
  CellValue,
  EditorSession,
  ExcelEditorFile,
  PendingChange,
} from "@/types/ExcelEditor";

type Workbook = NonNullable<ReturnType<FUniver["getActiveWorkbook"]>>;

function getSheetSnapshot(
  workbook: Workbook,
  snapshot: ReturnType<Workbook["save"]>,
  sheetName: string
) {
  const sheet = workbook.getSheetByName(sheetName);
  const sheetSnapshot = sheet && snapshot.sheets[sheet.getSheetId()];
  if (!sheetSnapshot) throw new Error(`The spreadsheet grid could not read "${sheetName}".`);
  return sheetSnapshot;
}

export function useExcelEditor() {
  const [availableFiles, setAvailableFiles] = useState<ExcelEditorFile[]>([]);
  const [session, setSession] = useState<EditorSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [workbookVersion, setWorkbookVersion] = useState(0);
  const [history, setHistory] = useState<api.HistoryRecord[]>([]);
  const isLoadingSheet = useRef(false);
  const formattingChanges = useRef<CellFormattingMap>({});

  const univerRef = useRef<FUniver | null>(null);
  const failedFileIdRef = useRef<string | null>(null);
  const { addToast } = useToast();

  const sessionRef = useRef<EditorSession | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const loadAvailableFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const files = await api.getAvailableFiles();
      setAvailableFiles(files);
    } catch (error) {
      console.error("Failed to load available files:", error);
      addToast({
        type: "error",
        title: "Error loading files",
        description: "Could not load available Excel files.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const openFile = useCallback(
    async (fileId: string) => {
      if (failedFileIdRef.current === fileId) {
        console.warn("[ExcelEditor] Skipping openFile as it previously failed:", fileId);
        return;
      }
      setIsLoading(true);
      try {
        const data = await api.openFile(fileId);
        failedFileIdRef.current = null; // reset failure flag on success
        if (import.meta.env.DEV) {
          const sheetStats = data.sheets.map((sheet) => ({
            sheetName: sheet.sheetName,
            rowCount: sheet.rowCount,
            colCount: sheet.colCount,
          }));
          console.debug("[ExcelEditor] openFile", {
            fileId: data.fileId,
            filename: data.filename,
            sheetCount: data.sheets.length,
            sheetStats,
          });
        }
        formattingChanges.current = {};
        setHistory([]);
        setSession({
          fileId: data.fileId,
          filename: data.filename,
          activeSheetIndex: 0,
          sheets: data.sheets,
          formattingMap: data.formattingMap || {},
          changeStack: [],
          isDirty: false,
          frozenRows: 0,
          frozenCols: 0,
        });
      } catch (error) {
        failedFileIdRef.current = fileId; // set failure flag
        addToast({
          type: "error",
          title: "Failed to open file",
          description: api.describeEditorError(error, "Could not open the workbook."),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  const closeFile = useCallback(() => {
    setSession(null);
    setSelectedChangeId(null);
    setHistory([]);
    formattingChanges.current = {};
    failedFileIdRef.current = null;
  }, []);

  const setActiveSheet = useCallback(
    async (index: number) => {
      if (!session) return;

      if (univerRef.current) {
        const workbook = univerRef.current.getActiveWorkbook();
        if (workbook) {
          const allSheets = workbook.getSheets();
          if (allSheets[index]) {
            allSheets[index].activate();
          }
        }
      }

      const targetSheet = session.sheets[index];
      setSession((prev) => (prev ? { ...prev, activeSheetIndex: index } : null));

      if (!targetSheet.columns || !targetSheet.rows) {
        setIsLoading(true);
        try {
          const data = await api.getSheetData(session.fileId, targetSheet.sheetName);

          if (univerRef.current) {
            const workbook = univerRef.current.getActiveWorkbook();
            const sheet = workbook?.getSheetByName(targetSheet.sheetName);
            if (sheet) {
              isLoadingSheet.current = true;
              try {
                if (data.columns) {
                  data.columns.forEach((colName, cIdx) => {
                    const cellRange = sheet.getRange(0, cIdx, 1, 1);
                    cellRange.setValue(colName);
                    cellRange.setFontWeight("bold");
                    cellRange.setHorizontalAlignment("center");
                    cellRange.setBackground("#F3F4F6");
                  });
                }
                if (data.rows) {
                  const formulas = new Set(data.formulaCells);
                  data.rows.forEach((row, rIdx) => {
                    row.forEach((cellValue, colIndex) => {
                      if (cellValue !== null && cellValue !== undefined) {
                        const cellRange = sheet.getRange(rIdx + 1, colIndex, 1, 1);
                        if (typeof cellValue === "string" && formulas.has(`${rIdx}:${colIndex}`)) {
                          cellRange.setFormula(cellValue);
                        } else {
                          cellRange.setValue(cellValue as never);
                        }
                      }
                    });
                  });
                }
              } finally {
                isLoadingSheet.current = false;
              }
            }
          }

          setSession((prev) => {
            if (!prev) return null;
            const updatedSheets = [...prev.sheets];
            updatedSheets[index] = {
              ...updatedSheets[index],
              columns: data.columns,
              rows: data.rows,
              formulaCells: data.formulaCells,
              rowCount: data.rowCount,
              colCount: data.colCount,
            };
            return { ...prev, sheets: updatedSheets };
          });
        } catch (error) {
          console.error("Failed to load sheet data:", error);
          addToast({
            type: "error",
            title: "Failed to load sheet",
            description: "Could not load sheet data. Please try again.",
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [session, addToast]
  );

  const onWorkbookReady = useCallback(
    (univerAPI: FUniver) => {
      univerRef.current = univerAPI;

      univerAPI.addEvent(univerAPI.Event.ActiveSheetChanged, (params: unknown) => {
        const p = params as { activeSheet?: { getSheetId: () => string } } | undefined;
        const workbook = univerAPI.getActiveWorkbook();
        if (!workbook) return;
        const allSheets = workbook.getSheets();
        const newIndex = allSheets.findIndex(
          (s) => s.getSheetId() === p?.activeSheet?.getSheetId()
        );

        if (newIndex !== -1) {
          const curSession = sessionRef.current;
          if (curSession) {
            if (curSession.isDirty && curSession.activeSheetIndex !== newIndex) {
              const prevSheet = allSheets[curSession.activeSheetIndex];
              if (prevSheet) {
                prevSheet.activate();
                addToast({
                  type: "error",
                  title: "Unsaved Changes",
                  description: "Please save your current sheet changes before switching sheets.",
                });
                return;
              }
            }

            setSession((prev) => (prev ? { ...prev, activeSheetIndex: newIndex } : null));

            const targetSheet = curSession.sheets[newIndex];
            if (targetSheet && (!targetSheet.columns || !targetSheet.rows)) {
              setActiveSheet(newIndex);
            }
          }
        }
      });
    },
    [setActiveSheet, addToast]
  );

  const onCellChanged = useCallback(() => {
    if (isLoadingSheet.current) return;
    setSession((prev) => (prev ? { ...prev, isDirty: true } : null));
  }, []);

  const applyFormatting = useCallback(
    (formatting: CellFormatting) => {
      if (!univerRef.current || !session) return;
      const workbook = univerRef.current.getActiveWorkbook();
      const sheet = workbook?.getActiveSheet();
      if (!sheet) return;

      const selection = workbook?.getActiveRange();
      if (!selection) return;

      if (formatting.bold !== undefined)
        selection.setFontWeight(formatting.bold ? "bold" : "normal");
      if (formatting.italic !== undefined)
        selection.setFontStyle(formatting.italic ? "italic" : "normal");
      if (formatting.fontSize) selection.setFontSize(formatting.fontSize);
      if (formatting.textColor) selection.setFontColor(formatting.textColor);
      if (formatting.bgColor) selection.setBackground(formatting.bgColor);
      if (formatting.align) selection.setHorizontalAlignment(formatting.align as never);

      // Persist to formattingMap for backend save (borders included even though
      // Univer canvas visual is a v2 item)
      const startRow = selection.getRow();
      const startCol = selection.getColumn();
      const endRow = selection.getLastRow();
      const endCol = selection.getLastColumn();
      const sheetName = sheet.getSheetName();

      for (let row = Math.max(1, startRow); row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const key = `${sheetName}:${row - 1}:${col}`;
          const changes = formattingChanges.current;
          changes[key] = { ...changes[key], ...formatting };
        }
      }
      setSession((prev) => (prev ? { ...prev, isDirty: true } : null));
    },
    [session]
  );

  const setFrozen = useCallback((rows: number, cols: number) => {
    setSession((prev) => (prev ? { ...prev, frozenRows: rows, frozenCols: cols } : null));
  }, []);

  const addRowBelow = useCallback(() => {
    if (!univerRef.current) return;
    univerRef.current.executeCommand("sheet.command.insert-row-after", { count: 1 });
    setSession((prev) => (prev ? { ...prev, isDirty: true } : null));
  }, []);

  const deleteSelectedRows = useCallback(() => {
    if (!univerRef.current) return;
    univerRef.current.executeCommand("sheet.command.delete-rows");
    setSession((prev) => (prev ? { ...prev, isDirty: true } : null));
  }, []);

  const addColumnRight = useCallback(() => {
    if (!univerRef.current) return;
    univerRef.current.executeCommand("sheet.command.insert-col-after", { count: 1 });
    setSession((prev) => (prev ? { ...prev, isDirty: true } : null));
  }, []);

  const deleteSelectedColumns = useCallback(() => {
    if (!univerRef.current) return;
    univerRef.current.executeCommand("sheet.command.delete-cols");
    setSession((prev) => (prev ? { ...prev, isDirty: true } : null));
  }, []);

  const extractRowsFromSnapshot = useCallback((sheetSnapshot: Record<string, unknown>) => {
    const cellData = (sheetSnapshot.cellData || {}) as Record<
      number,
      Record<number, { v?: CellValue; f?: string } | undefined> | undefined
    >;
    let lastRow = 0;
    let lastCol = -1;
    for (const [row, cells] of Object.entries(cellData)) {
      for (const [col, cell] of Object.entries(cells || {})) {
        if (cell?.f || (cell?.v !== null && cell?.v !== undefined && cell.v !== "")) {
          lastRow = Math.max(lastRow, Number(row));
          lastCol = Math.max(lastCol, Number(col));
        }
      }
    }

    const columns = Array.from({ length: lastCol + 1 }, (_, col) => {
      const header = cellData[0]?.[col]?.v;
      return header === null || header === undefined || header === ""
        ? `Column ${col + 1}`
        : String(header);
    });
    const formulaCells: string[] = [];
    const rows = Array.from({ length: lastRow }, (_, row) =>
      columns.map((_, col) => {
        const cell = cellData[row + 1]?.[col];
        if (cell?.f) formulaCells.push(`${row}:${col}`);
        return cell?.f ?? cell?.v ?? null;
      })
    );
    return { columns, rows, formulaCells };
  }, []);

  const reloadWorkbook = useCallback(async (fileId: string, activeIndex: number) => {
    const data = await api.openFile(fileId);
    if (activeIndex > 0) {
      data.sheets[activeIndex] = await api.getSheetData(fileId, data.sheets[activeIndex].sheetName);
    }
    formattingChanges.current = {};
    setSession((prev) =>
      prev?.fileId === fileId
        ? { ...prev, sheets: data.sheets, formattingMap: data.formattingMap || {}, isDirty: false }
        : prev
    );
    setWorkbookVersion((version) => version + 1);
  }, []);

  const submitMutationPrompt = useCallback(
    async (instruction: string) => {
      if (!session || !univerRef.current || isLoading || isSaving || isGenerating) return;
      if (session.isDirty || univerRef.current.getActiveWorkbook()?.isCellEditing()) {
        addToast({
          type: "error",
          title: "Mutation Failed",
          description: "Save your manual edits first",
        });
        return;
      }

      setIsGenerating(true);
      try {
        const activeSheet = session.sheets[session.activeSheetIndex];
        const workbook = univerRef.current.getActiveWorkbook();
        if (!workbook) throw new Error("No active workbook");

        const { columns: extractedCols, rows: currentRows } = extractRowsFromSnapshot(
          getSheetSnapshot(workbook, workbook.save(), activeSheet.sheetName)
        );

        const result = await api.mutateFile({
          fileId: session.fileId,
          sheetName: activeSheet.sheetName,
          userInstruction: instruction,
          currentRows,
          columns: extractedCols,
        });

        const newChange: PendingChange = {
          changeId: uuidv4(),
          promptText: instruction,
          operationType: result.operationType,
          targetSheet: activeSheet.sheetName,
          affectedRowCount: result.affectedRowCount,
          diffRows: result.diffRows,
          status: "pending",
          operations: result.operations,
          operationSummary: result.operationSummary,
        };

        setSession((prev) =>
          prev
            ? {
                ...prev,
                changeStack: [newChange, ...prev.changeStack],
              }
            : null
        );
        setSelectedChangeId(newChange.changeId);
      } catch (error) {
        addToast({
          type: "error",
          title: "Mutation Failed",
          description: api.describeEditorError(error, "Could not preview the spreadsheet edit."),
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [session, extractRowsFromSnapshot, addToast, isLoading, isSaving, isGenerating]
  );

  const acceptChange = useCallback(
    async (changeId: string) => {
      const change = session?.changeStack.find((c) => c.changeId === changeId);
      if (!change || !session || !univerRef.current || change.operations.length === 0) return;
      if (session.isDirty) {
        addToast({
          type: "error",
          title: "Apply failed",
          description: "Save your manual edits first",
        });
        return;
      }

      setIsLoading(true);
      try {
        const targetIndex = session.sheets.findIndex(
          (sheet) => sheet.sheetName === change.targetSheet
        );
        const target = session.sheets[targetIndex];
        if (!target) return;

        await api.applyMutation({
          fileId: session.fileId,
          sheetName: change.targetSheet,
          operations: change.operations,
          currentRows: target.rows || [],
          columns: target.columns || [],
        });

        await reloadWorkbook(session.fileId, session.activeSheetIndex);
        setSession((prev) => {
          if (!prev || prev.fileId !== session.fileId) return prev;
          return {
            ...prev,
            changeStack: prev.changeStack.map((item) =>
              item.changeId === changeId
                ? { ...item, status: "accepted" as const, appliedAt: new Date().toISOString() }
                : item
            ),
          };
        });
        addToast({
          type: "success",
          title: "Change applied",
          description: `${change.affectedRowCount} rows updated.`,
        });
      } catch (err: unknown) {
        addToast({
          type: "error",
          title: "Apply failed",
          description: api.describeEditorError(err, "Could not apply the change."),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [session, addToast, reloadWorkbook]
  );

  const loadHistory = useCallback(async () => {
    if (!session) return;
    try {
      setHistory(await api.getHistory(session.fileId));
    } catch (error) {
      addToast({
        type: "error",
        title: "Could not load history",
        description: api.describeEditorError(error, "Try reopening the workbook."),
      });
    }
  }, [session, addToast]);

  const restoreBackup = useCallback(
    async (historyId: string) => {
      if (!session || !historyId || session.isDirty) return;
      setIsLoading(true);
      try {
        await api.restoreBackup(session.fileId, historyId);
        await reloadWorkbook(session.fileId, session.activeSheetIndex);
        setHistory(await api.getHistory(session.fileId));
        setSelectedChangeId(null);
        setSession((prev) =>
          prev?.fileId === session.fileId ? { ...prev, changeStack: [] } : prev
        );
        addToast({ type: "success", title: "Workbook restored" });
      } catch (error) {
        addToast({
          type: "error",
          title: "Restore failed",
          description: api.describeEditorError(error, "Could not restore the workbook."),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [session, addToast, reloadWorkbook]
  );

  const rejectChange = useCallback((changeId: string) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            changeStack: prev.changeStack.map((c) =>
              c.changeId === changeId ? { ...c, status: "rejected" as const } : c
            ),
          }
        : null
    );
  }, []);

  const saveFile = useCallback(async () => {
    if (!univerRef.current || !session || isSaving || isLoading || isGenerating) return;
    setIsSaving(true);

    try {
      const workbook = univerRef.current.getActiveWorkbook();
      if (!workbook) throw new Error("No workbook loaded");

      if (workbook.isCellEditing() && !(await workbook.endEditingAsync(true))) {
        throw new Error("Finish editing the selected cell before saving.");
      }

      const snapshot = workbook.save();
      const sheetsForBackend = session.sheets.map((sessionSheet) => {
        if (!sessionSheet.columns || !sessionSheet.rows) {
          // If this sheet has not been loaded, return null columns and rows to skip modifying it in the backend
          return {
            sheetName: sessionSheet.sheetName,
            rows: undefined,
            columns: undefined,
            rowCount: sessionSheet.rowCount,
            colCount: sessionSheet.colCount,
          };
        }

        const { columns, rows, formulaCells } = extractRowsFromSnapshot(
          getSheetSnapshot(workbook, snapshot, sessionSheet.sheetName)
        );

        return {
          sheetName: sessionSheet.sheetName,
          rows,
          columns,
          rowCount: rows.length,
          colCount: columns.length,
          formulaCells,
        };
      });

      await api.saveEdits({
        fileId: session.fileId,
        sheets: sheetsForBackend,
        formattingMap: formattingChanges.current,
      });

      await reloadWorkbook(session.fileId, session.activeSheetIndex);
      addToast({
        type: "success",
        title: "Saved",
        description: "Saved in SheetMind. Use Download copy to open it outside the app.",
      });
    } catch (err: unknown) {
      addToast({
        type: "error",
        title: "Save failed",
        description: api.describeEditorError(err, "Could not save the workbook."),
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    session,
    addToast,
    extractRowsFromSnapshot,
    reloadWorkbook,
    isSaving,
    isLoading,
    isGenerating,
  ]);

  const downloadFile = useCallback(async () => {
    if (!session) return;
    try {
      await api.downloadWorkbook(session.fileId, session.filename);
    } catch (error) {
      addToast({
        type: "error",
        title: "Download failed",
        description: api.describeEditorError(error, "Could not download the workbook."),
      });
    }
  }, [session, addToast]);

  return {
    availableFiles,
    loadAvailableFiles,
    openFile,
    closeFile,
    session,
    isLoading,
    workbookVersion,
    history,
    loadHistory,
    restoreBackup,
    activeSheetIndex: session?.activeSheetIndex ?? 0,
    setActiveSheet,
    univerRef,
    onWorkbookReady,
    onCellChanged,
    applyFormatting,
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
    downloadFile,
  };
}
