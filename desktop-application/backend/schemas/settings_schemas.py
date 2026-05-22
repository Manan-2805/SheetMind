from typing import Optional

from pydantic import BaseModel


class OpenAISettingsSchema(BaseModel):
    api_key: str = ""
    model: str = "gpt-4o"
    max_input_tokens: int = 6000


class OllamaSettingsSchema(BaseModel):
    url: str = "http://localhost:11434"
    model: str = ""
    max_input_tokens: int = 3000


class SettingsResponse(BaseModel):
    theme: str = "dark"
    llm_provider: str = "openai"
    openai: OpenAISettingsSchema = OpenAISettingsSchema()
    ollama: OllamaSettingsSchema = OllamaSettingsSchema()
    username: str = ""
    created_at: str = ""
    result_row_limit: int = 500
    auto_sql_retry: bool = True
    auto_sql_retry_max: int = 3
    auto_chart_display: bool = False


class UpdateSettingsRequest(BaseModel):
    theme: Optional[str] = None
    llm_provider: Optional[str] = None
    openai: Optional[OpenAISettingsSchema] = None
    ollama: Optional[OllamaSettingsSchema] = None
    result_row_limit: Optional[int] = None
    auto_sql_retry: Optional[bool] = None
    auto_sql_retry_max: Optional[int] = None
    auto_chart_display: Optional[bool] = None


class TestLLMRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    url: Optional[str] = None


class PullModelRequest(BaseModel):
    model_name: str
