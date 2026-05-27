"""Module containing saved_queries_router functionality."""

from datetime import datetime, timezone
import re

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

import models.saved_query_models as sq_models
import models.chat_models as chat_models
import models.artifact_models as artifact_models
from models.settings_models import get_settings
from schemas.common_schemas import SuccessResponse
from schemas.saved_query_schemas import (
    CreateSavedQueryRequest,
    SavedQueryResponse,
    UpdateSavedQueryRequest,
)
from schemas.artifact_schemas import ArtifactExportResponse
from schemas.chat_schemas import ResultTable
from services.duckdb_service import get_connection
from services.query_service import dataframe_to_result_table
from services.storage_service import get_exports_dir

router = APIRouter(prefix="/saved-queries", tags=["saved-queries"])


class RunSavedQueryResponse(BaseModel):
    """Schema or class representation for RunSavedQueryResponse."""
    id: str
    label: str
    nl_query: str
    sql_query: str
    result: ResultTable


class GenerateLabelRequest(BaseModel):
    """Schema or class representation for GenerateLabelRequest."""
    nl_query: str
    sql_query: str


class GenerateLabelResponse(BaseModel):
    """Schema or class representation for GenerateLabelResponse."""
    label: str


@router.post("/generate-label", response_model=GenerateLabelResponse)
async def generate_label(body: GenerateLabelRequest) -> GenerateLabelResponse:
    """Execute the generate_label operation."""
    label = await chat_models.generate_query_label(body.nl_query, body.sql_query)
    return GenerateLabelResponse(label=label)


@router.get("", response_model=list[SavedQueryResponse])
async def get_saved_queries(
    q: str | None = None,
    from_: datetime | None = Query(default=None, alias="from"),
    to: datetime | None = Query(default=None, alias="to"),
) -> list[SavedQueryResponse]:
    """Execute the get_saved_queries operation."""
    query = q.strip() if q else None
    return sq_models.search(query, from_, to)


@router.post("", response_model=SavedQueryResponse)
async def create_saved_query(body: CreateSavedQueryRequest) -> SavedQueryResponse:
    """Execute the create_saved_query operation."""
    return sq_models.create(
        label=body.label,
        nl_query=body.nl_query,
        sql_query=body.sql_query,
    )


@router.put("/{query_id}/favorite", response_model=SavedQueryResponse)
async def toggle_favorite(query_id: str) -> SavedQueryResponse:
    """Execute the toggle_favorite operation."""
    updated = sq_models.toggle_favorite(query_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Saved query not found")
    return updated


@router.put("/{query_id}", response_model=SavedQueryResponse)
async def rename_saved_query(query_id: str, body: UpdateSavedQueryRequest) -> SavedQueryResponse:
    """Execute the rename_saved_query operation."""
    updated = sq_models.rename(query_id, body.label)
    if not updated:
        raise HTTPException(status_code=404, detail="Saved query not found")
    return updated


@router.delete("/{query_id}", response_model=SuccessResponse)
async def delete_saved_query(query_id: str) -> SuccessResponse:
    """Execute the delete_saved_query operation."""
    sq_models.delete(query_id)
    return SuccessResponse(success=True)


def _get_row_limit() -> int:
    """Execute the _get_row_limit operation."""
    settings = get_settings()
    try:
        limit = int(settings.result_row_limit)
    except Exception:
        limit = 500
    return max(1, limit)


@router.post("/{query_id}/run", response_model=RunSavedQueryResponse)
async def run_saved_query(
    query_id: str,
    page: int = Query(default=1),
    page_size: int = Query(default=10),
) -> RunSavedQueryResponse:
    """Execute the run_saved_query operation."""
    saved_query = sq_models.get_by_id(query_id)
    if not saved_query:
        raise HTTPException(status_code=404, detail="Saved query not found")

    conn = get_connection()
    try:
        df = conn.execute(saved_query.sql_query).fetchdf()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"SQL Execution Failed: {str(exc)}") from exc

    sq_models.mark_used(query_id)

    result_table = dataframe_to_result_table(df, row_limit=500, page=page, page_size=page_size)
    return RunSavedQueryResponse(
        id=saved_query.id,
        label=saved_query.label,
        nl_query=saved_query.nl_query,
        sql_query=saved_query.sql_query,
        result=result_table,
    )


@router.post("/{query_id}/export", response_model=ArtifactExportResponse)
async def export_saved_query(query_id: str) -> ArtifactExportResponse:
    """Execute the export_saved_query operation."""
    saved_query = sq_models.get_by_id(query_id)
    if not saved_query:
        raise HTTPException(status_code=404, detail="Saved query not found")

    conn = get_connection()
    try:
        df = conn.execute(saved_query.sql_query).fetchdf()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"SQL Execution Failed: {str(exc)}") from exc

    sq_models.mark_used(query_id)

    exports_dir = get_exports_dir()
    safe_label = re.sub(r"[^0-9A-Za-z_]+", "_", saved_query.label).strip("_") or "saved_query"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_label}_{timestamp}.xlsx"
    file_path = exports_dir / filename
    df.to_excel(file_path, index=False)
    file_size = file_path.stat().st_size

    return artifact_models.create_export(
        filename=filename,
        file_path=str(file_path),
        file_size_bytes=file_size,
        title=saved_query.label,
        source_message_id=None,
    )
