from typing import Optional

from pydantic import BaseModel


class OpenAISettingsSchema(BaseModel):
    api_key: str = ""
    model: str = "gpt-4o"


class OllamaSettingsSchema(BaseModel):
    url: str = "http://localhost:11434"
    model: str = ""


class SettingsResponse(BaseModel):
    theme: str = "dark"
    llm_provider: str = "openai"
    openai: OpenAISettingsSchema = OpenAISettingsSchema()
    ollama: OllamaSettingsSchema = OllamaSettingsSchema()
    username: str = ""
    created_at: str = ""
    max_concurrent_uploads: int = 1


class UpdateSettingsRequest(BaseModel):
    theme: Optional[str] = None
    llm_provider: Optional[str] = None
    openai: Optional[OpenAISettingsSchema] = None
    ollama: Optional[OllamaSettingsSchema] = None
    max_concurrent_uploads: Optional[int] = None


class TestLLMRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    url: Optional[str] = None


class PullModelRequest(BaseModel):
    model_name: str
