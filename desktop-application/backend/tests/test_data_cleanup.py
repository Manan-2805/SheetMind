"""Check settings import and removal of desktop-generated files."""

import os
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from main import app
from models.chat_models import delete_session
from models.settings_models import clear_chat_history_db, delete_all_files_db
from services.duckdb_service import close_connection, get_connection
from services.storage_service import (
    get_backups_dir,
    get_charts_dir,
    get_debug_prompts_dir,
    get_uploads_dir,
)


class DesktopCleanupTests(IsolatedAsyncioTestCase):
    """Exercise cleanup and import without accessing user data or an LLM."""

    async def asyncSetUp(self):
        root = self.enterContext(TemporaryDirectory())
        self.enterContext(patch.dict(os.environ, SHEETMIND_DATA_DIR=root, SHEETMIND_API_TOKEN=""))
        self.addCleanup(close_connection, "default")
        self.conn = get_connection()
        self.client = await self.enterAsyncContext(
            AsyncClient(transport=ASGITransport(app=app), base_url="http://127.0.0.1:49152")
        )

    async def test_settings_import_persists_allowed_fields(self):
        """Import settings while discarding imported OpenAI secrets."""
        response = await self.client.post(
            "/api/settings/import",
            files={
                "file": (
                    "settings.json",
                    b'{"theme":"light","openai":{"model":"fixture","api_key":123}}',
                )
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("theme"), "light")
        self.assertEqual(response.json()["openai"]["model"], "fixture")
        self.assertFalse(response.json()["openai"]["api_key_set"])
        self.assertEqual((await self.client.get("/api/settings")).json()["theme"], "light")
        invalid = await self.client.post(
            "/api/settings/import", files={"file": ("settings.json", b'{"result_row_limit":-5}')}
        )
        self.assertEqual(invalid.status_code, 400)

    async def test_delete_all_files_clears_history_and_disk(self):
        """Remove imported tables, uploads, backups, and edit history together."""
        upload = get_uploads_dir() / "fixture.csv"
        backup = get_backups_dir() / "fixture.xlsx"
        upload.write_text("v\n1\n", encoding="utf-8")
        backup.touch()
        self.conn.execute(
            "INSERT INTO excel_files (id, original_filename, stored_path, uploaded_at) "
            "VALUES ('fixture', 'fixture.csv', ?, current_timestamp)",
            [str(upload)],
        )
        self.conn.execute(
            "INSERT INTO edit_history VALUES ('edit', 'fixture', 'Sheet', 'test', 0, "
            "current_timestamp, ?, true)",
            [str(backup)],
        )
        self.conn.execute("CREATE TABLE file_fixture AS SELECT 1 AS v")
        self.assertEqual(delete_all_files_db(), 1)
        self.assertFalse(upload.exists())
        self.assertFalse(backup.exists())
        self.assertEqual(self.conn.execute("SELECT count(*) FROM edit_history").fetchone(), (0,))
        self.assertNotIn(("file_fixture",), self.conn.execute("SHOW TABLES").fetchall())

    def add_chat_chart(self, session_id: str) -> Path:
        """Create a chat session with a referenced chart file."""
        self.conn.execute(
            "INSERT INTO chat_sessions VALUES (?, 'Synthetic', current_timestamp, current_timestamp, false)",
            [session_id],
        )
        chart = get_charts_dir() / f"{session_id}.png"
        chart.touch()
        self.conn.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, created_at, chart_url) "
            "VALUES (?, ?, 'assistant', 'Synthetic', current_timestamp, ?)",
            [session_id, session_id, f"/api/chat/charts/static/{chart.name}"],
        )
        return chart

    async def test_clear_chat_and_delete_session_clean_referenced_charts(self):
        """Delete charts for the selected session, then clear remaining chat assets."""
        chart_a = self.add_chat_chart("session-a")
        chart_b = self.add_chat_chart("session-b")
        debug = get_debug_prompts_dir() / "synthetic.txt"
        debug.touch()
        delete_session("session-a")
        self.assertFalse(chart_a.exists())
        self.assertTrue(chart_b.exists())
        self.assertEqual(clear_chat_history_db(), 1)
        self.assertFalse(chart_b.exists())
        self.assertFalse(debug.exists())
