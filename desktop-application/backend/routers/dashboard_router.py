"""Module containing dashboard_router functionality."""

import asyncio
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError

from schemas.common_schemas import SuccessResponse
from schemas.dashboard import (
    AIDashboardGenRequest,
    AIDashboardGenResponse,
    AINameGenRequest,
    AINameGenResponse,
    DashboardCreate,
    DashboardRead,
    DashboardUpdate,
)
from services import dashboard_service, llm_service
from services.duckdb_service import get_connection

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


@router.get("", response_model=list[DashboardRead])
def list_dashboards(
    q: str | None = None,
    filter: str = Query("all", description="all, favorites, recent"),
    sort: str = Query("name", description="name, created, viewed"),
):
    """Execute the list_dashboards operation."""
    try:
        return dashboard_service.list_dashboards(q, filter, sort)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("", response_model=DashboardRead)
def create_dashboard(data: DashboardCreate):
    """Execute the create_dashboard operation."""
    try:
        return dashboard_service.create_dashboard(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{dashboard_id}", response_model=DashboardRead)
def get_dashboard(dashboard_id: str):
    """Execute the get_dashboard operation."""
    try:
        dashboard = dashboard_service.get_dashboard(dashboard_id)
        if not dashboard:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        return dashboard
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/{dashboard_id}", response_model=DashboardRead)
def update_dashboard(dashboard_id: str, data: DashboardUpdate):
    """Execute the update_dashboard operation."""
    try:
        updated = dashboard_service.update_dashboard(dashboard_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{dashboard_id}", response_model=SuccessResponse)
def delete_dashboard(dashboard_id: str):
    """Execute the delete_dashboard operation."""
    try:
        success = dashboard_service.delete_dashboard(dashboard_id)
        if not success:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        return SuccessResponse(success=True)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{dashboard_id}/refresh", response_model=dict[str, Any])
def refresh_dashboard(dashboard_id: str):
    """Execute the refresh_dashboard operation."""
    try:
        results = dashboard_service.refresh_dashboard(dashboard_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


def _dashboard_name_context(data: AINameGenRequest) -> list[dict[str, Any]]:
    conn = get_connection()
    widgets_with_rich_context = []
    for w in data.widgets:
        widget_dict = w.model_dump()
        if w.saved_query_id:
            # Query saved_queries for details
            sq_row = conn.execute(
                "SELECT label, sql_query, natural_query FROM saved_queries WHERE id = ?",
                [w.saved_query_id],
            ).fetchone()
            if sq_row:
                widget_dict["query_name"] = sq_row[0]
                widget_dict["sql_query"] = sq_row[1]
                widget_dict["natural_query"] = sq_row[2]
        widgets_with_rich_context.append(widget_dict)

    return widgets_with_rich_context


@router.post("/generate-name", response_model=AINameGenResponse)
async def generate_dashboard_name(data: AINameGenRequest):
    """Execute the generate_dashboard_name operation."""
    try:
        widgets_with_rich_context = await asyncio.to_thread(_dashboard_name_context, data)
        title = await llm_service.generate_dashboard_name(widgets_with_rich_context)
        return AINameGenResponse(title=title)
    except llm_service.LLMResponseError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/generate-layout", response_model=AIDashboardGenResponse)
async def generate_dashboard_layout(data: AIDashboardGenRequest):
    """Generate a layout or report invalid provider output."""
    try:
        res = await llm_service.generate_dashboard_layout(data.description)
        return AIDashboardGenResponse.model_validate(res)
    except llm_service.LLMResponseError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValidationError as exc:
        raise HTTPException(
            status_code=502, detail="The LLM returned an invalid dashboard layout."
        ) from exc
