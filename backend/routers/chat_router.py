from typing import Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import models.chat_models as chat_models
import services.chart_service as chart_service
from schemas.artifact_schemas import ArtifactExportResponse
from schemas.chat_schemas import (
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
    ResultTable,
    SendMessageRequest,
)

router = APIRouter(prefix="/chat", tags=["chat"])

class ChartGenerateRequest(BaseModel):
    data: list[dict[str, Any]]
    chart_type: str
    x_key: str
    y_key: str
    title: str = "Chart"
    colors: list[str] | None = None
    output_format: str = "png"


@router.post("/charts/generate")
async def generate_chart_endpoint(body: ChartGenerateRequest):
    try:
        buf = chart_service.generate_chart(
            data=body.data,
            chart_type=body.chart_type,
            x_key=body.x_key,
            y_key=body.y_key,
            title=body.title,
            colors=body.colors,
            output_format=body.output_format
        )
        media_type = "image/png" if body.output_format == "png" else "image/svg+xml"
        return StreamingResponse(buf, media_type=media_type)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def get_chat_sessions() -> list[ChatSessionResponse]:
    return chat_models.get_sessions()


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    body: ChatSessionCreate = ChatSessionCreate(),
) -> ChatSessionResponse:
    return chat_models.create_session(body.title)


@router.get(
    "/sessions/{session_id}/messages",
    response_model=list[ChatMessageResponse],
)
async def get_session_messages(session_id: str) -> list[ChatMessageResponse]:
    return chat_models.get_messages(session_id)


@router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageResponse,
)
async def create_message(
    session_id: str,
    body: SendMessageRequest,
) -> ChatMessageResponse:
    return await chat_models.create_message(
        session_id=session_id,
        content=body.content,
        referenced_files=body.referenced_files,
        parent_user_message_id=body.parent_user_message_id,
    )


@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(session_id: str, body: ChatSessionUpdate) -> ChatSessionResponse:
    return chat_models.update_session(session_id, title=body.title, is_favorite=body.is_favorite)


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    chat_models.delete_session(session_id)
    return {"status": "success"}


class FeedbackRequest(BaseModel):
    feedback: str  # "like" | "dislike"


@router.get("/messages/{message_id}/data", response_model=ResultTable)
async def get_message_data(message_id: str) -> ResultTable:
    try:
        return chat_models.get_message_data(message_id)
    except ValueError as exc:
        message = str(exc)
        status = 404 if "not found" in message.lower() else 400
        raise HTTPException(status_code=status, detail=message)


@router.post("/messages/{message_id}/export", response_model=ArtifactExportResponse)
async def export_message(message_id: str) -> ArtifactExportResponse:
    try:
        return chat_models.export_message(message_id)
    except ValueError as exc:
        message = str(exc)
        status = 404 if "not found" in message.lower() else 400
        raise HTTPException(status_code=status, detail=message)


@router.put("/messages/{message_id}/feedback")
async def set_message_feedback(message_id: str, body: FeedbackRequest):
    chat_models.set_message_feedback(message_id, body.feedback)
    return {"status": "success", "message_id": message_id, "feedback": body.feedback}


class RegenerateRequest(BaseModel):
    content: str
    referenced_files: list[str] = []
    reason: str = ""
    instruction: str = ""
    parent_user_message_id: str | None = None


@router.post("/sessions/{session_id}/regenerate", response_model=ChatMessageResponse)
async def regenerate_message(session_id: str, body: RegenerateRequest) -> ChatMessageResponse:
    # Build a combined prompt from content, reason, and instruction
    combined_content = body.content
    if body.reason or body.instruction:
        combined_content += f"\n\nRegeneration requested because: {body.reason}\nInstruction: {body.instruction}"
        
    return await chat_models.regenerate_response(
        session_id=session_id,
        content=combined_content,
        referenced_files=body.referenced_files,
        parent_user_message_id=body.parent_user_message_id,
    )


class EditMessageRequest(BaseModel):
    content: str
    referenced_files: list[str] = []


@router.put("/sessions/{session_id}/messages/{message_id}", response_model=ChatMessageResponse)
async def edit_message(session_id: str, message_id: str, body: EditMessageRequest) -> ChatMessageResponse:
    try:
        return await chat_models.edit_user_message(
            session_id=session_id,
            message_id=message_id,
            new_content=body.content,
            referenced_files=body.referenced_files
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/sessions/{session_id}/messages/{message_id}")
async def delete_message_branch(session_id: str, message_id: str):
    try:
        chat_models.delete_message_branch(session_id, message_id)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

