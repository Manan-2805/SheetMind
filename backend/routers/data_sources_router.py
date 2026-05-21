import uuid
from datetime import datetime, timezone

import aiofiles
from fastapi import APIRouter, File, Query, UploadFile

import models.data_source_models as ds_models
from dependencies import current_username
from schemas.common_schemas import SuccessResponse
from schemas.data_source_schemas import (
    AutocompleteResponse,
    DataSourceResponse,
    PreviewResponse,
)
from services.duckdb_service import get_connection
from services.storage_service import get_uploads_dir


router = APIRouter(prefix="/data-sources", tags=["data-sources"])


@router.get("/list-for-autocomplete", response_model=AutocompleteResponse)
async def list_for_autocomplete() -> AutocompleteResponse:
    return ds_models.list_for_autocomplete()


@router.get("", response_model=list[DataSourceResponse])
async def get_data_sources() -> list[DataSourceResponse]:
    return ds_models.get_all()


@router.post("/upload", response_model=DataSourceResponse)
async def upload_data_source(file: UploadFile = File(...)) -> DataSourceResponse:
    username = current_username.get("default")
    uploads_dir = get_uploads_dir(username)

    filename = file.filename or "upload.xlsx"
    now = datetime.now(timezone.utc)
    file_id = f"ds-{uuid.uuid4().hex[:8]}"

    safe_filename = filename.replace(" ", "_").replace("-", "_")
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

    from services.background_tasks import task_queue
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
    ds_models.delete(source_id)
    return SuccessResponse(success=True)


@router.get("/{source_id}/preview", response_model=PreviewResponse)
async def preview_data_source(
    source_id: str,
    sheet: str | None = Query(default=None),
) -> PreviewResponse:
    return ds_models.get_preview(source_id, sheet)
