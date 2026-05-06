from datetime import datetime, timedelta, timezone
from typing import Any

from schemas.chat_schemas import (
    ChatMessageResponse,
    ChatSessionResponse,
    ResultColumn,
    ResultTable,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ago(days: int = 0, hours: int = 0, minutes: int = 0) -> datetime:
    return _now() - timedelta(days=days, hours=hours, minutes=minutes)


MOCK_SESSIONS: list[dict[str, Any]] = [
    {
        "id": "sess-001",
        "title": "Q1 Revenue Breakdown",
        "created_at": _ago(days=0, hours=1),
        "updated_at": _ago(days=0, minutes=30),
        "is_favorite": True,
        "message_count": 6,
    },
    {
        "id": "sess-002",
        "title": "Marketing Spend by Channel",
        "created_at": _ago(days=0, hours=4),
        "updated_at": _ago(days=0, hours=3),
        "is_favorite": False,
        "message_count": 3,
    },
    {
        "id": "sess-003",
        "title": "Top 10 Customers by GMV",
        "created_at": _ago(days=1, hours=2),
        "updated_at": _ago(days=1, hours=1),
        "is_favorite": False,
        "message_count": 4,
    },
    {
        "id": "sess-004",
        "title": "Inventory Turnover Analysis",
        "created_at": _ago(days=3),
        "updated_at": _ago(days=3),
        "is_favorite": True,
        "message_count": 8,
    },
    {
        "id": "sess-005",
        "title": "Employee Headcount by Department",
        "created_at": _ago(days=8),
        "updated_at": _ago(days=8),
        "is_favorite": False,
        "message_count": 2,
    },
]

MOCK_RESULT_TABLE = ResultTable(
    columns=[
        ResultColumn(key="customer_name", label="Customer Name"),
        ResultColumn(key="region", label="Region"),
        ResultColumn(key="total_revenue", label="Total Revenue"),
        ResultColumn(key="orders_count", label="Orders"),
        ResultColumn(key="avg_order_value", label="Avg Order Value"),
    ],
    rows=[
        {"customer_name": "Acme Corp", "region": "North America", "total_revenue": 482930.50, "orders_count": 142, "avg_order_value": 3401.62},
        {"customer_name": "GlobalTech Ltd", "region": "Europe", "total_revenue": 371200.00, "orders_count": 98, "avg_order_value": 3787.76},
        {"customer_name": "Pacific Ventures", "region": "Asia Pacific", "total_revenue": 298450.75, "orders_count": 87, "avg_order_value": 3430.47},
        {"customer_name": "Sunrise Industries", "region": "North America", "total_revenue": 241800.20, "orders_count": 76, "avg_order_value": 3181.58},
        {"customer_name": "Delta Systems", "region": "Europe", "total_revenue": 198340.90, "orders_count": 65, "avg_order_value": 3051.40},
        {"customer_name": "Orion Group", "region": "Latin America", "total_revenue": 176520.00, "orders_count": 54, "avg_order_value": 3269.00},
        {"customer_name": "Meridian Co", "region": "Middle East", "total_revenue": 154300.45, "orders_count": 48, "avg_order_value": 3214.59},
        {"customer_name": "Nexus Partners", "region": "North America", "total_revenue": 132780.30, "orders_count": 41, "avg_order_value": 3238.54},
    ],
    total_rows=47,
)

MOCK_MESSAGES: list[dict[str, Any]] = [
    {
        "id": "msg-001",
        "session_id": "sess-001",
        "role": "user",
        "content": "Show me the top 10 customers by total revenue for Q1 2024",
        "created_at": _ago(hours=1, minutes=5),
        "sql_generated": None,
        "sql_execution_ms": None,
        "llm_generation_ms": None,
        "token_count_input": None,
        "token_count_output": None,
        "confidence_score": None,
        "result_row_count": None,
        "result_data": None,
        "nl_summary": None,
        "referenced_files": ["Q1_2024_Sales.xlsx"],
    },
    {
        "id": "msg-002",
        "session_id": "sess-001",
        "role": "assistant",
        "content": "Here are the top customers by total revenue for Q1 2024, pulled from the **Sales** sheet.",
        "created_at": _ago(hours=1, minutes=4),
        "sql_generated": "SELECT customer_name, region, SUM(revenue) AS total_revenue,\n  COUNT(order_id) AS orders_count,\n  AVG(revenue) AS avg_order_value\nFROM \"Q1_2024_Sales.xlsx\".\"Sales\"\nWHERE order_date BETWEEN '2024-01-01' AND '2024-03-31'\nGROUP BY customer_name, region\nORDER BY total_revenue DESC\nLIMIT 10;",
        "sql_execution_ms": 38,
        "llm_generation_ms": 742,
        "token_count_input": 284,
        "token_count_output": 97,
        "confidence_score": 5,
        "result_row_count": 47,
        "result_data": MOCK_RESULT_TABLE,
        "nl_summary": "Acme Corp leads with $482K across 142 orders, followed by GlobalTech at $371K. North America dominates with 3 of the top 5 customers.",
        "referenced_files": ["Q1_2024_Sales.xlsx"],
    },
    {
        "id": "msg-003",
        "session_id": "sess-001",
        "role": "assistant",
        "content": "Would you like me to break this down further by product category or show monthly trends for these customers?",
        "created_at": _ago(hours=1, minutes=3),
        "sql_generated": None,
        "sql_execution_ms": None,
        "llm_generation_ms": 310,
        "token_count_input": 198,
        "token_count_output": 42,
        "confidence_score": 4,
        "result_row_count": None,
        "result_data": None,
        "nl_summary": None,
        "referenced_files": [],
    },
]


def get_sessions() -> list[ChatSessionResponse]:
    return [ChatSessionResponse(**s) for s in MOCK_SESSIONS]


def get_messages(session_id: str) -> list[ChatMessageResponse]:
    return [ChatMessageResponse(**m) for m in MOCK_MESSAGES]


def create_session(title: str | None = None) -> ChatSessionResponse:
    now = _now()
    return ChatSessionResponse(
        id=f"sess-{int(now.timestamp())}",
        title=title or "New conversation",
        created_at=now,
        updated_at=now,
        is_favorite=False,
        message_count=0,
    )


def create_message(
    session_id: str,
    content: str,
    referenced_files: list[str],
) -> ChatMessageResponse:
    now = _now()
    return ChatMessageResponse(
        id=f"msg-{int(now.timestamp())}",
        session_id=session_id,
        role="assistant",
        content=f"Based on your query about **\"{content[:60]}...\"**, here are the results from the dataset.",
        created_at=now,
        sql_generated=f"SELECT * FROM sheet1\nWHERE condition = 'value'\nORDER BY column DESC\nLIMIT 20;",
        sql_execution_ms=42,
        llm_generation_ms=680,
        token_count_input=len(content.split()) * 2,
        token_count_output=87,
        confidence_score=4,
        result_row_count=20,
        result_data=MOCK_RESULT_TABLE,
        nl_summary="The query returned 20 rows matching the specified criteria. Values are sorted in descending order by the primary metric.",
        referenced_files=referenced_files,
    )
