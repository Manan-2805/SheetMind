"""Module containing data_source_schemas functionality."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class SheetResponse(BaseModel):
    """Schema or class representation for SheetResponse."""
    id: str
    sheet_name: str
    table_name: str
    row_count: int
    col_count: int
    imported_at: datetime


class DataSourceResponse(BaseModel):
    """Schema or class representation for DataSourceResponse."""
    id: str
    original_filename: str
    stored_path: str
    uploaded_at: datetime
    num_sheets: int
    file_size_bytes: int
    sheets: list[SheetResponse]
    status: Optional[str] = 'completed'
    error_message: Optional[str] = None


class PreviewResponse(BaseModel):
    """Schema or class representation for PreviewResponse."""
    columns: list[str]
    rows: list[list[Any]]


class AutocompleteFile(BaseModel):
    """Schema or class representation for AutocompleteFile."""
    filename: str
    sheets: list[str]


class AutocompleteResponse(BaseModel):
    """Schema or class representation for AutocompleteResponse."""
    files: list[AutocompleteFile]
