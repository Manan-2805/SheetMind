from fastapi import APIRouter

import models.artifact_models as artifact_models
from schemas.artifact_schemas import ArtifactsResponse

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


@router.get("", response_model=ArtifactsResponse)
async def get_artifacts() -> ArtifactsResponse:
    return artifact_models.get_all()
