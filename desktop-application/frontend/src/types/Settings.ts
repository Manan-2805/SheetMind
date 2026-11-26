export type Theme = "dark" | "light" | "system";

export type LLMProvider = "openai" | "ollama";

export interface OpenAISettings {
  api_key_set: boolean;
  base_url: string;
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
  result_row_limit: number;
  max_input_tokens: number;
  auto_sql_retry: boolean;
  auto_sql_retry_max: number;
  auto_chart_display: boolean;
}

export type SettingsUpdate = Omit<Partial<Settings>, "openai"> & {
  openai?: Omit<OpenAISettings, "api_key_set"> & { api_key?: string };
};

export interface TestLLMRequest {
  provider: LLMProvider;
  api_key?: string;
  url?: string;
  model?: string;
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
