from datetime import datetime
from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, Field

CellValue = Union[str, int, float, bool, Any, None]

class SheetData(BaseModel):
    sheetName: str
    columns: Optional[list[str]] = None
    rows: Optional[list[list[CellValue]]] = None
    rowCount: int
    colCount: int

class ExcelEditorFile(BaseModel):
    fileId: str
    filename: str
    sheetCount: int
    fileSizeBytes: int
    uploadedAt: datetime

class CellFormatting(BaseModel):
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
    rowIndex: int
    columnName: str
    oldValue: CellValue
    newValue: CellValue
    isFormula: bool

class MutationRequest(BaseModel):
    fileId: str
    sheetName: str
    userInstruction: str
    currentRows: list[list[CellValue]]
    columns: list[str]

class MutationResponse(BaseModel):
    operationType: str
    pandasCode: str
    operationSummary: str
    confidence: int
    diffRows: list[DiffRow]
    affectedRowCount: int
    followupSuggestions: list[str]

class ApplyRequest(BaseModel):
    fileId: str
    sheetName: str
    pandasCode: str
    currentRows: list[list[CellValue]]
    columns: list[str]

class SaveRequest(BaseModel):
    fileId: str
    sheets: list[SheetData]
    formattingMap: dict[str, CellFormatting]

class HistoryRecord(BaseModel):
    id: str
    sheetName: str
    operationType: str
    rowsAffected: int
    appliedAt: datetime
    backupPath: str

class HistoryResponse(BaseModel):
    history: list[HistoryRecord]

class FileListResponse(BaseModel):
    files: list[ExcelEditorFile]

class OpenFileResponse(BaseModel):
    fileId: str
    filename: str
    sheets: list[SheetData]
