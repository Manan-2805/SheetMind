"""Share provider connection pools across desktop LLM calls."""

import asyncio

from httpx import AsyncClient
from openai import AsyncOpenAI

from services.logging_service import get_logger


class LLMClients:
    """Own and close the API clients for a desktop backend process."""

    def __init__(self):
        self._openai: dict[str, AsyncOpenAI] = {}
        self._ollama: AsyncClient | None = None

    def openai(self, api_key: str) -> AsyncOpenAI:
        """Return the retrying OpenAI client for these credentials."""
        if api_key not in self._openai:
            self._openai[api_key] = AsyncOpenAI(api_key=api_key, timeout=60.0, max_retries=2)
        return self._openai[api_key]

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
