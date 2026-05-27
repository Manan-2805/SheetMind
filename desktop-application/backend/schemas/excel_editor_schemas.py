"""Module containing excel_editor_schemas functionality."""

from datetime import datetime
from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, Field

CellValue = Union[str, int, float, bool, Any, None]

class SheetData(BaseModel):
    """Schema or class representation for SheetData."""
    sheetName: str
    columns: Optional[list[str]] = None
    rows: Optional[list[list[CellValue]]] = None
    rowCount: int
    colCount: int

class ExcelEditorFile(BaseModel):
    """Schema or class representation for ExcelEditorFile."""
    fileId: str
    filename: str
    sheetCount: int
    fileSizeBytes: int
    uploadedAt: datetime

class CellFormatting(BaseModel):
    """Schema or class representation for CellFormatting."""
    bold: Optional[bool] = None
    italic: Optional[bool] = None
    textColor: Optional[str] = None
    bgColor: Optional[str] = None
    borderTop: Optional[bool] = None
    borderBottom: Optional[bool] = None
    borderLeft: Optional[bool] = None
    borderRight: Optional[bool] = None
    fontSize: Optional[int] = None
    align: Optional[Literal["left", "center", "right"]] = None

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
    operationType: str
    pandasCode: str
    operationSummary: str
    confidence: int
    diffRows: list[DiffRow]
    affectedRowCount: int
    followupSuggestions: list[str]

class ApplyRequest(BaseModel):
    """Schema or class representation for ApplyRequest."""
    fileId: str
    sheetName: str
    pandasCode: str
    currentRows: list[list[CellValue]]
    columns: list[str]

class SaveRequest(BaseModel):
    """Schema or class representation for SaveRequest."""
    fileId: str
    sheets: list[SheetData]
    formattingMap: dict[str, CellFormatting]

class HistoryRecord(BaseModel):
    """Schema or class representation for HistoryRecord."""
    id: str
    sheetName: str
    operationType: str
    rowsAffected: int
    appliedAt: datetime
    backupPath: str

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
