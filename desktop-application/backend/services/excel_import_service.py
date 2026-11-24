"""Module containing excel_import_service functionality."""

import csv
import re
from datetime import UTC, datetime
from pathlib import Path

import duckdb
import pandas as pd


def safe_table_name(file_id: str, sheet_name: str | None = None) -> str:
    """Execute the safe_table_name operation."""
    base = f"file_{file_id.replace('-', '_')}"
    if sheet_name:
        base = f"{base}_{sheet_name}"
    safe = re.sub(r"[^0-9A-Za-z_]+", "_", base.strip())
    safe = re.sub(r"_+", "_", safe).strip("_")
    return safe.lower() if safe else f"file_{file_id.replace('-', '_')}"


def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Set consistent, case-insensitively unique DuckDB column names."""
    df.columns = _column_names(list(df.columns))
    return df


def _column_names(headers: list) -> list[str]:
    used: set[str] = set()
    names = []
    for index, header in enumerate(headers, 1):
        base = "" if header is None else re.sub(r"[^\w]+", "_", str(header).strip()).strip("_")
        base = base or f"col_{index}"
        suffix = 1
        name = base
        while name.casefold() in used:
            name = f"{base}_{suffix}"
            suffix += 1
        used.add(name.casefold())
        names.append(name)
    return names


def read_csv_frame(path: Path) -> pd.DataFrame:
    """Read CSV values with pandas after preserving the original header names."""
    with path.open(encoding="utf-8-sig", newline="") as stream:
        header = next((row for row in csv.reader(stream) if row), None)
    if header is None:
        raise ValueError("CSV file has no header")
    return pd.read_csv(path, header=0, names=_column_names(header))


def read_excel_frame(workbook: pd.ExcelFile, sheet_name: str) -> pd.DataFrame:
    """Read a named worksheet with the raw header and pandas-inferred data types."""
    frame = workbook.parse(sheet_name)
    header = next(workbook.book[sheet_name].values, ())
    frame.columns = _column_names(
        [header[index] if index < len(header) else None for index in range(len(frame.columns))]
    )
    return frame


def import_df_to_duckdb(conn: duckdb.DuckDBPyConnection, df: pd.DataFrame, table_name: str):
    """Execute the import_df_to_duckdb operation."""
    df = clean_columns(df)
    identifier = table_name.replace('"', '""')
    conn.register("sheetmind_import_frame", df)
    try:
        conn.execute(
            f'CREATE OR REPLACE TABLE "{identifier}" AS SELECT * FROM sheetmind_import_frame'
        )
    finally:
        conn.unregister("sheetmind_import_frame")


def now_utc() -> datetime:
    """Execute the now_utc operation."""
    return datetime.now(UTC)
