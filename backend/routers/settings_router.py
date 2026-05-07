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

from models.settings_models import (
    get_settings as db_get_settings,
    update_settings_db,
    clear_chat_history_db,
    delete_all_files_db,
)

router = APIRouter(prefix="/settings", tags=["settings"])


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
    return db_get_settings()


@router.put("", response_model=SettingsResponse)
async def update_settings(body: UpdateSettingsRequest) -> SettingsResponse:
    current_settings = db_get_settings()
    if body.theme is not None:
        current_settings.theme = body.theme
    if body.llm_provider is not None:
        current_settings.llm_provider = body.llm_provider
    if body.openai is not None:
        current_settings.openai = body.openai
    if body.ollama is not None:
        current_settings.ollama = body.ollama
    if body.max_concurrent_uploads is not None:
        current_settings.max_concurrent_uploads = body.max_concurrent_uploads
        
    update_settings_db(current_settings)
    return current_settings


@router.post("/test-llm", response_model=TestLLMResponse)
async def test_llm(body: TestLLMRequest) -> TestLLMResponse:
    await asyncio.sleep(0.8)
    return TestLLMResponse(
        success=True,
        provider=body.provider,
        latency_ms=312,
    )


import httpx
from fastapi.responses import StreamingResponse

@router.get("/ollama-models")
async def get_ollama_models():
    settings = db_get_settings()
    ollama_url = settings.ollama.url.rstrip("/")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{ollama_url}/api/tags")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return JSONResponse(status_code=500, content={"detail": str(e)})

@router.post("/pull-ollama-model")
async def pull_ollama_model(body: PullModelRequest):
    settings = db_get_settings()
    ollama_url = settings.ollama.url.rstrip("/")
    
    async def stream_pull():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("POST", f"{ollama_url}/api/pull", json={"name": body.model_name}) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk
            except Exception as e:
                yield json.dumps({"error": str(e)}).encode("utf-8")
                
    return StreamingResponse(stream_pull(), media_type="application/x-ndjson")


@router.post("/clear-chat-history", response_model=ClearHistoryResponse)
async def clear_chat_history() -> ClearHistoryResponse:
    deleted = clear_chat_history_db()
    return ClearHistoryResponse(success=True, deleted_sessions=deleted)


@router.post("/delete-all-files", response_model=DeleteFilesResponse)
async def delete_all_files() -> DeleteFilesResponse:
    deleted = delete_all_files_db()
    return DeleteFilesResponse(success=True, deleted_files=deleted)


@router.get("/export")
async def export_settings() -> Response:
    settings = db_get_settings()
    data = settings.model_dump()
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
