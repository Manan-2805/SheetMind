import duckdb

from dependencies import current_username

_conns: dict[str, duckdb.DuckDBPyConnection] = {}


def get_connection() -> duckdb.DuckDBPyConnection:
    global _conns
    username = current_username.get("default")
    
    # Sanitize username slightly
    safe_username = "".join(c for c in username if c.isalnum() or c in ("_", "-"))
    if not safe_username:
        safe_username = "default"
        
    db_path = f"sheetmind_{safe_username}.duckdb"
    
    if db_path not in _conns:
        conn = duckdb.connect(db_path)
        _conns[db_path] = conn
        init_schema(conn)
        
    return _conns[db_path]


def init_schema(conn: duckdb.DuckDBPyConnection) -> None:

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
            id INTEGER PRIMARY KEY,
            excel_file_id INTEGER NOT NULL,
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
            feedback VARCHAR
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
            use_count INTEGER DEFAULT 0
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS artifacts (
            id INTEGER PRIMARY KEY,
            type VARCHAR NOT NULL,
            filename VARCHAR NOT NULL,
            file_path VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL,
            source_message_id INTEGER,
            title VARCHAR
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            settings_json VARCHAR NOT NULL
        )
    """)
