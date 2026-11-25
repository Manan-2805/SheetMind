"""Share provider connection pools across desktop LLM calls."""

import asyncio
from collections.abc import Iterable
from typing import cast

from httpx import AsyncClient
from openai import (
    APIConnectionError,
    APIStatusError,
    AsyncOpenAI,
    DefaultAsyncHttpxClient,
    OpenAIError,
)
from openai.types.chat import ChatCompletion, ChatCompletionMessageParam

from schemas.settings_schemas import OPENAI_BASE_URL, OpenAISettingsSchema
from services.logging_service import get_logger


class LLMClients:
    """Own and close the API clients for a desktop backend process."""

    def __init__(self):
        self._openai: dict[tuple[str, str], AsyncOpenAI] = {}
        self._ollama: AsyncClient | None = None

    def openai(self, api_key: str, base_url: str = OPENAI_BASE_URL) -> AsyncOpenAI:
        """Pair each credential with its API root and refuse redirects."""
        key = (base_url, api_key)
        if key not in self._openai:
            self._openai[key] = AsyncOpenAI(
                api_key=api_key,
                base_url=base_url,
                timeout=60.0,
                max_retries=2,
                http_client=DefaultAsyncHttpxClient(follow_redirects=False),
            )
        return self._openai[key]

    def ollama(self) -> AsyncClient:
        """Return the shared async HTTP pool for Ollama endpoints."""
        if self._ollama is None:
            self._ollama = AsyncClient()
        return self._ollama

    async def close(self) -> None:
        """Close the provider connections and clear the registry."""
        tasks = [client.close() for client in self._openai.values()]
        self._openai.clear()
        if self._ollama is not None:
            tasks.append(self._ollama.aclose())
            self._ollama = None
        for result in await asyncio.gather(*tasks, return_exceptions=True):
            if isinstance(result, BaseException):
                get_logger().warning("Could not close an LLM connection: %s", type(result).__name__)


llm_clients = LLMClients()


def provider_error_message(error: Exception) -> str:
    """Describe provider errors without exposing response payloads or credentials."""
    if isinstance(error, APIConnectionError):
        return "Could not reach the provider. Check the API base URL and network."
    if isinstance(error, APIStatusError):
        if error.status_code in (401, 403):
            return "The provider rejected the key or the model permissions."
        if error.status_code in (400, 422):
            return "The provider rejected the chat request. Check the model ID."
        messages = {
            404: "The API base URL or model ID was not found.",
            429: "The provider rate limit or quota was reached.",
        }
        return messages.get(error.status_code, f"The provider returned HTTP {error.status_code}.")
    return "The provider did not return a usable chat completion."


def unwrap_json_fence(content: str | None) -> str:
    """Accept plain JSON or a single JSON Markdown code block."""
    text = (content or "").strip()
    lines = text.splitlines()
    if len(lines) >= 3 and lines[0].lower() in {"```", "```json"} and lines[-1] == "```":
        return "\n".join(lines[1:-1])
    return text


async def complete_openai(
    settings: OpenAISettingsSchema,
    messages: list[dict[str, str]],
    *,
    temperature: float = 0,
    max_tokens: int | None = None,
    json_object: bool = False,
    use_mini: bool = False,
    test_connection: bool = False,
) -> ChatCompletion:
    """Use basic Chat Completions for compatible hosts and test requests."""
    if not settings.api_key:
        raise ValueError("Enter an API key for the selected provider.")
    client = llm_clients.openai(settings.api_key, settings.base_url)
    model = settings.model
    options = {}
    if test_connection:
        client = client.with_options(timeout=25.0, max_retries=0)
    elif settings.base_url == OPENAI_BASE_URL:
        if use_mini and model == "gpt-4o":
            model = "gpt-4o-mini"
        if model in {"gpt-4o", "gpt-4o-mini", "gpt-4-turbo"}:
            options = {"temperature": temperature}
            if max_tokens is not None:
                options["max_tokens"] = max_tokens
            if json_object:
                options["response_format"] = {"type": "json_object"}
    try:
        return await client.chat.completions.create(
            model=model, messages=cast(Iterable[ChatCompletionMessageParam], messages), **options
        )
    except OpenAIError as error:
        if test_connection:
            raise
        raise RuntimeError(provider_error_message(error)) from None
