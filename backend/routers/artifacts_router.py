from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd

import models.artifact_models as artifact_models
from models.settings_models import get_settings
from schemas.artifact_schemas import ArtifactExportResponse, ArtifactsResponse
from schemas.chat_schemas import ResultTable
from schemas.common_schemas import SuccessResponse
from services.query_service import dataframe_to_result_table

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


@router.get("", response_model=ArtifactsResponse)
async def get_artifacts() -> ArtifactsResponse:
    return artifact_models.get_all()


class RenameArtifactRequest(BaseModel):
    title: str


def _get_row_limit() -> int:
    settings = get_settings()
    try:
        limit = int(settings.result_row_limit)
    except Exception:
        limit = 500
    return max(1, limit)


@router.get("/{artifact_id}/download")
async def download_artifact(artifact_id: str) -> FileResponse:
    row = artifact_models.get_by_id(artifact_id)
    if not row:
        raise HTTPException(status_code=404, detail="Artifact not found")
    _, _, filename, file_path, _, _, _, _ = row
    return FileResponse(path=file_path, filename=filename)


@router.get("/{artifact_id}/data", response_model=ResultTable)
async def get_artifact_data(artifact_id: str) -> ResultTable:
    row = artifact_models.get_by_id(artifact_id)
    if not row:
        raise HTTPException(status_code=404, detail="Artifact not found")
    _, _, _, file_path, _, _, _, _ = row
    try:
        df = pd.read_excel(file_path)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read artifact: {str(exc)}")
    return dataframe_to_result_table(df, _get_row_limit())


@router.put("/{artifact_id}", response_model=ArtifactExportResponse)
async def rename_artifact(artifact_id: str, body: RenameArtifactRequest) -> ArtifactExportResponse:
    updated = artifact_models.rename(artifact_id, body.title)
    if not updated:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return updated


@router.delete("/{artifact_id}", response_model=SuccessResponse)
async def delete_artifact(artifact_id: str) -> SuccessResponse:
    ok = artifact_models.delete(artifact_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return SuccessResponse(success=True)
