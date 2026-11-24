"""Module containing settings_schemas functionality."""

from pydantic import BaseModel, Field


class OpenAISettingsSchema(BaseModel):
    """Schema or class representation for OpenAISettingsSchema."""

    api_key: str = ""
    model: str = "gpt-4o"
    max_input_tokens: int = 6000


class PublicOpenAISettings(OpenAISettingsSchema):
    """Public OpenAI settings with a key-presence indicator."""

    api_key: str = Field(default="", exclude=True)
    api_key_set: bool = False


class OllamaSettingsSchema(BaseModel):
    """Schema or class representation for OllamaSettingsSchema."""

    url: str = "http://localhost:11434"
    model: str = ""
    max_input_tokens: int = 3000


class SettingsResponse(BaseModel):
    """Schema or class representation for SettingsResponse."""

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


class PublicSettingsResponse(SettingsResponse):
    """Settings response that serializes OpenAI configuration without its key."""

    openai: PublicOpenAISettings = PublicOpenAISettings()

    @classmethod
    def from_stored(cls, settings: SettingsResponse) -> "PublicSettingsResponse":
        """Construct public settings without copying the stored secret."""
        data = settings.model_dump(exclude={"openai": {"api_key"}})
        data["openai"]["api_key_set"] = bool(settings.openai.api_key)
        return cls.model_validate(data)


class UpdateSettingsRequest(BaseModel):
    """Schema or class representation for UpdateSettingsRequest."""

    theme: str | None = None
    llm_provider: str | None = None
    openai: OpenAISettingsSchema | None = None
    ollama: OllamaSettingsSchema | None = None
    result_row_limit: int | None = None
    auto_sql_retry: bool | None = None
    auto_sql_retry_max: int | None = None
    auto_chart_display: bool | None = None


class TestLLMRequest(BaseModel):
    """Schema or class representation for TestLLMRequest."""

    provider: str
    api_key: str | None = None
    url: str | None = None


class PullModelRequest(BaseModel):
    """Schema or class representation for PullModelRequest."""

    model_name: str
