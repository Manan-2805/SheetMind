import { useCallback, useRef, useState } from 'react';

import { HotTableClass } from '@handsontable/react';
import { v4 as uuidv4 } from 'uuid';

import * as api from '@/api/excelEditorApi';
import type {
  CellFormatting,
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

  const hotRef = useRef<HotTableClass>(null);

  // Load available files for Mode A
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

  // Mode A -> Mode B
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

  // Sync current grid data back to session rows
  const syncGridToSession = useCallback(() => {
    if (!session || !hotRef.current) return;
    const hot = hotRef.current.hotInstance;
    if (!hot) return;

    const data = hot.getData();
    const activeSheet = session.sheets[session.activeSheetIndex];

    // Update local rows
    const updatedSheets = [...session.sheets];
    updatedSheets[session.activeSheetIndex] = {
      ...activeSheet,
      rows: data,
      rowCount: data.length,
      colCount: data[0]?.length || 0,
    };

    setSession((prev) => prev ? ({ ...prev, sheets: updatedSheets }) : null);
  }, [session]);

  const setActiveSheet = useCallback(async (index: number) => {
    if (!session) return;

    // 1. Sync current sheet data
    syncGridToSession();

    const targetSheet = session.sheets[index];
    if (!targetSheet.columns || !targetSheet.rows) {
      setIsLoading(true);
      try {
        const data = await api.getSheetData(session.fileId, targetSheet.sheetName);
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
          return {
            ...prev,
            activeSheetIndex: index,
            sheets: updatedSheets,
          };
        });
      } catch (error) {
        console.error('Failed to load sheet data:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // 2. Switch index
      setSession((prev) => prev ? ({ ...prev, activeSheetIndex: index }) : null);
    }
  }, [session, syncGridToSession]);

  const applyFormatting = useCallback((formatting: CellFormatting) => {
    if (!session || !hotRef.current) return;
    const hot = hotRef.current.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected) return;

    const newFormattingMap = { ...session.formattingMap };
    const sheetName = session.sheets[session.activeSheetIndex].sheetName;

    for (const [rStart, cStart, rEnd, cEnd] of selected) {
      const r1 = Math.min(rStart, rEnd);
      const r2 = Math.max(rStart, rEnd);
      const c1 = Math.min(cStart, cEnd);
      const c2 = Math.max(cStart, cEnd);

      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const key = `${sheetName}:${r}:${c}`;
          newFormattingMap[key] = {
            ...(newFormattingMap[key] || {}),
            ...formatting,
          };
        }
      }
    }

    setSession((prev) => prev ? ({
      ...prev,
      formattingMap: newFormattingMap,
      isDirty: true
    }) : null);

    hot.render(); // Repaint with new styles
  }, [session]);

  const setFrozen = useCallback((rows: number, cols: number) => {
    setSession((prev) => prev ? ({ ...prev, frozenRows: rows, frozenCols: cols }) : null);
  }, []);

  const addRowBelow = useCallback(() => {
    if (!session || !hotRef.current) return;
    const hot = hotRef.current.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    const rowIdx = selected ? Math.max(...selected.map((s: number[]) => Math.max(s[0], s[2]))) : hot.countRows() - 1;

    hot.alter('insert_row_below', rowIdx, 1);
    setSession(prev => prev ? ({ ...prev, isDirty: true }) : null);
  }, [session]);

  const deleteSelectedRows = useCallback(() => {
    if (!session || !hotRef.current) return;
    const hot = hotRef.current.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected) return;

    // Simplified deletion logic for multiple ranges
    for (const [rStart, , rEnd,] of selected) {
      const r1 = Math.min(rStart, rEnd);
      const r2 = Math.max(rStart, rEnd);
      hot.alter('remove_row', r1, (r2 - r1) + 1);
    }
    setSession(prev => prev ? ({ ...prev, isDirty: true }) : null);
  }, [session]);

  const addColumnRight = useCallback(() => {
    if (!session || !hotRef.current) return;
    const hot = hotRef.current.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    const colIdx = selected ? Math.max(...selected.map((s: number[]) => Math.max(s[1], s[3]))) : hot.countCols() - 1;

    hot.alter('insert_col_end', colIdx, 1);
    setSession(prev => prev ? ({ ...prev, isDirty: true }) : null);
  }, [session]);

  const deleteSelectedColumns = useCallback(() => {
    if (!session || !hotRef.current) return;
    const hot = hotRef.current.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected) return;

    for (const [, cStart, , cEnd] of selected) {
      const c1 = Math.min(cStart, cEnd);
      const c2 = Math.max(cStart, cEnd);
      hot.alter('remove_col', c1, (c2 - c1) + 1);
    }
    setSession(prev => prev ? ({ ...prev, isDirty: true }) : null);
  }, [session]);

  // AI mutation
  const submitMutationPrompt = useCallback(async (instruction: string) => {
    if (!session || !hotRef.current) return;
    const hot = hotRef.current.hotInstance;
    if (!hot) return;

    setIsGenerating(true);
    try {
      const activeSheet = session.sheets[session.activeSheetIndex];
      const result = await api.mutateFile({
        fileId: session.fileId,
        sheetName: activeSheet.sheetName,
        userInstruction: instruction,
        currentRows: hot.getData(),
        columns: activeSheet.columns || [],
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
        changeStack: [newChange, ...prev.changeStack]
      }) : null);
      setSelectedChangeId(newChange.changeId);

    } catch (error) {
      console.error('Mutation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [session]);

  const acceptChange = useCallback(async (changeId: string) => {
    if (!session || !hotRef.current) return;
    const hot = hotRef.current.hotInstance;
    if (!hot) return;

    const change = session.changeStack.find(c => c.changeId === changeId);
    if (!change || !change.generatedCode) return;

    setIsLoading(true);
    try {
      const activeSheet = session.sheets[session.activeSheetIndex];
      await api.applyMutation({
        fileId: session.fileId,
        sheetName: activeSheet.sheetName,
        pandasCode: change.generatedCode,
        currentRows: hot.getData(),
        columns: activeSheet.columns || [],
      });

      // Update local data by applying diffRows
      // Actually the backend applies it and we should probably just reload?
      // But instructions say "updates session.sheets[activeSheetIndex].rows with mutated data"
      // and "calls hotRef.current.loadData()".
      // Since we sent currentRows, we can apply the diff locally to be fast.
      const newData = [...hot.getData()];
      change.diffRows.forEach(diff => {
        if (diff.rowIndex < newData.length) {
          const colIdx = (activeSheet.columns || []).indexOf(diff.columnName);
          if (colIdx !== -1) {
            newData[diff.rowIndex][colIdx] = diff.newValue;
          }
        }
      });

      const updatedSheets = [...session.sheets];
      updatedSheets[session.activeSheetIndex] = {
        ...activeSheet,
        rows: newData,
        rowCount: newData.length,
      };

      setSession((prev) => prev ? ({
        ...prev,
        sheets: updatedSheets,
        changeStack: prev.changeStack.map(c =>
          c.changeId === changeId ? { ...c, status: 'accepted', appliedAt: new Date().toISOString() } : c
        )
      }) : null);

      hot.loadData(newData);

    } catch (error) {
      console.error('Accept change failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const rejectChange = useCallback((changeId: string) => {
    setSession((prev) => prev ? ({
      ...prev,
      changeStack: prev.changeStack.map(c =>
        c.changeId === changeId ? { ...c, status: 'rejected' } : c
      )
    }) : null);
  }, []);

  const saveFile = useCallback(async () => {
    if (!session) return;

    // Sync first
    syncGridToSession();

    setIsSaving(true);
    try {
      await api.saveEdits({
        fileId: session.fileId,
        sheets: session.sheets,
        formattingMap: session.formattingMap,
      });
      setSession(prev => prev ? ({ ...prev, isDirty: false }) : null);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [session, syncGridToSession]);

  // Handle manual edits marking isDirty
  const handleAfterChange = useCallback((changes: unknown[] | null, source: string) => {
    if (source === 'loadData' || !changes) return;
    setSession(prev => prev ? ({ ...prev, isDirty: true }) : null);
  }, []);

  return {
    availableFiles,
    loadAvailableFiles,
    openFile,
    closeFile,
    session,
    isLoading,
    activeSheetIndex: session?.activeSheetIndex ?? 0,
    setActiveSheet,
    hotRef: hotRef as React.RefObject<HotTableClass>,
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
    handleAfterChange,
  };
}
