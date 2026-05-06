export type Theme = "dark" | "light" | "system";

export type LLMProvider = "openai" | "ollama";

export interface OpenAISettings {
  api_key: string;
  model: string;
}

export interface OllamaSettings {
  url: string;
  model: string;
}

export interface Settings {
  theme: Theme;
  llm_provider: LLMProvider;
  openai: OpenAISettings;
  ollama: OllamaSettings;
  username: string;
  created_at: string;
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
}

export interface PullModelResponse {
  success: boolean;
  model: string;
}
