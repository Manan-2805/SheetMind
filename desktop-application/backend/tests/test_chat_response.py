"""Regression tests for schema selection and interruptible chat responses."""

import asyncio
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import patch

import duckdb
from starlette.requests import Request

from models.chat_models import _prepare_schema_context, _summarize_query
from routers.chat_router import _until_disconnect
from schemas.chat_schemas import ResultColumn, ResultTable


class ChatSchemaTests(TestCase):
    """Use workbook names from the imported schema when no files were selected."""

    def test_untagged_chat_includes_completed_sheets(self):
        """Give the model registered SQL names for an untagged question."""
        with duckdb.connect() as conn:
            conn.execute(
                "CREATE TABLE excel_files AS SELECT 'generated-id' id, "
                "'Orders.xlsx' original_filename, 'completed' status"
            )
            conn.execute(
                "CREATE TABLE excel_sheets AS SELECT 'generated-id' excel_file_id, "
                "'Orders' sheet_name, 'file_orders' table_name"
            )
            conn.execute("CREATE TABLE file_orders (status VARCHAR)")
            _, schema = _prepare_schema_context(conn, [], "Count orders by status", [])
        self.assertIn("DuckDB Table Name: file_orders", schema)
        self.assertIn("status (VARCHAR)", schema)


class CancelChatTests(IsolatedAsyncioTestCase):
    """Exercise the disconnect used by the chat Stop button."""

    async def test_disconnected_request_cancels_generation(self):
        """Stop the provider coroutine when the client closes its request."""
        started = asyncio.Event()
        cancelled = asyncio.Event()

        async def generate():
            started.set()
            try:
                await asyncio.Future()
            finally:
                cancelled.set()

        async def receive():
            await started.wait()
            return {"type": "http.disconnect"}

        request = Request({"type": "http"}, receive)
        response = await asyncio.wait_for(_until_disconnect(request, generate()), timeout=1)
        self.assertEqual(response.status_code, 499)
        self.assertTrue(cancelled.is_set())

    async def test_small_aggregate_skips_second_provider_call(self):
        """Summarize the two reported query shapes directly from SQL results."""
        for columns, rows, expected in (
            (["shipped_total"], [{"shipped_total": 92.5}], "Shipped total: 92.5"),
            (
                ["status", "order_count"],
                [
                    {"status": "Shipped", "order_count": 6},
                    {"status": "Cancelled", "order_count": 1},
                    {"status": "Pending", "order_count": 1},
                ],
                "Shipped: 6, Cancelled: 1, Pending: 1",
            ),
        ):
            result = ResultTable(
                columns=[ResultColumn(key=column, label=column) for column in columns],
                rows=rows,
                total_rows=len(rows),
                page=1,
                page_size=20,
                total_pages=1,
            )
            with patch("models.chat_models._generate_combined_second_call") as summarize:
                self.assertEqual((await _summarize_query(result, "Aggregate"))["summary"], expected)
                summarize.assert_not_called()
