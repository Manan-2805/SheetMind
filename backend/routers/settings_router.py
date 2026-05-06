import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from schemas.settings_schemas import (
    OllamaSettingsSchema,
    OpenAISettingsSchema,
    PullModelRequest,
    SettingsResponse,
    TestLLMRequest,
    UpdateSettingsRequest,
)

router = APIRouter(prefix="/settings", tags=["settings"])

_settings = SettingsResponse(
    theme="dark",
    llm_provider="openai",
    openai=OpenAISettingsSchema(api_key="", model="gpt-4o"),
    ollama=OllamaSettingsSchema(url="http://localhost:11434", model=""),
    username="",
    created_at=datetime.now(timezone.utc).isoformat(),
)


class TestLLMResponse(BaseModel):
    success: bool
    provider: str
    latency_ms: int


class PullModelResponse(BaseModel):
    success: bool
    model: str


class ClearHistoryResponse(BaseModel):
    success: bool
    deleted_sessions: int


class DeleteFilesResponse(BaseModel):
    success: bool
    deleted_files: int


@router.get("", response_model=SettingsResponse)
async def get_settings() -> SettingsResponse:
    return _settings


@router.put("", response_model=SettingsResponse)
async def update_settings(body: UpdateSettingsRequest) -> SettingsResponse:
    global _settings
    if body.theme is not None:
        _settings.theme = body.theme
    if body.llm_provider is not None:
        _settings.llm_provider = body.llm_provider
    if body.openai is not None:
        _settings.openai = body.openai
    if body.ollama is not None:
        _settings.ollama = body.ollama
    return _settings


@router.post("/test-llm", response_model=TestLLMResponse)
async def test_llm(body: TestLLMRequest) -> TestLLMResponse:
    await asyncio.sleep(0.8)
    return TestLLMResponse(
        success=True,
        provider=body.provider,
        latency_ms=312,
    )


@router.post("/pull-ollama-model", response_model=PullModelResponse)
async def pull_ollama_model(body: PullModelRequest) -> PullModelResponse:
    await asyncio.sleep(2.0)
    return PullModelResponse(success=True, model=body.model_name)


@router.post("/clear-chat-history", response_model=ClearHistoryResponse)
async def clear_chat_history() -> ClearHistoryResponse:
    return ClearHistoryResponse(success=True, deleted_sessions=5)


@router.post("/delete-all-files", response_model=DeleteFilesResponse)
async def delete_all_files() -> DeleteFilesResponse:
    return DeleteFilesResponse(success=True, deleted_files=3)


@router.get("/export")
async def export_settings() -> Response:
    data = _settings.model_dump()
    data["openai"]["api_key"] = ""
    content = json.dumps(data, indent=2, default=str)
    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": 'attachment; filename="sheetmind-settings.json"'
        },
    )


@router.post("/import")
async def import_settings(file: UploadFile = File(...)) -> JSONResponse:
    return JSONResponse({"success": True})
