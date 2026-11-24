"""Exercise the desktop audit workflow with a fake Ollama app."""

import asyncio
import os
from io import BytesIO
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from audit_fake_ollama import app as fake_ollama
from httpx import ASGITransport, AsyncClient
from openpyxl import Workbook

from main import app, lifespan
from services.duckdb_service import close_connection


class AuditFlowTests(IsolatedAsyncioTestCase):
    """Check the API's main upload, chat, and editing workflow."""

    async def test_fake_ollama_upload_query_preview_apply_restore(self):
        """Use real stored data, paged chat SQL, and two independent user stores."""
        directory = self.enterContext(TemporaryDirectory())
        self.enterContext(
            patch.dict(os.environ, SHEETMIND_DATA_DIR=directory, SHEETMIND_API_TOKEN="")
        )
        for user in ("alice", "bob"):
            self.addCleanup(close_connection, user)

        workbook = Workbook()
        workbook.active.append(["label", "amount"])
        for value in range(1, 7):
            workbook.active.append([f"row{value}", value])
        contents = BytesIO()
        workbook.save(contents)

        async with (
            AsyncClient(transport=ASGITransport(app=fake_ollama)) as provider,
            AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost:49152") as api,
            lifespan(app),
        ):
            with patch("services.llm_client.llm_clients.ollama", return_value=provider):
                await self.exercise_workbook(api, contents.getvalue())

    async def exercise_workbook(self, client: AsyncClient, contents: bytes) -> None:
        """Drive the workflow inside the temporary app lifespan."""
        client.headers["X-Username"] = "alice"
        settings = await client.put(
            "/api/settings",
            json={
                "llm_provider": "ollama",
                "ollama": {"url": "http://127.0.0.1:11435", "model": "audit-fake"},
                "result_row_limit": 2,
            },
        )
        settings.raise_for_status()
        uploaded = await client.post(
            "/api/data-sources/upload", files={"file": ("audit.xlsx", contents)}
        )
        uploaded.raise_for_status()
        file_id = uploaded.json()["id"]

        async with asyncio.timeout(8):
            while True:
                rows = (await client.get("/api/data-sources")).json()
                file = next(item for item in rows if item["id"] == file_id)
                if file["status"] != "pending" and file["status"] != "processing":
                    self.assertEqual(file["status"], "completed", file["error_message"])
                    break
                await asyncio.sleep(0.02)

        session = (await client.post("/api/chat/sessions", json={"title": "Audit"})).json()
        message = (
            await client.post(
                f"/api/chat/sessions/{session['id']}/messages",
                json={"content": "Show the amounts", "referenced_files": ["audit.xlsx"]},
            )
        ).json()
        self.assertEqual(message["result_data"]["total_rows"], 6)
        data = (
            await client.get(f"/api/chat/messages/{message['id']}/data", params={"page": 2})
        ).json()
        self.assertEqual([row["amount"] for row in data["rows"]], [3, 4])

        async def open_workbook():
            response = await client.get("/api/excel-editor/open", params={"file_id": file_id})
            response.raise_for_status()
            return response.json()["sheets"][0]

        sheet = await open_workbook()
        params = {
            "fileId": file_id,
            "sheetName": sheet["sheetName"],
            "columns": sheet["columns"],
            "currentRows": sheet["rows"],
        }
        preview = (
            await client.post(
                "/api/excel-editor/mutate",
                json={**params, "userInstruction": "Add 10 to the amounts"},
            )
        ).json()
        self.assertEqual(preview["affectedRowCount"], 6)
        applied = await client.post(
            "/api/excel-editor/apply", json={**params, "operations": preview["operations"]}
        )
        applied.raise_for_status()
        self.assertEqual((await open_workbook())["rows"][0][1], 11)

        history = (await client.get(f"/api/excel-editor/history/{file_id}")).json()["history"]
        restored = await client.post(
            "/api/excel-editor/restore", json={"fileId": file_id, "historyId": history[0]["id"]}
        )
        restored.raise_for_status()
        self.assertEqual((await open_workbook())["rows"][0][1], 1)
        self.assertEqual(
            (await client.get("/api/data-sources", headers={"X-Username": "bob"})).json(), []
        )
