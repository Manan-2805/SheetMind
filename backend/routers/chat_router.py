import asyncio

from fastapi import APIRouter

import models.chat_models as chat_models
from schemas.chat_schemas import (
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
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
    await asyncio.sleep(0.8)
    return chat_models.create_message(
        session_id=session_id,
        content=body.content,
        referenced_files=body.referenced_files,
    )
