import { useCallback, useRef, useState } from 'react';

import type { FUniver } from '@univerjs/presets';
import { v4 as uuidv4 } from 'uuid';

import * as api from '@/api/excelEditorApi';
import { useToast } from '@/hooks/useToast';
import type {
  CellFormatting,
  CellValue,
  EditorSession,
  ExcelEditorFile,
  PendingChange,
} from '@/types/ExcelEditor';

export function useExcelEditor() {
  const [availableFiles, setAvailableFiles] = useState<ExcelEditorFile[]>([]);
  const [session, setSession] = useState<EditorSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);

  const univerRef = useRef<FUniver | null>(null);
  const { addToast } = useToast();

  const loadAvailableFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const files = await api.getAvailableFiles();
      setAvailableFiles(files);
    } catch (error) {
      console.error('Failed to load available files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openFile = useCallback(async (fileId: string) => {
    setIsLoading(true);
    try {
      const data = await api.openFile(fileId);
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
      setSession({
        fileId: data.fileId,
        filename: data.filename,
        activeSheetIndex: 0,
        sheets: data.sheets,
        formattingMap: {},
        changeStack: [],
        isDirty: false,
        frozenRows: 0,
        frozenCols: 0,
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeFile = useCallback(() => {
    setSession(null);
    setSelectedChangeId(null);
  }, []);

  // Called by EditorGrid once Univer is initialized and workbook is loaded
  const onWorkbookReady = useCallback((univerAPI: FUniver) => {
    univerRef.current = univerAPI;

    // Sync active sheet index when user clicks Univer's built-in sheet bar
    univerAPI.addEvent(univerAPI.Event.ActiveSheetChanged, (params: unknown) => {
      const p = params as { activeSheet?: { getSheetId: () => string } } | undefined;
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) return;
      const allSheets = workbook.getSheets();
      const newIndex = allSheets.findIndex(
        (s) => s.getSheetId() === p?.activeSheet?.getSheetId()
      );
      if (newIndex !== -1) {
        setSession((prev) => prev ? { ...prev, activeSheetIndex: newIndex } : null);
      }
    });
  }, []);

  // Fired by EditorGrid on SheetValueChanged event — marks file as dirty
  const onCellChanged = useCallback(() => {
    setSession((prev) => prev ? { ...prev, isDirty: true } : null);
  }, []);

  const setActiveSheet = useCallback(async (index: number) => {
    if (!session) return;

    // Activate the sheet in Univer
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
    setSession((prev) => prev ? { ...prev, activeSheetIndex: index } : null);

    // Lazy-load sheet data if not yet fetched
    if (!targetSheet.columns || !targetSheet.rows) {
      setIsLoading(true);
      try {
        const data = await api.getSheetData(session.fileId, targetSheet.sheetName);
        
        // Write lazy loaded data dynamically to Univer sheet
        if (univerRef.current) {
          const workbook = univerRef.current.getActiveWorkbook();
          const sheet = workbook?.getSheetByName(targetSheet.sheetName);
          if (sheet) {
            // Prepend column names as row 0
            if (data.columns) {
              data.columns.forEach((colName, cIdx) => {
                const cellRange = sheet.getRange(0, cIdx, 1, 1);
                cellRange.setValue(colName);
                cellRange.setFontWeight('bold');
                cellRange.setHorizontalAlignment('center');
                cellRange.setBackground('#F3F4F6');
              });
            }
            // Populate actual data rows 1..N
            if (data.rows) {
              data.rows.forEach((row, rIdx) => {
                row.forEach((cellValue, colIndex) => {
                  if (cellValue !== null && cellValue !== undefined) {
                    const cellRange = sheet.getRange(rIdx + 1, colIndex, 1, 1);
                    if (typeof cellValue === 'string' && cellValue.startsWith('=')) {
                      cellRange.setFormula(cellValue);
                    } else {
                      cellRange.setValue(cellValue as any);
                    }
                  }
                });
              });
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
            rowCount: data.rowCount,
            colCount: data.colCount,
          };
          return { ...prev, sheets: updatedSheets };
        });
      } catch (error) {
        console.error('Failed to load sheet data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [session]);

  const applyFormatting = useCallback((formatting: CellFormatting) => {
    if (!univerRef.current || !session) return;
    const workbook = univerRef.current.getActiveWorkbook();
    const sheet = workbook?.getActiveSheet();
    if (!sheet) return;

    const selection = workbook?.getActiveRange();
    if (!selection) return;

    if (formatting.bold !== undefined) selection.setFontWeight(formatting.bold ? 'bold' : 'normal');
    if (formatting.italic !== undefined) selection.setFontStyle(formatting.italic ? 'italic' : 'normal');
    if (formatting.fontSize) selection.setFontSize(formatting.fontSize);
    if (formatting.textColor) selection.setFontColor(formatting.textColor);
    if (formatting.bgColor) selection.setBackground(formatting.bgColor);
    if (formatting.align) selection.setHorizontalAlignment(formatting.align as any);

    // Persist to formattingMap for backend save (borders included even though
    // Univer canvas visual is a v2 item)
    const startRow = selection.getRow();
    const startCol = selection.getColumn();
    const endRow = selection.getLastRow();
    const endCol = selection.getLastColumn();
    const sheetName = sheet.getSheetName();

    setSession((prev) => {
      if (!prev) return null;
      const newMap = { ...prev.formattingMap };
      for (let r = startRow; r <= endRow; r++) {
        if (r === 0) continue; // Skip header row format persistence
        for (let c = startCol; c <= endCol; c++) {
          const key = `${sheetName}:${r - 1}:${c}`;
          newMap[key] = { ...newMap[key], ...formatting };
        }
      }
      return { ...prev, formattingMap: newMap, isDirty: true };
    });
  }, [session]);

  const setFrozen = useCallback((rows: number, cols: number) => {
    setSession((prev) => prev ? ({ ...prev, frozenRows: rows, frozenCols: cols }) : null);
  }, []);

  const addRowBelow = useCallback(() => {
    if (!univerRef.current) return;
    univerRef.current.executeCommand('sheet.command.insert-row-after', { count: 1 });
    setSession((prev) => prev ? ({ ...prev, isDirty: true }) : null);
  }, []);

  const deleteSelectedRows = useCallback(() => {
    if (!univerRef.current) return;
    univerRef.current.executeCommand('sheet.command.delete-rows');
    setSession((prev) => prev ? ({ ...prev, isDirty: true }) : null);
  }, []);

  const addColumnRight = useCallback(() => {
    if (!univerRef.current) return;
    univerRef.current.executeCommand('sheet.command.insert-col-after', { count: 1 });
    setSession((prev) => prev ? ({ ...prev, isDirty: true }) : null);
  }, []);

  const deleteSelectedColumns = useCallback(() => {
    if (!univerRef.current) return;
    univerRef.current.executeCommand('sheet.command.delete-cols');
    setSession((prev) => prev ? ({ ...prev, isDirty: true }) : null);
  }, []);

  // Extract all sheet rows from the Univer workbook snapshot.
  // cellData is a sparse object — missing keys mean empty cells.
  // Must iterate 0..rowCount-1 and 0..columnCount-1 to get full dense rows.
  const extractRowsFromSnapshot = useCallback((sheetSnapshot: Record<string, unknown>, colCount: number) => {
    const cellData = (sheetSnapshot.cellData || {}) as Record<number, Record<number, { v?: CellValue; f?: string } | undefined> | undefined>;
    const rowCount = (sheetSnapshot.rowCount as number) || 0;

    // Extract columns from row index 0
    const columns: string[] = [];
    for (let c = 0; c < colCount; c++) {
      const cell = cellData[0]?.[c];
      columns.push(cell?.v ? String(cell.v) : `Column ${c + 1}`);
    }

    // Extract actual data rows from row index 1 onwards
    const rows: CellValue[][] = [];
    for (let r = 1; r < rowCount; r++) {
      const row: CellValue[] = [];
      for (let c = 0; c < colCount; c++) {
        const cell = cellData[r]?.[c];
        if (!cell) {
          row.push(null);
        } else if (cell.f) {
          row.push(cell.f);
        } else {
          row.push(cell.v ?? null);
        }
      }
      rows.push(row);
    }
    return { columns, rows };
  }, []);

  const submitMutationPrompt = useCallback(async (instruction: string) => {
    if (!session || !univerRef.current) return;

    setIsGenerating(true);
    try {
      const activeSheet = session.sheets[session.activeSheetIndex];
      const workbook = univerRef.current.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      // Get live rows from Univer snapshot so in-canvas edits are captured
      const snapshot = workbook.save() as { sheets?: Record<string, Record<string, unknown>> };
      const sheetId = `sheet_${session.activeSheetIndex}`;
      const sheetSnapshot = snapshot.sheets?.[sheetId] || {};
      const { columns: extractedCols, rows: currentRows } = extractRowsFromSnapshot(sheetSnapshot, activeSheet.colCount);

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
        status: 'pending',
        generatedCode: result.pandasCode,
      };

      setSession((prev) => prev ? ({
        ...prev,
        changeStack: [newChange, ...prev.changeStack],
      }) : null);
      setSelectedChangeId(newChange.changeId);
    } catch (error) {
      console.error('Mutation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [session, extractRowsFromSnapshot]);

  const acceptChange = useCallback(async (changeId: string) => {
    const change = session?.changeStack.find((c) => c.changeId === changeId);
    if (!change || !session || !univerRef.current) return;

    setIsLoading(true);
    try {
      const workbook = univerRef.current.getActiveWorkbook();
      const activeSheet = workbook?.getActiveSheet();
      if (!activeSheet) return;

      const currentSheetData = session.sheets[session.activeSheetIndex];

      const result = await api.applyMutation({
        fileId: session.fileId,
        sheetName: change.targetSheet,
        pandasCode: change.generatedCode || '',
        currentRows: currentSheetData.rows || [],
        columns: currentSheetData.columns || [],
      });

      if (result.success) {
        // Apply each diff row directly to the Univer canvas
        change.diffRows.forEach((diff) => {
          const colIndex = (currentSheetData.columns || []).indexOf(diff.columnName);
          if (colIndex === -1) return;
          const range = activeSheet.getRange(diff.rowIndex + 1, colIndex, 1, 1);
          if (diff.isFormula && typeof diff.newValue === 'string') {
            range.setFormula(diff.newValue);
          } else {
            range.setValue(diff.newValue as any);
          }
        });

        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            isDirty: true,
            changeStack: prev.changeStack.map((c) =>
              c.changeId === changeId
                ? { ...c, status: 'accepted' as const, appliedAt: new Date().toISOString() }
                : c
            ),
          };
        });

        addToast({ type: 'success', title: 'Change applied', description: `${change.affectedRowCount} rows updated.` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast({ type: 'error', title: 'Apply failed', description: msg });
    } finally {
      setIsLoading(false);
    }
  }, [session, addToast]);

  const rejectChange = useCallback((changeId: string) => {
    setSession((prev) => prev ? ({
      ...prev,
      changeStack: prev.changeStack.map((c) =>
        c.changeId === changeId ? { ...c, status: 'rejected' as const } : c
      ),
    }) : null);
  }, []);

  const saveFile = useCallback(async () => {
    if (!univerRef.current || !session) return;
    setIsSaving(true);

    try {
      const workbook = univerRef.current.getActiveWorkbook();
      if (!workbook) throw new Error('No workbook loaded');

      const snapshot = workbook.save() as { sheets?: Record<string, Record<string, unknown>> };

      const sheetsForBackend = session.sheets.map((sessionSheet, index) => {
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

        const sheetId = `sheet_${index}`;
        const sheetSnapshot = snapshot.sheets?.[sheetId] || {};
        const colCount = sessionSheet.colCount || 0;
        const { columns, rows } = extractRowsFromSnapshot(sheetSnapshot, colCount);

        return {
          sheetName: sessionSheet.sheetName,
          rows,
          columns,
          rowCount: rows.length,
          colCount,
        };
      });

      await api.saveEdits({
        fileId: session.fileId,
        sheets: sheetsForBackend,
        formattingMap: session.formattingMap,
      });

      setSession((prev) => prev ? ({ ...prev, isDirty: false }) : null);
      addToast({ type: 'success', title: 'Saved', description: 'File saved successfully.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast({ type: 'error', title: 'Save failed', description: msg });
    } finally {
      setIsSaving(false);
    }
  }, [session, addToast, extractRowsFromSnapshot]);

  return {
    availableFiles,
    loadAvailableFiles,
    openFile,
    closeFile,
    session,
    isLoading,
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
  };
}
