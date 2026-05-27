"""Module containing dashboard functionality."""

from datetime import datetime

from pydantic import BaseModel


class DashboardWidgetBase(BaseModel):
    """Schema or class representation for DashboardWidgetBase."""

    widget_type: str
    label: str
    saved_query_id: str | None = None
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
    thumbnail_path: str | None = None


class DashboardCreate(DashboardBase):
    """Schema or class representation for DashboardCreate."""

    widgets: list[DashboardWidgetCreate] = []


class DashboardUpdate(BaseModel):
    """Schema or class representation for DashboardUpdate."""

    title: str | None = None
    layout_json: str | None = None
    is_favorite: bool | None = None
    thumbnail_path: str | None = None
    widgets: list[DashboardWidgetCreate] | None = None


class DashboardRead(DashboardBase):
    """Schema or class representation for DashboardRead."""

    id: str
    created_at: datetime
    updated_at: datetime
    widgets: list[DashboardWidgetRead] = []


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
    widgets: list[AIWidgetGen]


class AINameGenRequest(BaseModel):
    """Schema or class representation for AINameGenRequest."""

    widgets: list[AIWidgetGen]


class AINameGenResponse(BaseModel):
    """Schema or class representation for AINameGenResponse."""

    title: str
