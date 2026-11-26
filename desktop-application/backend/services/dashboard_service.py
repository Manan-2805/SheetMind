"""Module containing dashboard_service functionality."""

import uuid
from datetime import UTC, datetime
from typing import Any

from schemas.dashboard import (
    DashboardCreate,
    DashboardRead,
    DashboardUpdate,
    DashboardWidgetCreate,
    DashboardWidgetRead,
)
from services.duckdb_service import get_connection
from services.query_service import get_result_row_limit
from services.sql_guard import run_user_query


def list_dashboards(
    q: str | None = None, filter_type: str = "all", sort_by: str = "name"
) -> list[DashboardRead]:
    """Execute the list_dashboards operation."""
    conn = get_connection()

    query = """
        SELECT id, title, layout_json, created_at, updated_at, is_favorite, thumbnail_path
        FROM dashboards
        WHERE 1=1
    """
    params = []

    if q:
        query += " AND LOWER(title) LIKE ?"
        params.append(f"%{q.lower()}%")

    if filter_type == "favorites":
        query += " AND is_favorite = true"
    elif filter_type == "recent":
        # last 7 days
        query += " AND updated_at >= current_timestamp - INTERVAL 7 DAY"

    # Always sort favorites first, then by the selected criteria
    order_clause = " ORDER BY is_favorite DESC"
    if sort_by == "name":
        order_clause += ", LOWER(title) ASC"
    elif sort_by == "created":
        order_clause += ", created_at DESC"
    elif sort_by == "viewed":
        order_clause += ", updated_at DESC"
    else:
        order_clause += ", LOWER(title) ASC"

    query += order_clause

    df = conn.execute(query, params).fetchdf()
    dashboards = []

    for _, row in df.iterrows():
        d_id = str(row["id"])

        # Fetch widgets for this dashboard
        widgets_df = conn.execute(
            "SELECT * FROM dashboard_widgets WHERE dashboard_id = ?", [d_id]
        ).fetchdf()

        widgets = []
        for _, w_row in widgets_df.iterrows():
            widgets.append(
                DashboardWidgetRead(
                    id=str(w_row["id"]),
                    dashboard_id=str(w_row["dashboard_id"]),
                    widget_type=str(w_row["widget_type"]),
                    label=str(w_row["label"]),
                    saved_query_id=str(w_row["saved_query_id"])
                    if w_row["saved_query_id"]
                    else None,
                    column_config_json=str(w_row["column_config_json"]),
                    position_json=str(w_row["position_json"]),
                    size=str(w_row["size"]),
                )
            )

        dashboards.append(
            DashboardRead(
                id=d_id,
                title=str(row["title"]),
                layout_json=str(row["layout_json"]),
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                is_favorite=bool(row["is_favorite"]),
                thumbnail_path=str(row["thumbnail_path"]) if row["thumbnail_path"] else None,
                widgets=widgets,
            )
        )

    return dashboards


def get_dashboard(dashboard_id: str) -> DashboardRead | None:
    """Execute the get_dashboard operation."""
    conn = get_connection()
    df = conn.execute("SELECT * FROM dashboards WHERE id = ?", [dashboard_id]).fetchdf()
    if df.empty:
        return None

    row = df.iloc[0]

    widgets_df = conn.execute(
        "SELECT * FROM dashboard_widgets WHERE dashboard_id = ?", [dashboard_id]
    ).fetchdf()

    widgets = []
    for _, w_row in widgets_df.iterrows():
        widgets.append(
            DashboardWidgetRead(
                id=str(w_row["id"]),
                dashboard_id=str(w_row["dashboard_id"]),
                widget_type=str(w_row["widget_type"]),
                label=str(w_row["label"]),
                saved_query_id=str(w_row["saved_query_id"]) if w_row["saved_query_id"] else None,
                column_config_json=str(w_row["column_config_json"]),
                position_json=str(w_row["position_json"]),
                size=str(w_row["size"]),
            )
        )

    # update 'last viewed' logic basically updating updated_at when viewed? PRD says last viewed = updated_at or tracked separately?
    # actually let's just do a touch for last viewed
    conn.execute(
        "UPDATE dashboards SET updated_at = current_timestamp WHERE id = ?", [dashboard_id]
    )

    return DashboardRead(
        id=dashboard_id,
        title=str(row["title"]),
        layout_json=str(row["layout_json"]),
        created_at=row["created_at"],
        updated_at=datetime.now(UTC).replace(tzinfo=None),  # approx since we just updated
        is_favorite=bool(row["is_favorite"]),
        thumbnail_path=str(row["thumbnail_path"]) if row["thumbnail_path"] else None,
        widgets=widgets,
    )


