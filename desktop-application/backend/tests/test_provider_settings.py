"""Exercise OpenAI-compatible settings without calling a real provider."""

import json
import os
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient, MockTransport, Response

from main import app
from schemas.settings_schemas import OpenAISettingsSchema
from services.duckdb_service import close_connection
from services.llm_client import llm_clients
from services.llm_service import _call_llm_json


class ProviderSettingsTests(IsolatedAsyncioTestCase):
    """Verify draft settings and portable chat completions against a fake provider."""

    async def asyncSetUp(self):
        root = self.enterContext(TemporaryDirectory())
        self.enterContext(patch.dict(os.environ, SHEETMIND_DATA_DIR=root, SHEETMIND_API_TOKEN=""))
        self.addCleanup(close_connection, "default")
        self.addAsyncCleanup(llm_clients.close)
        self.client = await self.enterAsyncContext(
            AsyncClient(transport=ASGITransport(app=app), base_url="http://127.0.0.1:49152")
        )

    async def test_validates_custom_model_using_chat_completion(self):
        """A compatible service can omit model discovery and support non-GPT IDs."""
        self.enterContext(patch("services.llm_client.DefaultAsyncHttpxClient")).side_effect = (
            lambda **kwargs: AsyncClient(transport=MockTransport(self.provider_response), **kwargs)
        )
        result = await self.client.post(
            "/api/settings/test-llm",
            json={
                "provider": "openai",
                "url": "https://compatible.example/v1/",
                "model": "kimi-k2.6",
                "api_key": "fake-provider-key",
            },
        )
        self.assertEqual(result.status_code, 200)
        self.assertTrue(result.json()["success"], result.json())
        self.assertEqual(result.json()["models"], ["kimi-k2.6"])
        self.assertEqual(
            (await self.client.get("/api/settings")).json()["openai"]["model"], "gpt-4o"
        )

    def provider_response(self, request):
        """Accept only the portable request shape and the expected URL."""
        if request.url.path.endswith("/models"):
            return Response(404, json={"error": "No model listing"})
        self.assertEqual(str(request.url), "https://compatible.example/v1/chat/completions")
        self.assertEqual(request.headers["Authorization"], "Bearer fake-provider-key")
        body = json.loads(request.content)
        self.assertEqual(set(body), {"messages", "model"})
        self.assertEqual(body["model"], "kimi-k2.6")
        return Response(200, json={"choices": [{"message": {"content": "OK"}}]})

    async def test_new_endpoint_never_reuses_old_key(self):
        """Require a fresh key for a new endpoint on test, save, or import."""
        await self.client.put("/api/settings", json={"openai": {"api_key": "old-fake-key"}})
        with patch("routers.settings_router.llm_clients.openai") as create:
            response = await self.client.post(
                "/api/settings/test-llm",
                json={
                    "provider": "openai",
                    "url": "https://compatible.example/v1",
                    "model": "fake",
                },
            )
        self.assertFalse(response.json()["success"])
        create.assert_not_called()
        response = await self.client.put(
            "/api/settings", json={"openai": {"base_url": "https://compatible.example/v1/"}}
        )
        self.assertEqual(response.json()["openai"]["base_url"], "https://compatible.example/v1")
        self.assertFalse(response.json()["openai"]["api_key_set"])

    async def test_provider_error_and_redirect_are_safe(self):
        """Reject redirects and redact an upstream error that echoes credentials."""
        for status in (302, 401):
            with self.subTest(status=status):
                requested = []

                def reject(request, *, requested=requested, status=status):
                    requested.append(request.url.host)
                    return Response(
                        status,
                        headers={"location": "https://unexpected.example/chat/completions"},
                        json={"error": "refused fake-provider-key"},
                    )

                with patch(
                    "services.llm_client.DefaultAsyncHttpxClient",
                    side_effect=lambda **kwargs: AsyncClient(
                        transport=MockTransport(reject), **kwargs
                    ),
                ):
                    result = await self.client.post(
                        "/api/settings/test-llm",
                        json={
                            "provider": "openai",
                            "url": f"https://compatible.example/{status}",
                            "model": "kimi-k2.6",
                            "api_key": "fake-provider-key",
                        },
                    )
                self.assertFalse(result.json()["success"])
                self.assertEqual(requested, ["compatible.example"])
                self.assertNotIn("fake-provider-key", result.text)

    async def test_dashboard_uses_saved_compatible_endpoint(self):
        """Use the same endpoint and model in a feature that expects JSON."""
        saved = await self.client.put(
            "/api/settings",
            json={
                "openai": {
                    "base_url": "https://compatible.example/v1/",
                    "model": "kimi-k2.6",
                    "api_key": "fake-provider-key",
                }
            },
        )
        self.assertEqual(saved.status_code, 200)
        self.assertNotIn("fake-provider-key", saved.text)

        def respond(request):
            self.provider_response(request)
            return Response(
                200, json={"choices": [{"message": {"content": '```json\n{"title":"Sales"}\n```'}}]}
            )

        config = OpenAISettingsSchema(**saved.json()["openai"], api_key="fake-provider-key")
        with patch(
            "services.llm_client.DefaultAsyncHttpxClient",
            side_effect=lambda **kwargs: AsyncClient(transport=MockTransport(respond), **kwargs),
        ):
            result = await _call_llm_json(
                type("Settings", (), {"llm_provider": "openai", "openai": config})(),
                [{"role": "user", "content": "Write a title as JSON."}],
            )
        self.assertEqual(result, {"title": "Sales"})
