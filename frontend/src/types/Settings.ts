export type Theme = "dark" | "light" | "system";

export type LLMProvider = "openai" | "ollama";

export interface OpenAISettings {
  api_key: string;
  model: string;
  max_input_tokens: number;
}

export interface OllamaSettings {
  url: string;
  model: string;
  max_input_tokens: number;
}

export interface Settings {
  theme: Theme;
  llm_provider: LLMProvider;
  openai: OpenAISettings;
  ollama: OllamaSettings;
  username: string;
  created_at: string;
  max_concurrent_uploads: number;
  result_row_limit: number;
  max_input_tokens: number;
  auto_sql_retry: boolean;
  auto_sql_retry_max: number;
  auto_chart_display: boolean;
}

export interface TestLLMRequest {
  provider: LLMProvider;
  api_key?: string;
  url?: string;
}

export interface TestLLMResponse {
  success: boolean;
  provider: LLMProvider;
  latency_ms: number;
  message: string;
  models?: string[];
}

export interface PullModelResponse {
  success: boolean;
  model: string;
}
