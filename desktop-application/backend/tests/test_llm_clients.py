"""Verify provider client reuse and shutdown without calling a provider."""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, Mock, patch

from services.llm_client import LLMClients


class LLMClientTests(IsolatedAsyncioTestCase):
    """Exercise the shared client registry with fake SDK objects."""

    async def test_clients_are_reused_by_provider_and_closed(self):
        """Reuse one client per OpenAI key and a single Ollama pool."""
        clients = LLMClients()
        primary = Mock(close=AsyncMock())
        secondary = Mock(close=AsyncMock())
        http = Mock(aclose=AsyncMock())
        with (
            patch("services.llm_client.AsyncOpenAI", side_effect=[primary, secondary]) as openai,
            patch("services.llm_client.AsyncClient", return_value=http) as ollama,
        ):
            self.assertIs(clients.openai("synthetic-alpha"), primary)
            self.assertIs(clients.openai("synthetic-alpha"), primary)
            self.assertIs(clients.openai("synthetic-beta"), secondary)
            self.assertEqual(openai.call_count, 2)
            for call in openai.call_args_list:
                self.assertEqual(call.kwargs["timeout"], 60.0)
                self.assertEqual(call.kwargs["max_retries"], 2)
            self.assertIs(clients.ollama(), http)
            self.assertIs(clients.ollama(), http)
            self.assertEqual(ollama.call_count, 1)
            await clients.close()
        primary.close.assert_awaited_once()
        secondary.close.assert_awaited_once()
        http.aclose.assert_awaited_once()
