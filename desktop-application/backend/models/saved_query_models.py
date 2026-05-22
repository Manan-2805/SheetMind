import uuid
from datetime import datetime, timezone

from schemas.saved_query_schemas import SavedQueryResponse
from services.duckdb_service import get_connection


def _now() -> datetime:
    return datetime.now(timezone.utc)


def get_all() -> list[SavedQueryResponse]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, label, nl_query, sql_query, created_at, last_used_at, use_count, is_favorite
        FROM saved_queries
        ORDER BY is_favorite DESC, last_used_at DESC
        """
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
            is_favorite=bool(row[7]),
        ))
    return result


def search(query: str | None, date_from: datetime | None, date_to: datetime | None) -> list[SavedQueryResponse]:
    conn = get_connection()
    clauses = []
    params: list[object] = []

    if query:
        clauses.append("(LOWER(label) LIKE ? OR LOWER(nl_query) LIKE ?)")
        like = f"%{query.lower()}%"
        params.extend([like, like])
    if date_from:
        clauses.append("created_at >= ?")
        params.append(date_from)
    if date_to:
        clauses.append("created_at <= ?")
        params.append(date_to)

    where_clause = " WHERE " + " AND ".join(clauses) if clauses else ""
    sql = (
        "SELECT id, label, nl_query, sql_query, created_at, last_used_at, use_count, is_favorite "
        "FROM saved_queries" + where_clause + " ORDER BY is_favorite DESC, last_used_at DESC"
    )
    rows = conn.execute(sql, params).fetchall()
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
            is_favorite=bool(row[7]),
        ))
    return result


def create(label: str, nl_query: str, sql_query: str) -> SavedQueryResponse:
    conn = get_connection()
    now = _now()
    query_id = str(uuid.uuid4().hex[:8])
    conn.execute(
        """
        INSERT INTO saved_queries
        (id, label, nl_query, sql_query, created_at, last_used_at, use_count, is_favorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [query_id, label, nl_query, sql_query, now, now, 0, False]
    )
    return SavedQueryResponse(
        id=query_id,
        label=label,
        nl_query=nl_query,
        sql_query=sql_query,
        created_at=now,
        last_used_at=now,
        use_count=0,
        is_favorite=False,
    )


def delete(query_id: str) -> None:
    conn = get_connection()
    conn.execute("DELETE FROM saved_queries WHERE id = ?", [query_id])


def get_by_id(query_id: str) -> SavedQueryResponse | None:
    conn = get_connection()
    row = conn.execute(
        """
        SELECT id, label, nl_query, sql_query, created_at, last_used_at, use_count, is_favorite
        FROM saved_queries
        WHERE id = ?
        """,
        [query_id],
    ).fetchone()
    if row:
        return SavedQueryResponse(
            id=str(row[0]),
            label=row[1],
            nl_query=row[2],
            sql_query=row[3],
            created_at=row[4],
            last_used_at=row[5],
            use_count=row[6],
            is_favorite=bool(row[7]),
        )
    return None


def rename(query_id: str, new_label: str) -> SavedQueryResponse | None:
    conn = get_connection()
    conn.execute(
        "UPDATE saved_queries SET label = ? WHERE id = ?",
        [new_label, query_id],
    )
    return get_by_id(query_id)


def toggle_favorite(query_id: str) -> SavedQueryResponse | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT is_favorite FROM saved_queries WHERE id = ?",
        [query_id],
    ).fetchone()
    if not row:
        return None
    new_value = not bool(row[0])
    conn.execute(
        "UPDATE saved_queries SET is_favorite = ? WHERE id = ?",
        [new_value, query_id],
    )
    return get_by_id(query_id)


def mark_used(query_id: str) -> None:
    conn = get_connection()
    conn.execute(
        "UPDATE saved_queries SET last_used_at = ?, use_count = use_count + 1 WHERE id = ?",
        [_now(), query_id],
    )
