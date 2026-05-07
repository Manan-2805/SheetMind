import uuid
from datetime import datetime, timezone

from schemas.saved_query_schemas import SavedQueryResponse
from services.duckdb_service import get_connection


def _now() -> datetime:
    return datetime.now(timezone.utc)


def get_all() -> list[SavedQueryResponse]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, label, nl_query, sql_query, created_at, last_used_at, use_count FROM saved_queries ORDER BY created_at DESC"
    ).fetchall()
    result = []
    for row in rows:
        result.append(SavedQueryResponse(
            id=str(row[0]),
            label=row[1],
            nl_query=row[2],
            sql_query=row[3],
            created_at=row[4],
            last_used_at=row[5],
            use_count=row[6],
        ))
    return result


def create(label: str, nl_query: str, sql_query: str) -> SavedQueryResponse:
    conn = get_connection()
    now = _now()
    query_id = str(uuid.uuid4().hex[:8])
    conn.execute(
        "INSERT INTO saved_queries (id, label, nl_query, sql_query, created_at, last_used_at, use_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [query_id, label, nl_query, sql_query, now, now, 0]
    )
    return SavedQueryResponse(
        id=query_id,
        label=label,
        nl_query=nl_query,
        sql_query=sql_query,
        created_at=now,
        last_used_at=now,
        use_count=0,
    )


def delete(query_id: str) -> None:
    conn = get_connection()
    conn.execute("DELETE FROM saved_queries WHERE id = ?", [query_id])


def run(query_id: str) -> str:
    conn = get_connection()
    row = conn.execute("SELECT nl_query FROM saved_queries WHERE id = ?", [query_id]).fetchone()
    if row:
        conn.execute(
            "UPDATE saved_queries SET last_used_at = ?, use_count = use_count + 1 WHERE id = ?",
            [_now(), query_id]
        )
        return row[0]
    return ""
