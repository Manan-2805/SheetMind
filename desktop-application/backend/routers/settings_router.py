"""Module containing settings_router functionality."""

import asyncio
import json
import time

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response, StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

from models.settings_models import (
    clear_chat_history_db,
    delete_all_files_db,
    merge_settings,
)
from models.settings_models import (
    get_settings as db_get_settings,
)
from schemas.settings_schemas import (
    PublicSettingsResponse,
    PullModelRequest,
    TestLLMRequest,
    UpdateSettingsRequest,
)

router = APIRouter(prefix="/settings", tags=["settings"])


class TestLLMResponse(BaseModel):
    """Schema or class representation for TestLLMResponse."""

    success: bool
    provider: str
    latency_ms: int
    message: str
    models: list[str] = []


class PullModelResponse(BaseModel):
    """Schema or class representation for PullModelResponse."""

    success: bool
    model: str


class ClearHistoryResponse(BaseModel):
    """Schema or class representation for ClearHistoryResponse."""

    success: bool
    deleted_sessions: int


class DeleteFilesResponse(BaseModel):
    """Schema or class representation for DeleteFilesResponse."""

    success: bool
    deleted_files: int


@router.get("", response_model=PublicSettingsResponse)
def get_settings() -> PublicSettingsResponse:
    """Execute the get_settings operation."""
    return PublicSettingsResponse.from_stored(db_get_settings())


@router.put("", response_model=PublicSettingsResponse)
def update_settings(body: UpdateSettingsRequest) -> PublicSettingsResponse:
    """Execute the update_settings operation."""
    return PublicSettingsResponse.from_stored(merge_settings(body))


@router.post("/test-llm", response_model=TestLLMResponse)
async def test_llm(body: TestLLMRequest) -> TestLLMResponse:
    """Execute the test_llm operation."""
    t0 = time.time()
    settings = await asyncio.to_thread(db_get_settings)

    if body.provider == "openai":
        api_key = body.api_key or settings.openai.api_key
        if not api_key:
            return TestLLMResponse(
                success=False,
                provider="openai",
                latency_ms=0,
                message="No API key provided.",
            )
        try:
            client = AsyncOpenAI(api_key=api_key)
            models_page = await client.models.list()
            model_ids = sorted(
                [m.id for m in models_page.data if "gpt" in m.id.lower()],
                reverse=True,
            )
            latency_ms = int((time.time() - t0) * 1000)
            return TestLLMResponse(
                success=True,
                provider="openai",
                latency_ms=latency_ms,
                message=f"Connected. {len(model_ids)} GPT models available.",
                models=model_ids,
            )
        except Exception as e:
            latency_ms = int((time.time() - t0) * 1000)
            return TestLLMResponse(
                success=False,
                provider="openai",
                latency_ms=latency_ms,
                message=str(e),
            )

    else:
        ollama_url = (body.url or settings.ollama.url).rstrip("/")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{ollama_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                model_names = [m["name"] for m in data.get("models", [])]
                latency_ms = int((time.time() - t0) * 1000)
                return TestLLMResponse(
                    success=True,
                    provider="ollama",
                    latency_ms=latency_ms,
                    message=f"Connected. {len(model_names)} models available.",
                    models=model_names,
                )
        except Exception as e:
            latency_ms = int((time.time() - t0) * 1000)
            return TestLLMResponse(
                success=False,
                provider="ollama",
                latency_ms=latency_ms,
                message=str(e),
            )


@router.get("/ollama-models")
async def get_ollama_models():
    """Execute the get_ollama_models operation."""
    settings = await asyncio.to_thread(db_get_settings)
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
    """Execute the pull_ollama_model operation."""
    settings = await asyncio.to_thread(db_get_settings)
    ollama_url = settings.ollama.url.rstrip("/")

    async def stream_pull():
        """Execute the stream_pull operation."""
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST", f"{ollama_url}/api/pull", json={"name": body.model_name}
                ) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk
            except Exception as e:
                yield json.dumps({"error": str(e)}).encode("utf-8")

    return StreamingResponse(stream_pull(), media_type="application/x-ndjson")


@router.post("/clear-chat-history", response_model=ClearHistoryResponse)
def clear_chat_history() -> ClearHistoryResponse:
    """Execute the clear_chat_history operation."""
    deleted = clear_chat_history_db()
    return ClearHistoryResponse(success=True, deleted_sessions=deleted)


@router.post("/delete-all-files", response_model=DeleteFilesResponse)
def delete_all_files() -> DeleteFilesResponse:
    """Execute the delete_all_files operation."""
    deleted = delete_all_files_db()
    return DeleteFilesResponse(success=True, deleted_files=deleted)


@router.get("/export")
def export_settings() -> Response:
    """Execute the export_settings operation."""
    settings = db_get_settings()
    data = settings.model_dump()
    data["openai"]["api_key"] = ""
    content = json.dumps(data, indent=2, default=str)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="sheetmind-settings.json"'},
    )


@router.post("/import", response_model=PublicSettingsResponse)
async def import_settings(file: UploadFile = File(...)) -> PublicSettingsResponse:
    """Validate and apply an exported settings file, preserving local credentials."""
    limit = 1024 * 1024
    contents = await file.read(limit + 1)
    if len(contents) > limit:
        raise HTTPException(413, "Settings file is too large.")
    try:
        data = json.loads(contents)
        if isinstance(data, dict) and isinstance(data.get("openai"), dict):
            data["openai"].pop("api_key", None)
        body = UpdateSettingsRequest.model_validate(data)
    except ValueError as exc:
        raise HTTPException(400, "Invalid settings file.") from exc
    settings = await asyncio.to_thread(merge_settings, body)
    return PublicSettingsResponse.from_stored(settings)
