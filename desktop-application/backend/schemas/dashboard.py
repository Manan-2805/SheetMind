"""Module containing dashboard functionality."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class DashboardWidgetBase(BaseModel):
    """Schema or class representation for DashboardWidgetBase."""
    widget_type: str
    label: str
    saved_query_id: Optional[str] = None
    column_config_json: str
    position_json: str
    size: str

class DashboardWidgetCreate(DashboardWidgetBase):
    """Schema or class representation for DashboardWidgetCreate."""
    pass

class DashboardWidgetRead(DashboardWidgetBase):
    """Schema or class representation for DashboardWidgetRead."""
    id: str
    dashboard_id: str

class DashboardBase(BaseModel):
    """Schema or class representation for DashboardBase."""
    title: str
    layout_json: str
    is_favorite: bool = False
    thumbnail_path: Optional[str] = None

class DashboardCreate(DashboardBase):
    """Schema or class representation for DashboardCreate."""
    widgets: List[DashboardWidgetCreate] = []

class DashboardUpdate(BaseModel):
    """Schema or class representation for DashboardUpdate."""
    title: Optional[str] = None
    layout_json: Optional[str] = None
    is_favorite: Optional[bool] = None
    thumbnail_path: Optional[str] = None
    widgets: Optional[List[DashboardWidgetCreate]] = None

class DashboardRead(DashboardBase):
    """Schema or class representation for DashboardRead."""
    id: str
    created_at: datetime
    updated_at: datetime
    widgets: List[DashboardWidgetRead] = []

class AIWidgetGen(BaseModel):
    """Schema or class representation for AIWidgetGen."""
    label: str
    widget_type: str

class AIDashboardGenRequest(BaseModel):
    """Schema or class representation for AIDashboardGenRequest."""
    description: str

class AIDashboardGenResponse(BaseModel):
    """Schema or class representation for AIDashboardGenResponse."""
    title: str
    widgets: List[AIWidgetGen]

class AINameGenRequest(BaseModel):
    """Schema or class representation for AINameGenRequest."""
    widgets: List[AIWidgetGen]

class AINameGenResponse(BaseModel):
    """Schema or class representation for AINameGenResponse."""
    title: str
