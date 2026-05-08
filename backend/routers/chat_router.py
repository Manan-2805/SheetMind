import asyncio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import models.chat_models as chat_models
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


@router.post("/sessions/{session_id}/regenerate", response_model=ChatMessageResponse)
async def regenerate_message(session_id: str, body: RegenerateRequest) -> ChatMessageResponse:
    return await chat_models.regenerate_response(
        session_id=session_id,
        content=body.content,
        referenced_files=body.referenced_files,
    )

