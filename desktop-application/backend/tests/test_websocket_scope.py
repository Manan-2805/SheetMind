"""Exercise datasource and chat WebSocket scoping with two isolated users."""

import os
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

from dependencies import current_username
from models.chat_models import _broadcast_ws_event, _ws_clients, broadcast_datasource_status
from services.duckdb_service import close_connection, get_connection


class WebSocketScopeTests(IsolatedAsyncioTestCase):
    """Capture each user's WebSocket messages."""

    async def test_two_users_receive_only_their_own_events(self):
        """Never send socket notifications or datasource metadata across users."""
        root = self.enterContext(TemporaryDirectory())
        self.enterContext(patch.dict(os.environ, SHEETMIND_DATA_DIR=root))
        self.addCleanup(_ws_clients.clear)
        first, second = AsyncMock(), AsyncMock()
        if isinstance(_ws_clients, dict):
            _ws_clients.update(alice={first}, bob={second})
        else:
            _ws_clients.update({first, second})

        for username, socket, other in (("alice", first, second), ("bob", second, first)):
            self.addCleanup(close_connection, username)
            socket.reset_mock()
            other.reset_mock()
            context = current_username.set(username)
            try:
                with get_connection() as conn:
                    conn.execute(
                        "INSERT INTO excel_files (id, original_filename, stored_path, uploaded_at) "
                        "VALUES (?, 'fixture.csv', 'synthetic', current_timestamp)",
                        [username],
                    )
                await broadcast_datasource_status()
                await _broadcast_ws_event(username, {"type": "chat_status", "status": "complete"})
            finally:
                current_username.reset(context)
            self.assertEqual(socket.send_json.await_count, 2)
            self.assertEqual(socket.send_json.await_args_list[0].args[0]["data"][0]["id"], username)
            self.assertEqual(socket.send_json.await_args_list[1].args[0]["session_id"], username)
            other.send_json.assert_not_awaited()
