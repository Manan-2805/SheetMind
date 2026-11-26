"""Module containing excel_editor_schemas functionality."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from schemas.excel_operations import Operations, OperationType

CellValue = str | int | float | bool | Any | None


class SheetData(BaseModel):
    """Schema or class representation for SheetData."""

    sheetName: str
    columns: list[str] | None = None
    rows: list[list[CellValue]] | None = None
    rowCount: int
    colCount: int
    formulaCells: list[str] | None = None


class ExcelEditorFile(BaseModel):
    """Schema or class representation for ExcelEditorFile."""

    fileId: str
    filename: str
    sheetCount: int
    editable: bool
    fileSizeBytes: int
    uploadedAt: datetime


class CellFormatting(BaseModel):
    """Schema or class representation for CellFormatting."""

    bold: bool | None = None
    italic: bool | None = None
    textColor: str | None = None
    bgColor: str | None = None
    borderTop: bool | None = None
    borderBottom: bool | None = None
    borderLeft: bool | None = None
    borderRight: bool | None = None
    fontSize: int | None = None
    align: Literal["left", "center", "right"] | None = None


class DiffRow(BaseModel):
    """Schema or class representation for DiffRow."""

    rowIndex: int
    columnName: str
    oldValue: CellValue
    newValue: CellValue
    isFormula: bool


class MutationRequest(BaseModel):
    """Schema or class representation for MutationRequest."""

    fileId: str
    sheetName: str
    userInstruction: str
    currentRows: list[list[CellValue]]
    columns: list[str]


class MutationResponse(BaseModel):
    """Schema or class representation for MutationResponse."""

    operationType: OperationType
    operations: Operations
    operationSummary: str
    confidence: int
    diffRows: list[DiffRow]
    affectedRowCount: int
    followupSuggestions: list[str]


class ApplyRequest(BaseModel):
    """Schema or class representation for ApplyRequest."""

    fileId: str
    sheetName: str
    operations: Operations
    currentRows: list[list[CellValue]]
    columns: list[str]


class SaveRequest(BaseModel):
    """Schema or class representation for SaveRequest."""

    fileId: str
    sheets: list[SheetData]
    formattingMap: dict[str, CellFormatting]


class RestoreRequest(BaseModel):
    """Restore a workbook revision selected from edit history."""

    fileId: str
    historyId: str


class HistoryRecord(BaseModel):
    """Schema or class representation for HistoryRecord."""

    id: str
    sheetName: str
    operationType: str
    rowsAffected: int
    appliedAt: datetime


class HistoryResponse(BaseModel):
    """Schema or class representation for HistoryResponse."""

    history: list[HistoryRecord]


class FileListResponse(BaseModel):
    """Schema or class representation for FileListResponse."""

    files: list[ExcelEditorFile]


class OpenFileResponse(BaseModel):
    """Schema or class representation for OpenFileResponse."""

    fileId: str
    filename: str
    sheets: list[SheetData]
    formattingMap: dict[str, CellFormatting] = Field(default_factory=dict)
