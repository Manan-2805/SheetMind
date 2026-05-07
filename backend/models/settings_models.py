import json
import duckdb
from schemas.settings_schemas import SettingsResponse
from services.duckdb_service import get_connection

def get_settings() -> SettingsResponse:
    conn = get_connection()
    row = conn.execute("SELECT settings_json FROM settings WHERE id = 1").fetchone()
    if row and row[0]:
        data = json.loads(row[0])
        return SettingsResponse(**data)
    
    # Return defaults if none exist
    return SettingsResponse()

def update_settings_db(settings: SettingsResponse):
    conn = get_connection()
    data_json = settings.model_dump_json()
    conn.execute(
        "INSERT OR REPLACE INTO settings (id, settings_json) VALUES (1, ?)",
        [data_json]
    )

def clear_chat_history_db() -> int:
    conn = get_connection()
    # Count sessions first
    count = conn.execute("SELECT COUNT(*) FROM chat_sessions").fetchone()[0]
    conn.execute("DELETE FROM chat_messages")
    conn.execute("DELETE FROM chat_sessions")
    return count

def delete_all_files_db() -> int:
    conn = get_connection()
    rows = conn.execute("SELECT id FROM excel_files").fetchall()
    count = len(rows)
    
    for row in rows:
        file_id = row[0]
        table_name = f"file_{file_id.replace('-', '_')}"
        try:
            conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        except Exception:
            pass
            
    conn.execute("DELETE FROM excel_files")
    return count
