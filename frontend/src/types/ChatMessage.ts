export type MessageRole = "user" | "assistant";

export interface ResultColumn {
  key: string;
  label: string;
}

export interface ResultTable {
  columns: ResultColumn[];
  rows: Record<string, unknown>[];
  total_rows: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  sql_generated?: string;
  sql_execution_ms?: number;
  llm_generation_ms?: number;
  token_count_input?: number;
  token_count_output?: number;
  confidence_score?: number;
  result_row_count?: number;
  result_data?: ResultTable;
  nl_summary?: string;
  referenced_files?: string[];
  is_typing?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  message_count?: number;
}
