"""Module containing data_source_models functionality."""

import logging
import os
from datetime import UTC, datetime
from typing import Any

import pandas as pd

from schemas.data_source_schemas import (
    AutocompleteFile,
    AutocompleteResponse,
    DataSourceResponse,
    PreviewResponse,
    SheetResponse,
)
from services.duckdb_service import get_connection

logger = logging.getLogger(__name__)
from services.logging_service import get_logger


def _now() -> datetime:
    """Execute the _now operation."""
    return datetime.now(UTC)


def get_all() -> list[DataSourceResponse]:
    """Execute the get_all operation."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, original_filename, stored_path, uploaded_at, num_sheets,
               file_size_bytes, status, error_message
        FROM excel_files
        ORDER BY uploaded_at DESC
        """
    ).fetchall()

    result = []
    for row in rows:
        file_id = row[0]
        status = row[6]
        sheets: list[SheetResponse] = []
        if status == "completed":
            sheet_rows = conn.execute(
                """
                SELECT id, sheet_name, table_name, row_count, col_count, imported_at
                FROM excel_sheets
                WHERE excel_file_id = ?
                ORDER BY imported_at ASC, sheet_name ASC
                """,
                [file_id],
            ).fetchall()
            sheets = [
                SheetResponse(
                    id=str(s[0]),
                    sheet_name=s[1],
                    table_name=s[2],
                    row_count=s[3] or 0,
                    col_count=s[4] or 0,
                    imported_at=s[5],
                )
                for s in sheet_rows
            ]

        result.append(
            DataSourceResponse(
                id=file_id,
                original_filename=row[1],
                stored_path=row[2],
                uploaded_at=row[3],
                num_sheets=row[4] or 0,
                file_size_bytes=row[5] or 0,
                status=status,
                error_message=row[7],
                sheets=sheets,
            )
        )
    return result


def delete(source_id: str) -> None:
    """Execute the delete operation."""
    conn = get_connection()
    row = conn.execute("SELECT stored_path FROM excel_files WHERE id = ?", [source_id]).fetchone()
    if row:
        stored_path = row[0]
        try:
            if os.path.exists(stored_path):
                os.remove(stored_path)
        except Exception as e:
            logger.warning("Failed to physically remove file %s: %s", stored_path, e)

    sheet_tables = conn.execute(
        "SELECT table_name FROM excel_sheets WHERE excel_file_id = ?",
        [source_id],
    ).fetchall()
    for table_row in sheet_tables:
        conn.execute(f"DROP TABLE IF EXISTS {table_row[0]}")

    conn.execute(f"DROP TABLE IF EXISTS file_{source_id.replace('-', '_')}")
    conn.execute("DELETE FROM excel_sheets WHERE excel_file_id = ?", [source_id])
    conn.execute("DELETE FROM excel_files WHERE id = ?", [source_id])


def get_preview(source_id: str, sheet_name: str | None = None) -> PreviewResponse:
    """Execute the get_preview operation."""
    conn = get_connection()
    table_name = None
    if sheet_name:
        row = conn.execute(
            """
            SELECT table_name FROM excel_sheets
            WHERE excel_file_id = ? AND sheet_name = ?
            """,
            [source_id, sheet_name],
        ).fetchone()
        if row:
            table_name = row[0]
    else:
        row = conn.execute(
            """
            SELECT table_name FROM excel_sheets
            WHERE excel_file_id = ?
            ORDER BY imported_at ASC, sheet_name ASC
            LIMIT 1
            """,
            [source_id],
        ).fetchone()
        if row:
            table_name = row[0]

    if not table_name:
        table_name = f"file_{source_id.replace('-', '_')}"

    try:
        conn.execute(f"SELECT 1 FROM {table_name} LIMIT 1")
    except Exception as exc:
        get_logger().warning("Could not preview imported data: %s", type(exc).__name__)
        return PreviewResponse(columns=[], rows=[])

    df = conn.execute(f"SELECT * FROM {table_name} LIMIT 50").fetchdf()
    columns = list(df.columns)
    rows = df.values.tolist()

    cleaned_rows: list[list[Any]] = []
    for row in rows:
        cleaned_rows.append([None if pd.isna(x) else x for x in row])

    return PreviewResponse(columns=columns, rows=cleaned_rows)


def list_for_autocomplete() -> AutocompleteResponse:
    """Execute the list_for_autocomplete operation."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT f.original_filename, s.sheet_name
        FROM excel_files f
        LEFT JOIN excel_sheets s ON s.excel_file_id = f.id
        WHERE f.status = 'completed'
        ORDER BY f.uploaded_at DESC, s.sheet_name ASC
        """
    ).fetchall()

    files_map: dict[str, set[str]] = {}
    for filename, sheet_name in rows:
        if filename not in files_map:
            files_map[filename] = set()
        if sheet_name:
            files_map[filename].add(sheet_name)

    files = [
        AutocompleteFile(filename=filename, sheets=sorted(list(sheets)))
        for filename, sheets in files_map.items()
    ]
    return AutocompleteResponse(files=files)
