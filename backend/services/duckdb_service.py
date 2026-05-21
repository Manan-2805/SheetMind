import duckdb

from dependencies import current_username
from services.storage_service import get_user_db_path

_conns: dict[str, duckdb.DuckDBPyConnection] = {}


def get_connection() -> duckdb.DuckDBPyConnection:
    global _conns
    username = current_username.get("default")
    safe_username = "".join(c for c in username if c.isalnum() or c in ("_", "-")) or "default"

    db_path = str(get_user_db_path(safe_username))

    if db_path not in _conns:
        conn = duckdb.connect(db_path)
        init_schema(conn)
        _conns[db_path] = conn

    return _conns[db_path]


def close_connection(username: str) -> None:
    """Close and remove a user's DuckDB connection (needed before deleting the file)."""
    safe_username = "".join(c for c in username if c.isalnum() or c in ("_", "-")) or "default"
    db_path = str(get_user_db_path(safe_username))
    conn = _conns.pop(db_path, None)
    if conn:
        try:
            conn.close()
        except Exception:
            pass


def init_schema(conn: duckdb.DuckDBPyConnection) -> None:
    """Create all tables in a single pass. Safe for fresh databases only."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS excel_files (
            id VARCHAR PRIMARY KEY,
            original_filename VARCHAR NOT NULL,
            stored_path VARCHAR NOT NULL,
            uploaded_at TIMESTAMP NOT NULL,
            num_sheets INTEGER NOT NULL DEFAULT 1,
            file_size_bytes BIGINT NOT NULL DEFAULT 0,
            status VARCHAR NOT NULL DEFAULT 'completed',
            error_message VARCHAR,
            row_count INTEGER,
            column_count INTEGER,
            updated_at TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS excel_sheets (
            id VARCHAR PRIMARY KEY,
            excel_file_id VARCHAR NOT NULL,
            sheet_name VARCHAR NOT NULL,
            table_name VARCHAR NOT NULL,
            row_count INTEGER NOT NULL DEFAULT 0,
            col_count INTEGER NOT NULL DEFAULT 0,
            imported_at TIMESTAMP NOT NULL
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id VARCHAR PRIMARY KEY,
            title VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL,
            is_favorite BOOLEAN DEFAULT false
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id VARCHAR PRIMARY KEY,
            session_id VARCHAR NOT NULL,
            role VARCHAR NOT NULL,
            content VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL,
            sql_generated VARCHAR,
            sql_execution_ms INTEGER,
            llm_generation_ms INTEGER,
            token_count_input INTEGER,
            token_count_output INTEGER,
            confidence_score INTEGER,
            result_row_count INTEGER,
            feedback VARCHAR,
            feedback_reason VARCHAR,
            parent_user_message_id VARCHAR,
            result_data_json VARCHAR,
            version INTEGER DEFAULT 1,
            followups_json VARCHAR,
            referenced_files_json VARCHAR,
            sql_gen_ms INTEGER,
            summary_gen_ms INTEGER,
            total_ms INTEGER,
            model_name VARCHAR,
            chart_url VARCHAR
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS saved_queries (
            id VARCHAR PRIMARY KEY,
            label VARCHAR NOT NULL,
            nl_query VARCHAR NOT NULL,
            sql_query VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL,
            last_used_at TIMESTAMP NOT NULL,
            use_count INTEGER DEFAULT 0,
            is_favorite BOOLEAN DEFAULT false
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS artifacts (
            id VARCHAR PRIMARY KEY,
            type VARCHAR NOT NULL,
            filename VARCHAR NOT NULL,
            file_path VARCHAR NOT NULL,
            file_size_bytes BIGINT NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL,
            source_message_id VARCHAR,
            title VARCHAR
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            settings_json VARCHAR NOT NULL
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS edit_history (
            id VARCHAR PRIMARY KEY,
            excel_file_id VARCHAR NOT NULL,
            sheet_name VARCHAR NOT NULL,
            operation_type VARCHAR NOT NULL,
            rows_affected INTEGER NOT NULL,
            applied_at TIMESTAMP NOT NULL,
            backup_path VARCHAR NOT NULL,
            was_confirmed BOOLEAN DEFAULT true
        )
    """)
