"""Module containing chat_schemas functionality."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ResultColumn(BaseModel):
    """Schema or class representation for ResultColumn."""
    key: str
    label: str


class ResultTable(BaseModel):
    """Schema or class representation for ResultTable."""
    columns: list[ResultColumn]
    rows: list[dict[str, Any]]
    total_rows: int
    page: int = 1
    page_size: int = 500
    total_pages: int = 1


class ChatSessionResponse(BaseModel):
    """Schema or class representation for ChatSessionResponse."""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    is_favorite: bool
    message_count: Optional[int] = None


class ChatMessageResponse(BaseModel):
    """Schema or class representation for ChatMessageResponse."""
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
    session_title: Optional[str] = None
    parent_user_message_id: Optional[str] = None
    feedback: Optional[str] = None
    feedback_reason: Optional[str] = None
    version: Optional[int] = 1
    sql_gen_ms: Optional[int] = None
    summary_gen_ms: Optional[int] = None
    total_ms: Optional[int] = None
    model_name: Optional[str] = None
    followups: Optional[list[str]] = None
    confidence_score: Optional[int] = None
    is_typing: Optional[bool] = None
    chart_url: Optional[str] = None


class SendMessageRequest(BaseModel):
    """Schema or class representation for SendMessageRequest."""
    content: str
    referenced_files: list[str] = []
    parent_user_message_id: Optional[str] = None


class ChatSessionCreate(BaseModel):
    """Schema or class representation for ChatSessionCreate."""
    title: Optional[str] = None


class ChatSessionUpdate(BaseModel):
    """Schema or class representation for ChatSessionUpdate."""
    title: Optional[str] = None
    is_favorite: Optional[bool] = None
