"""Check local API access and settings privacy with isolated user data."""

import os
import secrets
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from main import app
from services.duckdb_service import close_connection
from services.storage_service import get_app_root


class LocalApiTests(IsolatedAsyncioTestCase):
    """Exercise FastAPI through its ASGI interface."""

    async def asyncSetUp(self):
        data = TemporaryDirectory()
        self.addCleanup(data.cleanup)
        self.enterContext(patch.object(Path, "home", return_value=Path(data.name)))
        self.token = secrets.token_hex(32)
        self.enterContext(
            patch.dict(
                os.environ,
                SHEETMIND_DATA_DIR=data.name,
                SHEETMIND_API_TOKEN=self.token,
                SHEETMIND_ENV="production",
                NODE_ENV="production",
            )
        )
        self.headers = {"X-SheetMind-Token": self.token}
        self.client = await self.enterAsyncContext(
            AsyncClient(transport=ASGITransport(app=app), base_url="http://127.0.0.1:49152")
        )
        self.addCleanup(self.close_test_connections)

    def close_test_connections(self):
        """Close only connections opened under this test's temporary root."""
        for username in ("default", "ab"):
            close_connection(username)

    async def test_data_root_override(self):
        """Use the configured directory for all persistent data."""
        self.assertEqual(get_app_root(), Path(os.environ["SHEETMIND_DATA_DIR"]))

    async def test_missing_and_wrong_token(self):
        """Require the current launch's token for local API calls."""
        self.assertEqual((await self.client.get("/api/settings")).status_code, 401)
        result = await self.client.get(
            "/api/settings", headers={"X-SheetMind-Token": secrets.token_hex(32)}
        )
        self.assertEqual(result.status_code, 401)
        self.assertEqual((await self.client.get("/api/health")).status_code, 200)

    async def test_cors_and_preflight(self):
        """Only permit development origins and authenticated file renderers."""
        result = await self.client.get("/api/health", headers={"Origin": "https://invalid.example"})
        self.assertNotIn("access-control-allow-origin", result.headers)
        result = await self.client.options(
            "/api/settings",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "X-SheetMind-Token",
            },
        )
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.headers["access-control-allow-origin"], "http://localhost:5173")
        result = await self.client.get("/api/settings", headers={**self.headers, "Origin": "null"})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.headers["access-control-allow-origin"], "null")
        with patch.dict(os.environ, SHEETMIND_API_TOKEN=""):
            result = await self.client.get("/api/health", headers={"Origin": "null"})
        self.assertNotIn("access-control-allow-origin", result.headers)

    async def test_bad_host(self):
        """Reject a foreign host and a loopback address for the wrong port."""
        for host in ("invalid.example:49152", "127.0.0.1:49153", "localhost"):
            result = await self.client.get("/api/health", headers={"Host": host})
            self.assertEqual(result.status_code, 400)
        result = await self.client.get("/api/health", headers={"Host": "localhost:49152"})
        self.assertEqual(result.status_code, 200)

    async def test_username_collision_is_rejected(self):
        """Reject input that would be rewritten to an existing account."""
        for username in ("a b", " ab", "a" * 33, ""):
            result = await self.client.post(
                "/api/auth/setup", json={"username": username}, headers=self.headers
            )
            self.assertEqual(result.status_code, 400)
        result = await self.client.get(
            "/api/settings", headers={**self.headers, "X-Username": "a b"}
        )
        self.assertEqual(result.status_code, 400)
        result = await self.client.delete("/api/auth/users/a%20b", headers=self.headers)
        self.assertEqual(result.status_code, 400)
        result = await self.client.post(
            "/api/auth/setup", json={"username": "ab"}, headers=self.headers
        )
        self.assertEqual(result.status_code, 200)

    async def test_settings_keep_and_hide_key(self):
        """Response bodies hide secrets and blank updates preserve them."""
        value = secrets.token_hex(12)
        result = await self.client.put(
            "/api/settings", headers=self.headers, json={"openai": {"api_key": value}}
        )
        self.assertEqual(result.status_code, 200)
        self.assertFalse("api_key" in result.json()["openai"])
        self.assertIs(result.json()["openai"]["api_key_set"], True)
        for update in ({"model": "fake"}, {"api_key": ""}):
            result = await self.client.put(
                "/api/settings", headers=self.headers, json={"openai": update}
            )
            self.assertEqual(result.status_code, 200)
            self.assertIs(result.json()["openai"]["api_key_set"], True)
        result = await self.client.get("/api/settings", headers=self.headers)
        self.assertFalse("api_key" in result.json()["openai"])
        self.assertIs(result.json()["openai"]["api_key_set"], True)
        result = await self.client.get("/api/settings/export", headers=self.headers)
        self.assertEqual(result.json()["openai"]["api_key"], "")
