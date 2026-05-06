from fastapi import APIRouter
from pydantic import BaseModel

import models.saved_query_models as sq_models
from schemas.common_schemas import SuccessResponse
from schemas.saved_query_schemas import CreateSavedQueryRequest, SavedQueryResponse

router = APIRouter(prefix="/saved-queries", tags=["saved-queries"])


class RunResponse(BaseModel):
    inserted_query: str


@router.get("", response_model=list[SavedQueryResponse])
async def get_saved_queries() -> list[SavedQueryResponse]:
    return sq_models.get_all()


@router.post("", response_model=SavedQueryResponse)
async def create_saved_query(body: CreateSavedQueryRequest) -> SavedQueryResponse:
    return sq_models.create(
        label=body.label,
        nl_query=body.nl_query,
        sql_query=body.sql_query,
    )


@router.delete("/{query_id}", response_model=SuccessResponse)
async def delete_saved_query(query_id: str) -> SuccessResponse:
    sq_models.delete(query_id)
    return SuccessResponse(success=True)


@router.post("/{query_id}/run", response_model=RunResponse)
async def run_saved_query(query_id: str) -> RunResponse:
    nl_query = sq_models.run(query_id)
    return RunResponse(inserted_query=nl_query)
