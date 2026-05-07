from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ResultColumn(BaseModel):
    key: str
    label: str


class ResultTable(BaseModel):
    columns: list[ResultColumn]
    rows: list[dict[str, Any]]
    total_rows: int


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    is_favorite: bool
    message_count: Optional[int] = None


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime
    sql_generated: Optional[str] = None
    sql_execution_ms: Optional[int] = None
    llm_generation_ms: Optional[int] = None
    token_count_input: Optional[int] = None
    token_count_output: Optional[int] = None
    confidence_score: Optional[int] = None
    result_row_count: Optional[int] = None
    result_data: Optional[ResultTable] = None
    nl_summary: Optional[str] = None
    referenced_files: Optional[list[str]] = None
    session_title: Optional[str] = None  # set on first message so frontend can update sidebar title


class SendMessageRequest(BaseModel):
    content: str
    referenced_files: list[str] = []


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    is_favorite: Optional[bool] = None
