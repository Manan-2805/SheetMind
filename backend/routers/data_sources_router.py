import asyncio

from fastapi import APIRouter, File, UploadFile

import models.data_source_models as ds_models
from schemas.common_schemas import SuccessResponse
from schemas.data_source_schemas import (
    AutocompleteResponse,
    DataSourceResponse,
    PreviewResponse,
)

router = APIRouter(prefix="/data-sources", tags=["data-sources"])


@router.get("/list-for-autocomplete", response_model=AutocompleteResponse)
async def list_for_autocomplete() -> AutocompleteResponse:
    return ds_models.list_for_autocomplete()


@router.get("", response_model=list[DataSourceResponse])
async def get_data_sources() -> list[DataSourceResponse]:
    return ds_models.get_all()


@router.post("/upload", response_model=DataSourceResponse)
async def upload_data_source(file: UploadFile = File(...)) -> DataSourceResponse:
    await asyncio.sleep(1.5)
    content = await file.read()
    return ds_models.upload_file(
        filename=file.filename or "upload.xlsx",
        size=len(content),
    )


@router.delete("/{source_id}", response_model=SuccessResponse)
async def delete_data_source(source_id: str) -> SuccessResponse:
    ds_models.delete(source_id)
    return SuccessResponse(success=True)


@router.get("/{source_id}/preview", response_model=PreviewResponse)
async def preview_data_source(source_id: str) -> PreviewResponse:
    return ds_models.get_preview(source_id)
