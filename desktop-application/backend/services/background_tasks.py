"""Module containing background_tasks functionality."""

import asyncio
import os
import uuid
from collections.abc import Iterator
from pathlib import Path

import duckdb
import pandas as pd

from dependencies import current_username
from models.chat_models import broadcast_datasource_status
from services.duckdb_service import get_connection
from services.excel_import_service import (
    import_df_to_duckdb,
    read_csv_frame,
    read_excel_frame,
    safe_table_name,
)
from services.excel_import_service import (
    now_utc as _now,
)
from services.logging_service import get_logger
from services.storage_service import list_account_users

# The queue stores tuples of (username, file_id, file_path)
task_queue = asyncio.Queue()
active_tasks = set()


def _import_sheets(
    conn: duckdb.DuckDBPyConnection,
    file_id: str,
    sheets: Iterator[tuple[str, pd.DataFrame]],
    csv_file: bool,
) -> tuple[int, int, int]:
    table_names: set[str] = set()
    total_rows = 0
    max_cols = 0
    for name, frame in sheets:
        base = safe_table_name(file_id, None if csv_file else name)
        table_name = base
        suffix = 2
        while table_name in table_names:
            table_name = f"{base}_{suffix}"
            suffix += 1
        try:
            import_df_to_duckdb(conn, frame, table_name)
            conn.execute(
                "INSERT INTO excel_sheets "
                "(id, excel_file_id, sheet_name, table_name, row_count, col_count, imported_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    f"sh-{uuid.uuid4().hex[:8]}",
                    file_id,
                    name,
                    table_name,
                    len(frame),
                    len(frame.columns),
                    _now(),
                ],
            )
        except Exception as exc:
            raise ValueError(f"Failed to import sheet {name!r}: {exc}") from exc
        table_names.add(table_name)
        total_rows += len(frame)
        max_cols = max(max_cols, len(frame.columns))
    if not table_names:
        raise ValueError("No sheets found to import")
    return total_rows, max_cols, len(table_names)


def _read_workbook(workbook: pd.ExcelFile) -> Iterator[tuple[str, pd.DataFrame]]:
    for name in workbook.sheet_names:
        try:
            yield name, read_excel_frame(workbook, name)
        except Exception as exc:
            raise ValueError(f"Failed to read sheet {name!r}: {exc}") from exc


def process_excel_file_sync(username: str, file_id: str, file_path: str):
    """Import every sheet transactionally, marking a failed workbook with its error."""
    token = current_username.set(username)
    path = Path(file_path)
    try:
        with get_connection() as conn:
            conn.execute("UPDATE excel_files SET status = 'processing' WHERE id = ?", [file_id])
            conn.begin()
            try:
                conn.execute("DELETE FROM excel_sheets WHERE excel_file_id = ?", [file_id])
                if path.suffix.lower() == ".csv":
                    counts = _import_sheets(
                        conn, file_id, iter([("Sheet1", read_csv_frame(path))]), csv_file=True
                    )
                else:
                    with pd.ExcelFile(path, engine="openpyxl") as workbook:
                        counts = _import_sheets(
                            conn, file_id, _read_workbook(workbook), csv_file=False
                        )
                conn.execute(
                    "UPDATE excel_files SET status = 'completed', row_count = ?, "
                    "column_count = ?, num_sheets = ?, updated_at = ?, error_message = NULL "
                    "WHERE id = ?",
                    [*counts, _now(), file_id],
                )
                conn.commit()
            except Exception as exc:
                conn.rollback()
                conn.execute(
                    "UPDATE excel_files SET status = 'error', error_message = ?, "
                    "updated_at = ? WHERE id = ?",
                    [str(exc), _now(), file_id],
                )
    finally:
        current_username.reset(token)


async def _process_wrapper(username: str, file_id: str, file_path: str):
    """Wraps the sync function to run in a thread."""
    await asyncio.to_thread(process_excel_file_sync, username, file_id, file_path)


async def queue_worker():
    """Execute the queue_worker operation."""
    limit = min(5, max(1, os.cpu_count() or 1))
    sem = asyncio.Semaphore(limit)

    async def worker_task(username, file_id, file_path):
        """Execute the worker_task operation."""
        token = current_username.set(username)
        try:
            async with sem:
                task = asyncio.create_task(_process_wrapper(username, file_id, file_path))
                await asyncio.sleep(0.05)
                await broadcast_datasource_status()
                await task
                await broadcast_datasource_status()
        finally:
            current_username.reset(token)

    while True:
        try:
            username, file_id, file_path = await task_queue.get()

            task = asyncio.create_task(worker_task(username, file_id, file_path))
            active_tasks.add(task)
            task.add_done_callback(active_tasks.discard)

            task_queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            get_logger().warning("Background import worker failed: %s", type(exc).__name__)


def _pending_imports() -> list[tuple[str, str, str]]:
    pending = []
    users = list_account_users()
    for user_info in users:
        username = user_info["username"]
        token = current_username.set(username)
        try:
            conn = get_connection()
            rows = conn.execute(
                "SELECT id, stored_path FROM excel_files WHERE status IN ('pending', 'processing')"
            ).fetchall()
            for row in rows:
                file_id, file_path = row
                conn.execute("UPDATE excel_files SET status = 'pending' WHERE id = ?", [file_id])
                pending.append((username, file_id, file_path))
        except Exception as exc:
            get_logger().warning("Could not resume queued imports: %s", type(exc).__name__)
        finally:
            current_username.reset(token)
    return pending


async def resume_pending_tasks() -> None:
    """Recover queued imports without blocking startup's event loop."""
    for task in await asyncio.to_thread(_pending_imports):
        task_queue.put_nowait(task)
