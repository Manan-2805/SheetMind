export type CellValue = string | number | boolean | null;

export interface SheetData {
  sheetName: string;
  columns: string[];          // column header names
  rows: CellValue[][];        // row-major 2D array
  rowCount: number;
  colCount: number;
}

export interface ExcelEditorFile {
  fileId: string;             // matches excel_files.id in DuckDB
  filename: string;
  sheetCount: number;
  fileSizeBytes: number;
  uploadedAt: string;
}

export type CellFormatting = {
  bold?: boolean;
  italic?: boolean;
  textColor?: string;         // hex string e.g. "#FF0000"
  bgColor?: string;           // hex string
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
  fontSize?: number;          // pt size
  align?: 'left' | 'center' | 'right';
};

export interface CellFormattingMap {
  // key format: "sheetName:rowIndex:colIndex" (0-indexed)
  [cellKey: string]: CellFormatting;
}

export type MutationOperationType =
  | 'value_update'
  | 'formula_injection'
  | 'row_delete'
  | 'value_fill'
  | 'column_add'
  | 'column_delete'
  | 'row_add';

export interface DiffRow {
  rowIndex: number;
  columnName: string;
  oldValue: CellValue;
  newValue: CellValue;
  isFormula: boolean;
}

export interface PendingChange {
  changeId: string;           // uuid generated frontend-side
  promptText: string;         // user's NL prompt that caused this
  operationType: MutationOperationType;
  targetSheet: string;
  affectedRowCount: number;
  diffRows: DiffRow[];        // ALL changed rows, no limit
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt?: string;         // ISO timestamp, set on accept
  generatedCode?: string;     // pandas operation code shown in UI
}

export interface EditorSession {
  fileId: string;
  filename: string;
  activeSheetIndex: number;
  sheets: SheetData[];
  formattingMap: CellFormattingMap;
  changeStack: PendingChange[];   // all changes this session, all statuses
  isDirty: boolean;               // true if formatting changes not yet saved
  frozenRows: number;             // 0 = none
  frozenCols: number;             // 0 = none
}
