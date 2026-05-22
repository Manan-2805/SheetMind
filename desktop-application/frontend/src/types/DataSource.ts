export interface ExcelSheet {
  id: string;
  sheet_name: string;
  table_name: string;
  row_count: number;
  col_count: number;
  imported_at: string;
}

export interface DataSource {
  id: string;
  original_filename: string;
  stored_path: string;
  uploaded_at: string;
  num_sheets: number;
  file_size_bytes: number;
  sheets: ExcelSheet[];
  status: string;
}

export interface DataSourcePreview {
  columns: string[];
  rows: unknown[][];
}

export interface AutocompleteFile {
  filename: string;
  sheets: string[];
}

export interface AutocompleteResponse {
  files: AutocompleteFile[];
}
