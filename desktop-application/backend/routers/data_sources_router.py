"""Module containing data_sources_router functionality."""

from datetime import datetime, timezone
from pathlib import Path
import urllib.parse
import uuid

import aiofiles
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
import httpx
from pydantic import BaseModel

from dependencies import current_username
import models.data_source_models as ds_models
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


def _safe_storage_filename(filename: str, fallback: str = "upload.xlsx") -> str:
    """Execute the _safe_storage_filename operation."""
    base_name = Path(filename).name or fallback
    return base_name.replace(" ", "_").replace("-", "_")


@router.get("/list-for-autocomplete", response_model=AutocompleteResponse)
async def list_for_autocomplete() -> AutocompleteResponse:
    """Execute the list_for_autocomplete operation."""
    return ds_models.list_for_autocomplete()


@router.get("", response_model=list[DataSourceResponse])
async def get_data_sources() -> list[DataSourceResponse]:
    """Execute the get_data_sources operation."""
    return ds_models.get_all()


@router.post("/upload", response_model=DataSourceResponse)
async def upload_data_source(file: UploadFile = File(...)) -> DataSourceResponse:
    """Execute the upload_data_source operation."""
    username = current_username.get("default")
    uploads_dir = get_uploads_dir(username)

    filename = file.filename or "upload.xlsx"
    now = datetime.now(timezone.utc)
    file_id = f"ds-{uuid.uuid4().hex[:8]}"

    safe_filename = _safe_storage_filename(filename)
    stored_path = str(uploads_dir / f"{file_id}_{safe_filename}")

    async with aiofiles.open(stored_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    file_size = len(content)

    conn = get_connection()
    conn.execute(
        "INSERT INTO excel_files (id, original_filename, stored_path, uploaded_at, file_size_bytes, status) VALUES (?, ?, ?, ?, ?, ?)",
        [file_id, filename, stored_path, now, file_size, "pending"],
    )

    task_queue.put_nowait((username, file_id, stored_path))

    return DataSourceResponse(
        id=file_id,
        original_filename=filename,
        stored_path=stored_path,
        uploaded_at=now,
        num_sheets=0,
        file_size_bytes=file_size,
        status="pending",
        sheets=[],
    )


@router.post("/upload-from-url", response_model=DataSourceResponse)
async def upload_from_url(body: UrlUploadRequest) -> DataSourceResponse:
    """Execute the upload_from_url operation."""
    url = body.url
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        parsed_url = urllib.parse.urlparse(url)
        filename = Path(parsed_url.path).name or "downloaded_file"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid URL structure: {e}") from e

    ext = Path(filename).suffix.lower()
    if ext not in (".csv", ".xls", ".xlsx", ".ods") and not any(filename.endswith(s) for s in (".csv", ".xls", ".xlsx", ".ods")):
        # Will append extension based on content-type later
        pass

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=30.0)
            resp.raise_for_status()
            content = resp.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download file from URL: {str(e)}") from e

    file_size = len(content)

    if not any(filename.endswith(s) for s in (".csv", ".xls", ".xlsx", ".ods")):
        ct = resp.headers.get("content-type", "").lower()
        if "csv" in ct:
            filename += ".csv"
        elif "openxmlformats-officedocument.spreadsheetml.sheet" in ct:
            filename += ".xlsx"
        elif "ms-excel" in ct:
            filename += ".xls"
        elif "opendocument.spreadsheet" in ct:
            filename += ".ods"
        else:
            filename += ".xlsx"

    username = current_username.get("default")
    uploads_dir = get_uploads_dir(username)
    file_id = f"ds-{uuid.uuid4().hex[:8]}"

    safe_filename = _safe_storage_filename(filename)
    stored_path = str(uploads_dir / f"{file_id}_{safe_filename}")

    async with aiofiles.open(stored_path, "wb") as out_file:
        await out_file.write(content)

    now = datetime.now(timezone.utc)

    conn = get_connection()
    conn.execute(
        "INSERT INTO excel_files (id, original_filename, stored_path, uploaded_at, file_size_bytes, status) VALUES (?, ?, ?, ?, ?, ?)",
        [file_id, filename, stored_path, now, file_size, "pending"],
    )

    task_queue.put_nowait((username, file_id, stored_path))

    return DataSourceResponse(
        id=file_id,
        original_filename=filename,
        stored_path=stored_path,
        uploaded_at=now,
        num_sheets=0,
        file_size_bytes=file_size,
        status="pending",
        sheets=[],
    )


@router.delete("/{source_id}", response_model=SuccessResponse)
async def delete_data_source(source_id: str) -> SuccessResponse:
    """Execute the delete_data_source operation."""
    ds_models.delete(source_id)
    return SuccessResponse(success=True)


@router.get("/{source_id}/preview", response_model=PreviewResponse)
async def preview_data_source(
    source_id: str,
    sheet: str | None = Query(default=None),
) -> PreviewResponse:
    """Execute the preview_data_source operation."""
    return ds_models.get_preview(source_id, sheet)
