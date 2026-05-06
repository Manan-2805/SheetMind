import duckdb

DB_PATH = "sheetmind.duckdb"

_conn: duckdb.DuckDBPyConnection | None = None


def get_connection() -> duckdb.DuckDBPyConnection:
    global _conn
    if _conn is None:
        _conn = duckdb.connect(DB_PATH)
    return _conn


def init_schema() -> None:
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS excel_files (
            id INTEGER PRIMARY KEY,
            original_filename VARCHAR NOT NULL,
            stored_path VARCHAR NOT NULL,
            uploaded_at TIMESTAMP NOT NULL,
            num_sheets INTEGER NOT NULL DEFAULT 1,
            file_size_bytes BIGINT NOT NULL DEFAULT 0
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
            id INTEGER PRIMARY KEY,
            title VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL,
            is_favorite BOOLEAN DEFAULT false
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY,
            session_id INTEGER NOT NULL,
            role VARCHAR NOT NULL,
            content VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL,
            sql_generated VARCHAR,
            sql_execution_ms INTEGER,
            llm_generation_ms INTEGER,
            token_count_input INTEGER,
            token_count_output INTEGER,
            confidence_score INTEGER,
            result_row_count INTEGER
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS saved_queries (
            id INTEGER PRIMARY KEY,
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