def _insert_widgets(conn: Any, dashboard_id: str, widgets: list[DashboardWidgetCreate]):
    """Execute the _insert_widgets operation."""
    for w in widgets:
        w_id = str(uuid.uuid4())
        conn.execute(
            """
            INSERT INTO dashboard_widgets
            (id, dashboard_id, widget_type, label, saved_query_id, column_config_json, position_json, size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                w_id,
                dashboard_id,
                w.widget_type,
                w.label,
                w.saved_query_id,
                w.column_config_json,
                w.position_json,
                w.size,
            ],
        )


def create_dashboard(data: DashboardCreate) -> DashboardRead:
    """Execute the create_dashboard operation."""
    conn = get_connection()
    d_id = str(uuid.uuid4())
    now = datetime.now(UTC).replace(tzinfo=None)

    conn.execute(
        """
        INSERT INTO dashboards
        (id, title, layout_json, created_at, updated_at, is_favorite, thumbnail_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [d_id, data.title, data.layout_json, now, now, data.is_favorite, data.thumbnail_path],
    )

    _insert_widgets(conn, d_id, data.widgets)

    return get_dashboard(d_id)


def update_dashboard(dashboard_id: str, data: DashboardUpdate) -> DashboardRead | None:
    """Execute the update_dashboard operation."""
    conn = get_connection()
    df = conn.execute("SELECT id FROM dashboards WHERE id = ?", [dashboard_id]).fetchdf()
    if df.empty:
        return None

    updates = []
    params = []
    if data.title is not None:
        updates.append("title = ?")
        params.append(data.title)
    if data.layout_json is not None:
        updates.append("layout_json = ?")
        params.append(data.layout_json)
    if data.is_favorite is not None:
        updates.append("is_favorite = ?")
        params.append(data.is_favorite)
    if data.thumbnail_path is not None:
        updates.append("thumbnail_path = ?")
        params.append(data.thumbnail_path)

    updates.append("updated_at = current_timestamp")

    if updates:
        query = f"UPDATE dashboards SET {', '.join(updates)} WHERE id = ?"
        params.append(dashboard_id)
        conn.execute(query, params)

    if data.widgets is not None:
        # Replace all widgets
        conn.execute("DELETE FROM dashboard_widgets WHERE dashboard_id = ?", [dashboard_id])
        _insert_widgets(conn, dashboard_id, data.widgets)

    return get_dashboard(dashboard_id)


def delete_dashboard(dashboard_id: str) -> bool:
    """Execute the delete_dashboard operation."""
    conn = get_connection()
    df = conn.execute("SELECT id FROM dashboards WHERE id = ?", [dashboard_id]).fetchdf()
    if df.empty:
        return False

    conn.execute("DELETE FROM dashboard_widgets WHERE dashboard_id = ?", [dashboard_id])
    conn.execute("DELETE FROM dashboards WHERE id = ?", [dashboard_id])
    return True


def refresh_dashboard(dashboard_id: str) -> dict[str, Any]:
    """Batch execute all saved queries for the given dashboard's widgets."""
    conn = get_connection()
    widgets_df = conn.execute(
        "SELECT id, saved_query_id FROM dashboard_widgets WHERE dashboard_id = ? AND saved_query_id IS NOT NULL",
        [dashboard_id],
    ).fetchdf()

    results = {}
    row_limit = get_result_row_limit()
    for _, w_row in widgets_df.iterrows():
        w_id = str(w_row["id"])
        sq_id = str(w_row["saved_query_id"])

        sq_df = conn.execute("SELECT sql_query FROM saved_queries WHERE id = ?", [sq_id]).fetchdf()
        if sq_df.empty:
            results[w_id] = {"error": "Saved query not found."}
            continue

        sql_query = sq_df.iloc[0]["sql_query"]
        try:
            table = run_user_query(conn, sql_query, row_limit)
            # Mark query as used
            conn.execute(
                "UPDATE saved_queries SET use_count = use_count + 1, last_used_at = current_timestamp WHERE id = ?",
                [sq_id],
            )

            results[w_id] = {"data": table.model_dump()}
        except Exception as e:
            results[w_id] = {"error": str(e)}

    return results
