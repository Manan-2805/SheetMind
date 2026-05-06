from datetime import datetime, timedelta, timezone
from typing import Any

from schemas.artifact_schemas import (
    ArtifactChartResponse,
    ArtifactExportResponse,
    ArtifactsResponse,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ago(days: int = 0, minutes: int = 0, hours: int = 0) -> datetime:
    return _now() - timedelta(days=days, minutes=minutes, hours=hours)


def get_all() -> ArtifactsResponse:
    excel_exports = [
        ArtifactExportResponse(
            id="art-001",
            filename="Top_Customers_Q1_2024.xlsx",
            file_path="artifacts/Top_Customers_Q1_2024.xlsx",
            file_size_bytes=148_320,
            created_at=_ago(minutes=45),
            source_message_id="msg-002",
            source_session_name="Q1 Revenue Breakdown",
            title="Top 10 Customers by Revenue — Q1 2024",
        ),
        ArtifactExportResponse(
            id="art-002",
            filename="Marketing_Channel_Analysis.xlsx",
            file_path="artifacts/Marketing_Channel_Analysis.xlsx",
            file_size_bytes=92_480,
            created_at=_ago(hours=3),
            source_message_id="msg-010",
            source_session_name="Marketing Spend by Channel",
            title="Marketing Spend vs ROI by Channel",
        ),
        ArtifactExportResponse(
            id="art-003",
            filename="Inventory_Turnover_Report.xlsx",
            file_path="artifacts/Inventory_Turnover_Report.xlsx",
            file_size_bytes=234_112,
            created_at=_ago(days=2),
            source_message_id="msg-024",
            source_session_name="Inventory Turnover Analysis",
            title="Inventory Turnover by SKU — Last 90 Days",
        ),
    ]

    charts = [
        ArtifactChartResponse(
            id="art-chart-001",
            chart_type="bar",
            title="Revenue by Region — Q1 2024",
            created_at=_ago(hours=1),
            source_message_id="msg-002",
            source_session_name="Q1 Revenue Breakdown",
        ),
        ArtifactChartResponse(
            id="art-chart-002",
            chart_type="line",
            title="Monthly Active Users Trend",
            created_at=_ago(hours=5),
            source_message_id="msg-015",
            source_session_name="User Growth Analysis",
        ),
        ArtifactChartResponse(
            id="art-chart-003",
            chart_type="donut",
            title="Marketing Budget Allocation",
            created_at=_ago(days=1),
            source_message_id="msg-011",
            source_session_name="Marketing Spend by Channel",
        ),
    ]

    return ArtifactsResponse(excel_exports=excel_exports, charts=charts)
