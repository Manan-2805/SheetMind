import os
from datetime import datetime, timezone
import aiofiles
from fastapi import APIRouter, File, UploadFile, HTTPException

import models.data_source_models as ds_models
from schemas.common_schemas import SuccessResponse
from schemas.data_source_schemas import (
    AutocompleteResponse,
    DataSourceResponse,
    PreviewResponse,
)
from services.duckdb_service import get_connection


router = APIRouter(prefix="/data-sources", tags=["data-sources"])

@router.get("/list-for-autocomplete", response_model=AutocompleteResponse)
async def list_for_autocomplete() -> AutocompleteResponse:
    return ds_models.list_for_autocomplete()

@router.get("", response_model=list[DataSourceResponse])
async def get_data_sources() -> list[DataSourceResponse]:
    return ds_models.get_all()

@router.post("/upload", response_model=DataSourceResponse)
async def upload_data_source(file: UploadFile = File(...)) -> DataSourceResponse:
    os.makedirs("uploads", exist_ok=True)
    
    filename = file.filename or "upload.xlsx"
    import uuid
    now = datetime.now(timezone.utc)
    file_id = f"ds-{uuid.uuid4().hex[:8]}"
    
    safe_filename = filename.replace(" ", "_").replace("-", "_")
    stored_path = os.path.join("uploads", f"{file_id}_{safe_filename}")
    
    # Save file asynchronously
    async with aiofiles.open(stored_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        
    file_size = len(content)
    
    # Insert placeholder into DuckDB
    conn = get_connection()
    conn.execute(
        "INSERT INTO excel_files (id, original_filename, stored_path, uploaded_at, file_size_bytes, status) VALUES (?, ?, ?, ?, ?, ?)",
        [file_id, filename, stored_path, now, file_size, "pending"]
    )
    
    table_name = f"file_{file_id.replace('-', '_')}"
    
    # Trigger background task
    from services.background_tasks import task_queue
    from dependencies import current_username
    username = current_username.get("default")
    task_queue.put_nowait((username, file_id, stored_path, table_name))
    
    # Return response
    return DataSourceResponse(
        id=file_id,
        original_filename=filename,
        stored_path=stored_path,
        uploaded_at=now,
        num_sheets=1,
        file_size_bytes=file_size,
        status="pending",
        sheets=[],
    )

@router.delete("/{source_id}", response_model=SuccessResponse)
async def delete_data_source(source_id: str) -> SuccessResponse:
    ds_models.delete(source_id)
    return SuccessResponse(success=True)

@router.get("/{source_id}/preview", response_model=PreviewResponse)
async def preview_data_source(source_id: str) -> PreviewResponse:
    return ds_models.get_preview(source_id)
