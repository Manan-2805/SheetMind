import { isAxiosError } from "axios";
import type {
  CellFormatting,
  CellValue,
  DiffRow,
  ExcelEditorFile,
  MutationOperation,
  MutationOperationType,
  SheetData,
} from "@/types/ExcelEditor";
import { apiClient as client } from "./apiClient";

const API_BASE = "/excel-editor";

export const getAvailableFiles = async (): Promise<ExcelEditorFile[]> => {
  const resp = await client.get(`${API_BASE}/files`);
  return resp.data.files;
};

export interface OpenFileResponse {
  fileId: string;
  filename: string;
  sheets: SheetData[];
  formattingMap?: Record<string, CellFormatting>;
}

export const openFile = async (fileId: string): Promise<OpenFileResponse> => {
  const resp = await client.get(`${API_BASE}/open`, { params: { file_id: fileId } });
  return resp.data;
};

export const downloadWorkbook = async (fileId: string, filename: string): Promise<void> => {
  const response = await client.get<Blob>(`${API_BASE}/download`, {
    params: { file_id: fileId },
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const getSheetData = async (fileId: string, sheetName: string): Promise<SheetData> => {
  const resp = await client.get(`${API_BASE}/sheet-data`, {
    params: { file_id: fileId, sheet_name: sheetName },
  });
  return resp.data;
};

export interface MutationResponse {
  operationType: MutationOperationType;
  operations: MutationOperation[];
  operationSummary: string;
  confidence: number;
  diffRows: DiffRow[];
  affectedRowCount: number;
  followupSuggestions: string[];
}

export const mutateFile = async (params: {
  fileId: string;
  sheetName: string;
  userInstruction: string;
  currentRows: CellValue[][];
  columns: string[];
}): Promise<MutationResponse> => {
  const resp = await client.post(`${API_BASE}/mutate`, params);
  return resp.data;
};

export const applyMutation = async (params: {
  fileId: string;
  sheetName: string;
  operations: MutationOperation[];
  currentRows: CellValue[][];
  columns: string[];
}): Promise<{ success: boolean }> => {
  const resp = await client.post(`${API_BASE}/apply`, params);
  return resp.data;
};

export const saveEdits = async (params: {
  fileId: string;
  sheets: SheetData[];
  formattingMap: Record<string, CellFormatting>;
}): Promise<{ success: boolean }> => {
  const resp = await client.post(`${API_BASE}/save`, params);
  return resp.data;
};

export interface HistoryRecord {
  id: string;
  sheetName: string;
  operationType: string;
  rowsAffected: number;
  appliedAt: string;
}

export const getHistory = async (fileId: string): Promise<HistoryRecord[]> => {
  const resp = await client.get(`${API_BASE}/history/${fileId}`);
  return resp.data.history;
};

export const restoreBackup = async (
  fileId: string,
  historyId: string
): Promise<{ success: boolean }> => {
  const resp = await client.post(`${API_BASE}/restore`, { fileId, historyId });
  return resp.data;
};

export function describeEditorError(error: unknown, fallback: string): string {
  if (isAxiosError(error) && typeof error.response?.data?.detail === "string") {
    return error.response.data.detail;
  }
  return error instanceof Error && !isAxiosError(error) ? error.message : fallback;
}
