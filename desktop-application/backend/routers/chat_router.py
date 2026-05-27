"""Module containing chat_router functionality."""

from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from models import chat_models
from schemas.artifact_schemas import ArtifactExportResponse
from schemas.chat_schemas import (
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
    ResultTable,
    SendMessageRequest,
)
from services import chart_service

router = APIRouter(prefix="/chat", tags=["chat"])


class ChartGenerateRequest(BaseModel):
    """Schema or class representation for ChartGenerateRequest."""

    data: list[dict[str, Any]]
    chart_type: str
    x_key: str
    y_key: str
    title: str = "Chart"
    colors: list[str] | None = None
    output_format: str = "png"
    value_key: str | None = None


@router.post("/charts/generate")
async def generate_chart_endpoint(body: ChartGenerateRequest):
    """Execute the generate_chart_endpoint operation."""
    try:
        buf = chart_service.generate_chart(
            data=body.data,
            chart_type=body.chart_type,
            x_key=body.x_key,
            y_key=body.y_key,
            title=body.title,
            colors=body.colors,
            output_format=body.output_format,
            value_key=body.value_key,
        )
        media_type = "image/png" if body.output_format == "png" else "image/svg+xml"
        return StreamingResponse(buf, media_type=media_type)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def get_chat_sessions() -> list[ChatSessionResponse]:
    """Execute the get_chat_sessions operation."""
    return chat_models.get_sessions()


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    body: ChatSessionCreate = ChatSessionCreate(),
) -> ChatSessionResponse:
    """Execute the create_chat_session operation."""
    return chat_models.create_session(body.title)


@router.get(
    "/sessions/{session_id}/messages",
    response_model=list[ChatMessageResponse],
)
async def get_session_messages(session_id: str) -> list[ChatMessageResponse]:
    """Execute the get_session_messages operation."""
    return chat_models.get_messages(session_id)


@router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageResponse,
)
async def create_message(
    session_id: str,
    body: SendMessageRequest,
) -> ChatMessageResponse:
    """Execute the create_message operation."""
    if len(body.content) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message content cannot exceed 2000 characters.",
        )
    return await chat_models.create_message(
        session_id=session_id,
        content=body.content,
        referenced_files=body.referenced_files,
        parent_user_message_id=body.parent_user_message_id,
    )


@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(session_id: str, body: ChatSessionUpdate) -> ChatSessionResponse:
    """Execute the update_session operation."""
    return chat_models.update_session(session_id, title=body.title, is_favorite=body.is_favorite)


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Execute the delete_session operation."""
    chat_models.delete_session(session_id)
    return {"status": "success"}


class FeedbackRequest(BaseModel):
    """Schema or class representation for FeedbackRequest."""

    feedback: str  # "like" | "dislike"
    reason: str | None = None


@router.get("/messages/{message_id}/data", response_model=ResultTable)
async def get_message_data(
    message_id: str, page: int = 1, page_size: int | None = None
) -> ResultTable:
    """Execute the get_message_data operation."""
    try:
        return chat_models.get_message_data(message_id, page=page, page_size=page_size)
    except ValueError as exc:
        message = str(exc)
        status = 404 if "not found" in message.lower() else 400
        raise HTTPException(status_code=status, detail=message) from exc


@router.post("/messages/{message_id}/export", response_model=ArtifactExportResponse)
async def export_message(message_id: str) -> ArtifactExportResponse:
    """Execute the export_message operation."""
    try:
        return chat_models.export_message(message_id)
    except ValueError as exc:
        message = str(exc)
        status = 404 if "not found" in message.lower() else 400
        raise HTTPException(status_code=status, detail=message) from exc


@router.put("/messages/{message_id}/feedback")
async def set_message_feedback(message_id: str, body: FeedbackRequest):
    """Execute the set_message_feedback operation."""
    chat_models.set_message_feedback(message_id, body.feedback, body.reason)
    return {
        "status": "success",
        "message_id": message_id,
        "feedback": body.feedback,
        "reason": body.reason,
    }


class RegenerateRequest(BaseModel):
    """Schema or class representation for RegenerateRequest."""

    content: str
    referenced_files: list[str] = []
    reason: str = ""
    instruction: str = ""
    parent_user_message_id: str | None = None


@router.post("/sessions/{session_id}/regenerate", response_model=ChatMessageResponse)
async def regenerate_message(session_id: str, body: RegenerateRequest) -> ChatMessageResponse:
    """Execute the regenerate_message operation."""
    if len(body.content) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message content cannot exceed 2000 characters.",
        )
    # Build a combined prompt from content, reason, and instruction
    combined_content = body.content
    if body.reason or body.instruction:
        combined_content += (
            f"\n\nRegeneration requested because: {body.reason}\nInstruction: {body.instruction}"
        )

    return await chat_models.regenerate_response(
        session_id=session_id,
        content=combined_content,
        referenced_files=body.referenced_files,
        parent_user_message_id=body.parent_user_message_id,
    )


class EditMessageRequest(BaseModel):
    """Schema or class representation for EditMessageRequest."""

    content: str
    referenced_files: list[str] = []


@router.put("/sessions/{session_id}/messages/{message_id}", response_model=ChatMessageResponse)
async def edit_message(
    session_id: str, message_id: str, body: EditMessageRequest
) -> ChatMessageResponse:
    """Execute the edit_message operation."""
    if len(body.content) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message content cannot exceed 2000 characters.",
        )
    try:
        return await chat_models.edit_user_message(
            session_id=session_id,
            message_id=message_id,
            new_content=body.content,
            referenced_files=body.referenced_files,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.delete("/sessions/{session_id}/messages/{message_id}")
async def delete_message_branch(session_id: str, message_id: str):
    """Execute the delete_message_branch operation."""
    try:
        chat_models.delete_message_branch(session_id, message_id)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
