export interface ArtifactExport {
  id: string;
  filename: string;
  file_path: string;
  file_size_bytes: number;
  created_at: string;
  source_message_id: string;
  source_session_name: string;
  title: string;
}

export interface ArtifactChart {
  id: string;
  chart_type: string;
  title: string;
  created_at: string;
  source_message_id: string;
  source_session_name: string;
  thumbnail_url?: string;
}

export interface ArtifactsResponse {
  excel_exports: ArtifactExport[];
  charts: ArtifactChart[];
}
