export type CellValue = string | number | boolean | null;

export interface SheetData {
  sheetName: string;
  columns?: string[]; // column header names
  rows?: CellValue[][]; // row-major 2D array
  rowCount: number;
  colCount: number;
  formulaCells?: string[];
}

export interface ExcelEditorFile {
  fileId: string; // matches excel_files.id in DuckDB
  filename: string;
  sheetCount: number;
  editable: boolean;
  fileSizeBytes: number;
  uploadedAt: string;
}

export type CellFormatting = {
  bold?: boolean;
  italic?: boolean;
  textColor?: string; // hex string e.g. "#FF0000"
  bgColor?: string; // hex string
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
  fontSize?: number; // pt size
  align?: "left" | "center" | "right";
};

export interface CellFormattingMap {
  // key format: "sheetName:rowIndex:colIndex" (0-indexed)
  [cellKey: string]: CellFormatting;
}

export type MutationOperationType =
  | "value_update"
  | "formula_injection"
  | "row_delete"
  | "value_fill"
  | "column_add"
  | "column_delete"
  | "row_add";

export type MutationExpression =
  | { col: string }
  | { const: CellValue }
  | {
      op: "add" | "sub" | "mul" | "div" | "upper" | "lower" | "strip" | "title" | "replace";
      args: MutationExpression[];
    };

interface MutationFilter {
  column: string;
  op:
    | "eq"
    | "ne"
    | "lt"
    | "lte"
    | "gt"
    | "gte"
    | "contains"
    | "startswith"
    | "endswith"
    | "isnull"
    | "notnull";
  value?: CellValue;
}

export type MutationOperation =
  | {
      type: "value_update" | "value_fill";
      column: string;
      value: MutationExpression;
      filters?: MutationFilter[];
    }
  | { type: "row_delete"; filters?: MutationFilter[] }
  | { type: "row_add"; rows: Record<string, CellValue>[] }
  | { type: "column_add"; column: string; value?: MutationExpression; filters?: MutationFilter[] }
  | { type: "column_delete"; column: string }
  | { type: "formula_injection"; column: string; template: string; filters?: MutationFilter[] };

export interface DiffRow {
  rowIndex: number;
  columnName: string;
  oldValue: CellValue;
  newValue: CellValue;
  isFormula: boolean;
}

export interface PendingChange {
  changeId: string; // uuid generated frontend-side
  promptText: string; // user's NL prompt that caused this
  operationType: MutationOperationType;
  targetSheet: string;
  affectedRowCount: number;
  diffRows: DiffRow[]; // ALL changed rows, no limit
  status: "pending" | "accepted" | "rejected";
  appliedAt?: string; // ISO timestamp, set on accept
  operations: MutationOperation[];
  operationSummary: string;
}

export interface EditorSession {
  fileId: string;
  filename: string;
  activeSheetIndex: number;
  sheets: SheetData[];
  formattingMap: CellFormattingMap;
  changeStack: PendingChange[]; // all changes this session, all statuses
  isDirty: boolean; // true if formatting changes not yet saved
  frozenRows: number; // 0 = none
  frozenCols: number; // 0 = none
}
