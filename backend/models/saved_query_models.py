from datetime import datetime, timedelta, timezone

from schemas.saved_query_schemas import SavedQueryResponse


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ago(days: int = 0, hours: int = 0) -> datetime:
    return _now() - timedelta(days=days, hours=hours)


MOCK_QUERIES: list[dict] = [
    {
        "id": "sq-001",
        "label": "Top customers by revenue",
        "nl_query": "Show me the top 10 customers by total revenue for this quarter",
        "sql_query": "SELECT customer_name, SUM(revenue) AS total_revenue\nFROM sales\nWHERE order_date >= DATE_TRUNC('quarter', CURRENT_DATE)\nGROUP BY customer_name\nORDER BY total_revenue DESC\nLIMIT 10;",
        "created_at": _ago(days=5),
        "last_used_at": _ago(hours=2),
        "use_count": 14,
    },
    {
        "id": "sq-002",
        "label": "Monthly revenue trend",
        "nl_query": "Show total revenue grouped by month for the past 12 months",
        "sql_query": "SELECT DATE_TRUNC('month', order_date) AS month,\n  SUM(revenue) AS monthly_revenue\nFROM sales\nWHERE order_date >= CURRENT_DATE - INTERVAL '12 months'\nGROUP BY month\nORDER BY month;",
        "created_at": _ago(days=12),
        "last_used_at": _ago(days=1),
        "use_count": 9,
    },
    {
        "id": "sq-003",
        "label": "Products below reorder point",
        "nl_query": "List all products where current inventory is below the reorder threshold",
        "sql_query": "SELECT product_sku, product_name, current_stock, reorder_point\nFROM inventory\nWHERE current_stock < reorder_point\nORDER BY (reorder_point - current_stock) DESC;",
        "created_at": _ago(days=20),
        "last_used_at": _ago(days=3),
        "use_count": 6,
    },
    {
        "id": "sq-004",
        "label": "Marketing ROI by channel",
        "nl_query": "Calculate ROI for each marketing channel comparing spend vs attributed revenue",
        "sql_query": "SELECT channel,\n  SUM(spend) AS total_spend,\n  SUM(attributed_revenue) AS total_revenue,\n  ROUND((SUM(attributed_revenue) - SUM(spend)) / SUM(spend) * 100, 2) AS roi_pct\nFROM marketing_data\nGROUP BY channel\nORDER BY roi_pct DESC;",
        "created_at": _ago(days=30),
        "last_used_at": _ago(days=7),
        "use_count": 4,
    },
]


def get_all() -> list[SavedQueryResponse]:
    return [SavedQueryResponse(**q) for q in MOCK_QUERIES]


def create(label: str, nl_query: str, sql_query: str) -> SavedQueryResponse:
    now = _now()
    return SavedQueryResponse(
        id=f"sq-new-{int(now.timestamp())}",
        label=label,
        nl_query=nl_query,
        sql_query=sql_query,
        created_at=now,
        last_used_at=now,
        use_count=0,
    )


def delete(query_id: str) -> None:
    pass


def run(query_id: str) -> str:
    for q in MOCK_QUERIES:
        if q["id"] == query_id:
            return q["nl_query"]
    return ""
