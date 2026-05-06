export interface SavedQuery {
  id: string;
  label: string;
  nl_query: string;
  sql_query: string;
  created_at: string;
  last_used_at: string;
  use_count: number;
}

export interface CreateSavedQueryRequest {
  label: string;
  nl_query: string;
  sql_query: string;
}
