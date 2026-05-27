"""Module containing dashboard_router functionality."""

from typing import Any

from fastapi import APIRouter, HTTPException, Query

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

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


@router.get("", response_model=list[DashboardRead])
async def list_dashboards(
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
async def create_dashboard(data: DashboardCreate):
    """Execute the create_dashboard operation."""
    try:
        return dashboard_service.create_dashboard(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{dashboard_id}", response_model=DashboardRead)
async def get_dashboard(dashboard_id: str):
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
async def update_dashboard(dashboard_id: str, data: DashboardUpdate):
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
async def delete_dashboard(dashboard_id: str):
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
async def refresh_dashboard(dashboard_id: str):
    """Execute the refresh_dashboard operation."""
    try:
        results = dashboard_service.refresh_dashboard(dashboard_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/generate-name", response_model=AINameGenResponse)
async def generate_dashboard_name(data: AINameGenRequest):
    """Execute the generate_dashboard_name operation."""
    try:
        title = await llm_service.generate_dashboard_name([w.model_dump() for w in data.widgets])
        return AINameGenResponse(title=title)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/generate-layout", response_model=AIDashboardGenResponse)
async def generate_dashboard_layout(data: AIDashboardGenRequest):
    """Execute the generate_dashboard_layout operation."""
    try:
        res = await llm_service.generate_dashboard_layout(data.description)
        if not res or "title" not in res:
            raise HTTPException(status_code=500, detail="Failed to generate valid layout")
        return AIDashboardGenResponse(**res)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
