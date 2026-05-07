from datetime import datetime, timedelta, timezone
from typing import Any

from schemas.data_source_schemas import (
    AutocompleteFile,
    AutocompleteResponse,
    DataSourceResponse,
    PreviewResponse,
    SheetResponse,
)


from datetime import datetime, timezone
import os
import shutil
from typing import Any

from schemas.data_source_schemas import (
    AutocompleteFile,
    AutocompleteResponse,
    DataSourceResponse,
    PreviewResponse,
    SheetResponse,
)
from services.duckdb_service import get_connection

def _now() -> datetime:
    return datetime.now(timezone.utc)

def get_all() -> list[DataSourceResponse]:
    conn = get_connection()
    rows = conn.execute("SELECT id, original_filename, stored_path, uploaded_at, num_sheets, file_size_bytes, status, error_message, row_count, column_count, updated_at FROM excel_files ORDER BY uploaded_at DESC").fetchall()
    
    result = []
    for row in rows:
        sheets = []
        if row[6] == 'completed':
            sheets = [
                SheetResponse(
                    id=f"{row[0]}_sh1",
                    sheet_name="Sheet1",
                    table_name=f"file_{row[0].replace('-', '_')}",
                    row_count=row[8] or 0,
                    col_count=row[9] or 0,
                    imported_at=row[10] or row[3]
                )
            ]
            
        result.append(
            DataSourceResponse(
                id=row[0],
                original_filename=row[1],
                stored_path=row[2],
                uploaded_at=row[3],
                num_sheets=row[4] or 1,
                file_size_bytes=row[5] or 0,
                status=row[6],
                error_message=row[7],
                sheets=sheets,
            )
        )
    return result

def upload_file(filename: str, size: int) -> DataSourceResponse:
    # This will be replaced by direct logic in the router
    pass

def delete(source_id: str) -> None:
    conn = get_connection()
    row = conn.execute("SELECT stored_path FROM excel_files WHERE id = ?", [source_id]).fetchone()
    if row:
        stored_path = row[0]
        if os.path.exists(stored_path):
            os.remove(stored_path)
            
    # Drop table
    conn.execute(f"DROP TABLE IF EXISTS file_{source_id.replace('-', '_')}")
    
    # Delete record
    conn.execute("DELETE FROM excel_files WHERE id = ?", [source_id])

def get_preview(source_id: str) -> PreviewResponse:
    conn = get_connection()
    table_name = f"file_{source_id.replace('-', '_')}"
    
    try:
        # Check if table exists
        conn.execute(f"SELECT 1 FROM {table_name} LIMIT 1")
    except:
        return PreviewResponse(columns=[], rows=[])
        
    df = conn.execute(f"SELECT * FROM {table_name} LIMIT 50").fetchdf()
    columns = list(df.columns)
    rows = df.values.tolist()
    
    # convert NaNs to None for JSON serialization
    cleaned_rows = []
    for row in rows:
        cleaned_rows.append([None if pd.isna(x) else x for x in row])
        
    return PreviewResponse(
        columns=columns,
        rows=cleaned_rows,
    )

def list_for_autocomplete() -> AutocompleteResponse:
    conn = get_connection()
    rows = conn.execute("SELECT original_filename FROM excel_files WHERE status = 'completed'").fetchall()
    
    files = [
        AutocompleteFile(
            filename=row[0],
            sheets=["Sheet1"],
        )
        for row in rows
    ]
    return AutocompleteResponse(files=files)

import pandas as pd
