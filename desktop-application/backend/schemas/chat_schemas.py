"""Module containing chat_schemas functionality."""

from datetime import datetime
from typing import Any

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
    message_count: int | None = None


class ChatMessageResponse(BaseModel):
    """Schema or class representation for ChatMessageResponse."""

    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime
    sql_generated: str | None = None
    sql_execution_ms: int | None = None
    llm_generation_ms: int | None = None
    token_count_input: int | None = None
    token_count_output: int | None = None
    confidence_score: int | None = None
    result_row_count: int | None = None
    result_data: ResultTable | None = None
    nl_summary: str | None = None
    referenced_files: list[str] | None = None
    session_title: str | None = None
    parent_user_message_id: str | None = None
    feedback: str | None = None
    feedback_reason: str | None = None
    version: int | None = 1
    sql_gen_ms: int | None = None
    summary_gen_ms: int | None = None
    total_ms: int | None = None
    model_name: str | None = None
    followups: list[str] | None = None
    confidence_score: int | None = None
    is_typing: bool | None = None
    chart_url: str | None = None


class SendMessageRequest(BaseModel):
    """Schema or class representation for SendMessageRequest."""

    content: str
    referenced_files: list[str] = []
    parent_user_message_id: str | None = None


class ChatSessionCreate(BaseModel):
    """Schema or class representation for ChatSessionCreate."""

    title: str | None = None


class ChatSessionUpdate(BaseModel):
    """Schema or class representation for ChatSessionUpdate."""

    title: str | None = None
    is_favorite: bool | None = None
