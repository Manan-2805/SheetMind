from datetime import datetime, timedelta, timezone
from typing import Any

from schemas.data_source_schemas import (
    AutocompleteFile,
    AutocompleteResponse,
    DataSourceResponse,
    PreviewResponse,
    SheetResponse,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ago(days: int = 0, hours: int = 0) -> datetime:
    return _now() - timedelta(days=days, hours=hours)


MOCK_SOURCES: list[dict[str, Any]] = [
    {
        "id": "ds-001",
        "original_filename": "Q1_2024_Sales_Report.xlsx",
        "stored_path": "uploads/Q1_2024_Sales_Report.xlsx",
        "uploaded_at": _ago(hours=2),
        "num_sheets": 3,
        "file_size_bytes": 2_847_392,
        "sheets": [
            {
                "id": "sh-001",
                "sheet_name": "Sales",
                "table_name": "q1_2024_sales_report_Sales",
                "row_count": 12847,
                "col_count": 18,
                "imported_at": _ago(hours=2),
            },
            {
                "id": "sh-002",
                "sheet_name": "Returns",
                "table_name": "q1_2024_sales_report_Returns",
                "row_count": 743,
                "col_count": 10,
                "imported_at": _ago(hours=2),
            },
            {
                "id": "sh-003",
                "sheet_name": "Summary",
                "table_name": "q1_2024_sales_report_Summary",
                "row_count": 24,
                "col_count": 8,
                "imported_at": _ago(hours=2),
            },
        ],
    },
    {
        "id": "ds-002",
        "original_filename": "Marketing_Budget_FY2024.xlsx",
        "stored_path": "uploads/Marketing_Budget_FY2024.xlsx",
        "uploaded_at": _ago(days=1, hours=6),
        "num_sheets": 2,
        "file_size_bytes": 1_204_856,
        "sheets": [
            {
                "id": "sh-004",
                "sheet_name": "Digital",
                "table_name": "marketing_budget_fy2024_Digital",
                "row_count": 3420,
                "col_count": 12,
                "imported_at": _ago(days=1, hours=6),
            },
            {
                "id": "sh-005",
                "sheet_name": "Traditional",
                "table_name": "marketing_budget_fy2024_Traditional",
                "row_count": 1890,
                "col_count": 12,
                "imported_at": _ago(days=1, hours=6),
            },
        ],
    },
    {
        "id": "ds-003",
        "original_filename": "Employee_Headcount_2024.xlsx",
        "stored_path": "uploads/Employee_Headcount_2024.xlsx",
        "uploaded_at": _ago(days=4),
        "num_sheets": 2,
        "file_size_bytes": 892_144,
        "sheets": [
            {
                "id": "sh-006",
                "sheet_name": "Headcount",
                "table_name": "employee_headcount_2024_Headcount",
                "row_count": 2341,
                "col_count": 15,
                "imported_at": _ago(days=4),
            },
            {
                "id": "sh-007",
                "sheet_name": "Org Chart",
                "table_name": "employee_headcount_2024_OrgChart",
                "row_count": 48,
                "col_count": 6,
                "imported_at": _ago(days=4),
            },
        ],
    },
]

MOCK_PREVIEW_COLUMNS = [
    "customer_name", "region", "product_sku", "quantity", "unit_price",
    "total_revenue", "order_date", "channel", "rep_name", "status",
]

MOCK_PREVIEW_ROWS = [
    ["Acme Corp", "North America", "SKU-4821", 12, 399.99, 4799.88, "2024-01-15", "Direct", "Sarah Chen", "Completed"],
    ["GlobalTech Ltd", "Europe", "SKU-2034", 5, 1299.00, 6495.00, "2024-01-18", "Partner", "James Okafor", "Completed"],
    ["Pacific Ventures", "Asia Pacific", "SKU-9102", 20, 89.50, 1790.00, "2024-01-22", "Online", "Priya Nair", "Completed"],
    ["Sunrise Industries", "North America", "SKU-4821", 8, 399.99, 3199.92, "2024-02-01", "Direct", "Marcus Webb", "Completed"],
    ["Delta Systems", "Europe", "SKU-7743", 3, 2100.00, 6300.00, "2024-02-08", "Partner", "Elena Vasquez", "Completed"],
    ["Orion Group", "Latin America", "SKU-2034", 7, 1299.00, 9093.00, "2024-02-14", "Direct", "Ricardo Lima", "Completed"],
    ["Meridian Co", "Middle East", "SKU-5512", 15, 450.00, 6750.00, "2024-02-20", "Online", "Amir Hassan", "Completed"],
    ["Nexus Partners", "North America", "SKU-9102", 30, 89.50, 2685.00, "2024-03-02", "Reseller", "Diana Park", "Completed"],
    ["Summit Retail", "Europe", "SKU-4821", 6, 399.99, 2399.94, "2024-03-10", "Direct", "Oliver Grant", "Completed"],
    ["Apex Solutions", "Asia Pacific", "SKU-7743", 2, 2100.00, 4200.00, "2024-03-18", "Partner", "Wei Zhang", "Completed"],
]


def get_all() -> list[DataSourceResponse]:
    result = []
    for src in MOCK_SOURCES:
        sheets = [SheetResponse(**s) for s in src["sheets"]]
        result.append(
            DataSourceResponse(
                id=src["id"],
                original_filename=src["original_filename"],
                stored_path=src["stored_path"],
                uploaded_at=src["uploaded_at"],
                num_sheets=src["num_sheets"],
                file_size_bytes=src["file_size_bytes"],
                sheets=sheets,
            )
        )
    return result


def upload_file(filename: str, size: int) -> DataSourceResponse:
    now = _now()
    sheet = SheetResponse(
        id=f"sh-new-{int(now.timestamp())}",
        sheet_name="Sheet1",
        table_name=f"uploaded_{int(now.timestamp())}_Sheet1",
        row_count=1000,
        col_count=10,
        imported_at=now,
    )
    return DataSourceResponse(
        id=f"ds-new-{int(now.timestamp())}",
        original_filename=filename,
        stored_path=f"uploads/{filename}",
        uploaded_at=now,
        num_sheets=1,
        file_size_bytes=size,
        sheets=[sheet],
    )


def delete(source_id: str) -> None:
    pass


def get_preview(source_id: str) -> PreviewResponse:
    return PreviewResponse(
        columns=MOCK_PREVIEW_COLUMNS,
        rows=MOCK_PREVIEW_ROWS,
    )


def list_for_autocomplete() -> AutocompleteResponse:
    files = [
        AutocompleteFile(
            filename=src["original_filename"],
            sheets=[s["sheet_name"] for s in src["sheets"]],
        )
        for src in MOCK_SOURCES
    ]
    return AutocompleteResponse(files=files)
