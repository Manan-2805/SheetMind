import asyncio
import re
import uuid
from datetime import datetime, timezone

import pandas as pd

from dependencies import current_username
from models.settings_models import get_settings
from services.duckdb_service import get_connection

# The queue stores tuples of (username, file_id, file_path)
task_queue = asyncio.Queue()
active_tasks = set()


from services.excel_import_service import safe_table_name, clean_columns, import_df_to_duckdb, now_utc as _now

# The queue stores tuples of (username, file_id, file_path)


def process_excel_file_sync(username: str, file_id: str, file_path: str):
    token = current_username.set(username)
    try:
        conn = get_connection()
        try:
            # Update status to processing
            conn.execute(
                "UPDATE excel_files SET status = 'processing' WHERE id = ?", 
                [file_id]
            )
            
            conn.execute("DELETE FROM excel_sheets WHERE excel_file_id = ?", [file_id])

            total_rows = 0
            max_cols = 0
            num_sheets = 0

            if file_path.endswith(".csv"):
                df = clean_columns(pd.read_csv(file_path))
                table_name = safe_table_name(file_id)
                import_df_to_duckdb(conn, df, table_name)

                row_count = len(df)
                col_count = len(df.columns)
                total_rows += row_count
                max_cols = max(max_cols, col_count)
                num_sheets = 1

                conn.execute(
                    """
                    INSERT INTO excel_sheets
                    (id, excel_file_id, sheet_name, table_name, row_count, col_count, imported_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    [f"sh-{uuid.uuid4().hex[:8]}", file_id, "Sheet1", table_name, row_count, col_count, _now()]
                )
            else:
                workbook = pd.read_excel(file_path, sheet_name=None)
                for sheet_name, df in workbook.items():
                    df = clean_columns(df)
                    table_name = safe_table_name(file_id, sheet_name)
                    import_df_to_duckdb(conn, df, table_name)

                    row_count = len(df)
                    col_count = len(df.columns)
                    total_rows += row_count
                    max_cols = max(max_cols, col_count)
                    num_sheets += 1

                    conn.execute(
                        """
                        INSERT INTO excel_sheets
                        (id, excel_file_id, sheet_name, table_name, row_count, col_count, imported_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        [f"sh-{uuid.uuid4().hex[:8]}", file_id, sheet_name, table_name, row_count, col_count, _now()]
                    )

            if num_sheets == 0:
                raise ValueError("No sheets found to import")

            now = _now()
            conn.execute(
                """
                UPDATE excel_files
                SET status = 'completed', row_count = ?, column_count = ?, num_sheets = ?, updated_at = ?
                WHERE id = ?
                """,
                [total_rows, max_cols, num_sheets, now, file_id]
            )
            
        except Exception as e:
            # Update status to error
            error_msg = str(e)
            now = _now()
            conn.execute(
                "UPDATE excel_files SET status = 'error', error_message = ?, updated_at = ? WHERE id = ?",
                [error_msg, now, file_id]
            )
    finally:
        current_username.reset(token)




async def _process_wrapper(username: str, file_id: str, file_path: str):
    """Wraps the sync function to run in a thread."""
    await asyncio.to_thread(process_excel_file_sync, username, file_id, file_path)


async def queue_worker():
    while True:
        try:
            # Wait until there is a task so we can get its username to check limit
            # But wait, limit is per-user! So we just process globally with a global limit of 2?
            # Or get settings for the specific user? Let's just use the default or first user's limit 
            # if we have no task yet. Actually, we can get task first, then wait based on THAT user's limit.
            username, file_id, file_path = await task_queue.get()
            
            token = current_username.set(username)
            try:
                settings = get_settings()
                limit = settings.max_concurrent_uploads
                
                while len(active_tasks) >= limit:
                    await asyncio.sleep(0.5)
                    settings = get_settings()
                    limit = settings.max_concurrent_uploads
            finally:
                current_username.reset(token)
                
            task = asyncio.create_task(_process_wrapper(username, file_id, file_path))
            active_tasks.add(task)
            task.add_done_callback(active_tasks.discard)
            
            task_queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception:
            pass


async def resume_pending_tasks():
    from services.storage_service import list_account_users
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
                task_queue.put_nowait((username, file_id, file_path))
        except Exception:
            pass
        finally:
            current_username.reset(token)
