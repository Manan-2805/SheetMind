import asyncio
import pandas as pd
from datetime import datetime, timezone
import duckdb

from services.duckdb_service import get_connection
from dependencies import current_username
from models.settings_models import get_settings

# The queue stores tuples of (username, file_id, file_path, table_name)
task_queue = asyncio.Queue()
active_tasks = set()


def process_excel_file_sync(username: str, file_id: str, file_path: str, table_name: str):
    token = current_username.set(username)
    try:
        conn = get_connection()
        try:
            # Update status to processing
            conn.execute(
                "UPDATE excel_files SET status = 'processing' WHERE id = ?", 
                [file_id]
            )
            
            # Load the file based on extension
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
                
            # Clean column names for DuckDB
            df.columns = [str(c).strip().replace(" ", "_").replace("-", "_") for c in df.columns]
            
            # Insert into DuckDB
            conn.execute(f"CREATE TABLE IF NOT EXISTS {table_name} AS SELECT * FROM df")
            
            # Get counts
            row_count = len(df)
            col_count = len(df.columns)
            
            # Update status to complete
            now = datetime.now(timezone.utc)
            conn.execute(
                "UPDATE excel_files SET status = 'completed', row_count = ?, column_count = ?, updated_at = ? WHERE id = ?",
                [row_count, col_count, now, file_id]
            )
            
        except Exception as e:
            # Update status to error
            error_msg = str(e)
            now = datetime.now(timezone.utc)
            conn.execute(
                "UPDATE excel_files SET status = 'error', error_message = ?, updated_at = ? WHERE id = ?",
                [error_msg, now, file_id]
            )
    finally:
        current_username.reset(token)


async def _process_wrapper(username: str, file_id: str, file_path: str, table_name: str):
    """Wraps the sync function to run in a thread."""
    await asyncio.to_thread(process_excel_file_sync, username, file_id, file_path, table_name)


async def queue_worker():
    while True:
        try:
            # Wait until there is a task so we can get its username to check limit
            # But wait, limit is per-user! So we just process globally with a global limit of 2?
            # Or get settings for the specific user? Let's just use the default or first user's limit 
            # if we have no task yet. Actually, we can get task first, then wait based on THAT user's limit.
            username, file_id, file_path, table_name = await task_queue.get()
            
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
                
            task = asyncio.create_task(_process_wrapper(username, file_id, file_path, table_name))
            active_tasks.add(task)
            task.add_done_callback(active_tasks.discard)
            
            task_queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception:
            pass


async def resume_pending_tasks():
    import glob
    db_files = glob.glob("sheetmind_*.duckdb")
    for db_file in db_files:
        username = db_file.replace("sheetmind_", "").replace(".duckdb", "")
        token = current_username.set(username)
        try:
            conn = get_connection()
            rows = conn.execute(
                "SELECT id, stored_path FROM excel_files WHERE status IN ('pending', 'processing')"
            ).fetchall()
            for row in rows:
                file_id, file_path = row
                table_name = f"file_{file_id.replace('-', '_')}"
                conn.execute("UPDATE excel_files SET status = 'pending' WHERE id = ?", [file_id])
                task_queue.put_nowait((username, file_id, file_path, table_name))
        except Exception:
            pass
        finally:
            current_username.reset(token)
