"""Module containing settings_schemas functionality."""

from ipaddress import ip_address
from typing import Annotated, Literal
from urllib.parse import urlsplit

from pydantic import AfterValidator, BaseModel, Field

OPENAI_BASE_URL = "https://api.openai.com/v1"


def normalize_provider_url(value: str) -> str:
    """Accept HTTPS API roots and HTTP loopback endpoints for local servers."""
    value = value.strip().rstrip("/")
    parts = urlsplit(value)
    host = parts.hostname
    if not host or parts.username is not None or parts.password is not None or parts.port == 0:
        raise ValueError("Enter the API base URL without credentials or an invalid port.")
    if (
        "?" in value
        or "#" in value
        or any(char.isspace() or char == "\\" for char in value)
        or parts.path.lower().endswith(("/chat/completions", "/models"))
    ):
        raise ValueError("Enter the API base URL without credentials or an endpoint suffix.")
    if parts.scheme == "https":
        return value
    if parts.scheme == "http":
        try:
            if ip_address(host).is_loopback:
                return value
        except ValueError:
            if host == "localhost":
                return value
    raise ValueError("Use HTTPS for a remote provider or HTTP on loopback.")


ProviderURL = Annotated[str, AfterValidator(normalize_provider_url)]


class OpenAISettingsSchema(BaseModel):
    """Schema or class representation for OpenAISettingsSchema."""

    api_key: str = ""
    base_url: ProviderURL = OPENAI_BASE_URL
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


class OpenAISettingsUpdate(BaseModel):
    """Fields that may change on an OpenAI settings update."""

    api_key: str | None = None
    base_url: ProviderURL | None = None
    model: str | None = None
    max_input_tokens: int | None = Field(default=None, ge=1)


class OllamaSettingsUpdate(BaseModel):
    """Fields that may change on an Ollama settings update."""

    url: str | None = None
    model: str | None = None
    max_input_tokens: int | None = Field(default=None, ge=1)


class UpdateSettingsRequest(BaseModel):
    """Apply only the editable fields supplied by the client."""

    theme: Literal["dark", "light", "system"] | None = None
    llm_provider: Literal["openai", "ollama"] | None = None
    openai: OpenAISettingsUpdate | None = None
    ollama: OllamaSettingsUpdate | None = None
    result_row_limit: int | None = Field(default=None, ge=1)
    auto_sql_retry: bool | None = None
    auto_sql_retry_max: int | None = Field(default=None, ge=0)
    auto_chart_display: bool | None = None


class TestLLMRequest(BaseModel):
    """Schema or class representation for TestLLMRequest."""

    provider: Literal["openai", "ollama"]
    api_key: str | None = None
    url: str | None = None
    model: str | None = None


class PullModelRequest(BaseModel):
    """Schema or class representation for PullModelRequest."""

    model_name: str
