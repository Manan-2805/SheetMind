"""Module containing data_sources_router functionality."""

import asyncio
import os
import re
import urllib.parse
import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from pathlib import Path

import aiofiles
import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from starlette.datastructures import UploadFile
from starlette.formparsers import MultiPartException, MultiPartParser

import models.data_source_models as ds_models
from dependencies import current_username
from models.chat_models import broadcast_datasource_status
from schemas.common_schemas import SuccessResponse
from schemas.data_source_schemas import (
    AutocompleteResponse,
    DataSourceResponse,
    PreviewResponse,
)
from services.background_tasks import task_queue
from services.duckdb_service import get_connection
from services.storage_service import get_uploads_dir


class UrlUploadRequest(BaseModel):
    """Schema or class representation for UrlUploadRequest."""

    url: str


router = APIRouter(prefix="/data-sources", tags=["data-sources"])


MAX_UPLOAD_BYTES = 200 * 1024 * 1024
UPLOAD_CHUNK_BYTES = 1024 * 1024
_DOWNLOAD_TIMEOUT_SECONDS = 30


class UploadLimitExceeded(MultiPartException):
    """The multipart request exceeded its upload allowance."""


def _upload_limit() -> int:
    configured = os.environ.get("MAX_UPLOAD_BYTES")
    return max(1, int(configured)) if configured else MAX_UPLOAD_BYTES


def _supported_filename(filename: str) -> tuple[str, str]:
    name = filename.replace("\\", "/").rsplit("/", 1)[-1]
    extension = Path(name).suffix.lower()
    if extension not in {".csv", ".xlsx"}:
        raise HTTPException(status_code=415, detail="Only .csv and .xlsx files are supported.")
    return name, extension


async def _limited_request_stream(request: Request, maximum: int) -> AsyncIterator[bytes]:
    received = 0
    async for chunk in request.stream():
        received += len(chunk)
        if received > maximum + UPLOAD_CHUNK_BYTES:
            raise UploadLimitExceeded(f"Upload exceeds the {maximum}-byte limit.")
        yield chunk


async def _file_chunks(file: UploadFile) -> AsyncIterator[bytes]:
    while chunk := await file.read(UPLOAD_CHUNK_BYTES):
        yield chunk


def _register_upload(
    file_id: str, filename: str, path: Path, uploaded_at: datetime, size: int
) -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO excel_files (id, original_filename, stored_path, uploaded_at, "
            "file_size_bytes, status) VALUES (?, ?, ?, ?, ?, ?)",
            [file_id, filename, str(path), uploaded_at, size, "pending"],
        )


async def _store_upload(
    filename: str, chunks: AsyncIterator[bytes], limit: int
) -> DataSourceResponse:
    name, extension = _supported_filename(filename)
    username = current_username.get("default")
    file_id = f"ds-{uuid.uuid4().hex[:8]}"
    stem = re.sub(r"[^a-zA-Z0-9_]", "_", Path(name).stem)[:120] or "upload"
    path = get_uploads_dir(username) / f"{file_id}_{stem}{extension}"
    size = 0
    uploaded_at = datetime.now(UTC)
    try:
        async with aiofiles.open(path, "xb") as output:
            async for chunk in chunks:
                size += len(chunk)
                if size > limit:
                    raise HTTPException(413, f"Upload exceeds the {limit}-byte limit.")
                await output.write(chunk)
        _register_upload(file_id, name, path, uploaded_at, size)
    except BaseException:
        path.unlink(missing_ok=True)
        raise

    task_queue.put_nowait((username, file_id, str(path)))
    await broadcast_datasource_status()
    return DataSourceResponse(
        id=file_id,
        original_filename=name,
        stored_path=str(path),
        uploaded_at=uploaded_at,
        num_sheets=0,
        file_size_bytes=size,
        status="pending",
        sheets=[],
    )


@router.get("/list-for-autocomplete", response_model=AutocompleteResponse)
async def list_for_autocomplete() -> AutocompleteResponse:
    """Execute the list_for_autocomplete operation."""
    return ds_models.list_for_autocomplete()


@router.get("", response_model=list[DataSourceResponse])
async def get_data_sources() -> list[DataSourceResponse]:
    """Execute the get_data_sources operation."""
    return ds_models.get_all()


@router.post(
    "/upload",
    response_model=DataSourceResponse,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "required": ["file"],
                        "properties": {"file": {"type": "string", "format": "binary"}},
                    }
                }
            },
        }
    },
)
async def upload_data_source(request: Request) -> DataSourceResponse:
    """Validate multipart size before spooling and store the file in chunks."""
    if request.headers.get("content-type", "").split(";", 1)[0].lower() != "multipart/form-data":
        raise HTTPException(415, "Expected a multipart file upload.")
    limit = _upload_limit()
    parser = MultiPartParser(
        request.headers, _limited_request_stream(request, limit), max_files=1, max_fields=0
    )
    try:
        form = await parser.parse()
    except UploadLimitExceeded as exc:
        raise HTTPException(413, exc.message) from exc
    except MultiPartException as exc:
        raise HTTPException(400, "Invalid multipart file upload.") from exc
    try:
        file = form.get("file")
        if not isinstance(file, UploadFile) or not file.filename:
            raise HTTPException(400, "A file is required.")
        return await _store_upload(file.filename, _file_chunks(file), limit)
    finally:
        await form.close()


@router.post("/upload-from-url", response_model=DataSourceResponse)
async def upload_from_url(body: UrlUploadRequest) -> DataSourceResponse:
    """Stream an HTTP or HTTPS file using the same type and byte limits."""
    try:
        parsed = urllib.parse.urlsplit(body.url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError("Unsupported URL")
    except ValueError as exc:
        raise HTTPException(400, "An HTTP or HTTPS URL is required.") from exc
    filename, _ = _supported_filename(urllib.parse.unquote(parsed.path))
    try:
        async with (
            asyncio.timeout(_DOWNLOAD_TIMEOUT_SECONDS),
            httpx.AsyncClient(timeout=_DOWNLOAD_TIMEOUT_SECONDS) as client,
            client.stream("GET", body.url) as response,
        ):
            response.raise_for_status()
            return await _store_upload(
                filename, response.aiter_bytes(chunk_size=UPLOAD_CHUNK_BYTES), _upload_limit()
            )
    except (TimeoutError, httpx.TimeoutException) as exc:
        raise HTTPException(408, "The download timed out after 30 seconds.") from exc
    except (httpx.HTTPError, httpx.InvalidURL) as exc:
        raise HTTPException(400, "Could not download the file from the URL.") from exc


@router.delete("/{source_id}", response_model=SuccessResponse)
async def delete_data_source(source_id: str) -> SuccessResponse:
    """Execute the delete_data_source operation."""
    ds_models.delete(source_id)
    await broadcast_datasource_status()
    return SuccessResponse(success=True)


@router.get("/{source_id}/preview", response_model=PreviewResponse)
async def preview_data_source(
    source_id: str,
    sheet: str | None = Query(default=None),
) -> PreviewResponse:
    """Execute the preview_data_source operation."""
    return ds_models.get_preview(source_id, sheet)
