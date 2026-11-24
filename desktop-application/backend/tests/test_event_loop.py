"""Verify concurrent HTTP identity and event-loop responsiveness."""

import asyncio
import os
from tempfile import TemporaryDirectory
from time import perf_counter, sleep
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from main import app
from models.data_source_models import get_all
from services.duckdb_service import close_connection, get_connection


class EventLoopTests(IsolatedAsyncioTestCase):
    """Run concurrent requests against separate temporary DuckDB stores."""

    async def asyncSetUp(self):
        root = self.enterContext(TemporaryDirectory())
        self.enterContext(patch.dict(os.environ, SHEETMIND_DATA_DIR=root, SHEETMIND_API_TOKEN=""))
        for user in ("default", "alice", "bob"):
            self.addCleanup(close_connection, user)
        self.client = await self.enterAsyncContext(
            AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost:49152")
        )

    async def test_concurrent_requests_keep_user_context(self):
        """Each worker thread must use the request's own database."""

        async def create_and_list(user):
            headers = {"X-Username": user}
            created = await self.client.post(
                "/api/chat/sessions", json={"title": user}, headers=headers
            )
            created.raise_for_status()
            result = await self.client.get("/api/chat/sessions", headers=headers)
            result.raise_for_status()
            return [row["title"] for row in result.json()]

        first, second = await asyncio.gather(create_and_list("alice"), create_and_list("bob"))
        self.assertEqual((first, second), (["alice"], ["bob"]))

    async def test_health_responds_while_database_work_is_running(self):
        """A request waiting on a slow DB result must leave health responsive."""

        def slow_list():
            with get_connection() as conn:
                conn.execute("SELECT count(*) FROM range(1000)").fetchone()
            sleep(0.40)
            return get_all()

        with patch("routers.data_sources_router.ds_models.get_all", side_effect=slow_list):
            started = perf_counter()
            request = asyncio.create_task(self.client.get("/api/data-sources"))
            try:
                await asyncio.sleep(0.03)
                health = await self.client.get("/api/health")
                self.assertEqual(health.status_code, 200)
                self.assertLess(perf_counter() - started, 0.20)
                self.assertFalse(request.done())
            finally:
                self.assertEqual((await request).status_code, 200)
