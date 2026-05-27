"""Module containing settings_models functionality."""

import json
from schemas.settings_schemas import SettingsResponse
from services.duckdb_service import get_connection

def get_settings() -> SettingsResponse:
    """Execute the get_settings operation."""
    conn = get_connection()
    row = conn.execute("SELECT settings_json FROM settings WHERE id = 1").fetchone()
    if row and row[0]:
        data = json.loads(row[0])
        return SettingsResponse(**data)

    # Return defaults if none exist
    return SettingsResponse()

def update_settings_db(settings: SettingsResponse):
    """Execute the update_settings_db operation."""
    conn = get_connection()
    data_json = settings.model_dump_json()
    conn.execute(
        "INSERT OR REPLACE INTO settings (id, settings_json) VALUES (1, ?)",
        [data_json]
    )

def clear_chat_history_db() -> int:
    """Execute the clear_chat_history_db operation."""
    conn = get_connection()
    # Count sessions first
    count = conn.execute("SELECT COUNT(*) FROM chat_sessions").fetchone()[0]
    conn.execute("DELETE FROM chat_messages")
    conn.execute("DELETE FROM chat_sessions")
    return count

def delete_all_files_db() -> int:
    """Execute the delete_all_files_db operation."""
    conn = get_connection()
    rows = conn.execute("SELECT id FROM excel_files").fetchall()
    count = len(rows)

    for row in rows:
        file_id = row[0]
        sheet_tables = conn.execute(
            "SELECT table_name FROM excel_sheets WHERE excel_file_id = ?",
            [file_id],
        ).fetchall()
        for table_row in sheet_tables:
            try:
                conn.execute(f"DROP TABLE IF EXISTS {table_row[0]}")
            except Exception:
                pass
        try:
            conn.execute(f"DROP TABLE IF EXISTS file_{file_id.replace('-', '_')}")
        except Exception:
            pass

    conn.execute("DELETE FROM excel_files")
    conn.execute("DELETE FROM excel_sheets")
    return count
