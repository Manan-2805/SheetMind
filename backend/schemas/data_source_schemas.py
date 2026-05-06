from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class SheetResponse(BaseModel):
    id: str
    sheet_name: str
    table_name: str
    row_count: int
    col_count: int
    imported_at: datetime


class DataSourceResponse(BaseModel):
    id: str
    original_filename: str
    stored_path: str
    uploaded_at: datetime
    num_sheets: int
    file_size_bytes: int
    sheets: list[SheetResponse]


class PreviewResponse(BaseModel):
    columns: list[str]
    rows: list[list[Any]]


class AutocompleteFile(BaseModel):
    filename: str
    sheets: list[str]


class AutocompleteResponse(BaseModel):
    files: list[AutocompleteFile]
