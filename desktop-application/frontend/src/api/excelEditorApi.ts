import { apiClient as client } from './apiClient';
import type { 
  CellValue, 
  SheetData, 
  ExcelEditorFile, 
  CellFormatting, 
  MutationOperationType,
  DiffRow
} from '@/types/ExcelEditor';

const API_BASE = '/excel-editor';

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
  const resp = await client.get(`${API_BASE}/open`, { params: { fileId } });
  return resp.data;
};

export const getSheetData = async (fileId: string, sheetName: string): Promise<SheetData> => {
  const resp = await client.get(`${API_BASE}/sheet-data`, { params: { fileId, sheetName } });
  return resp.data;
};

export interface MutationResponse {
  operationType: MutationOperationType;
  pandasCode: string;
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
  pandasCode: string;
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
  backupPath: string;
}

export const getHistory = async (fileId: string): Promise<HistoryRecord[]> => {
  const resp = await client.get(`${API_BASE}/history/${fileId}`);
  return resp.data.history;
};

export const restoreBackup = async (fileId: string, backupPath: string): Promise<{ success: boolean }> => {
  const resp = await client.post(`${API_BASE}/restore`, { fileId, backupPath });
  return resp.data;
};
