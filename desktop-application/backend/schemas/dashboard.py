from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class DashboardWidgetBase(BaseModel):
    widget_type: str
    label: str
    saved_query_id: Optional[str] = None
    column_config_json: str
    position_json: str
    size: str

class DashboardWidgetCreate(DashboardWidgetBase):
    pass

class DashboardWidgetRead(DashboardWidgetBase):
    id: str
    dashboard_id: str

class DashboardBase(BaseModel):
    title: str
    layout_json: str
    is_favorite: bool = False
    thumbnail_path: Optional[str] = None

class DashboardCreate(DashboardBase):
    widgets: List[DashboardWidgetCreate] = []

class DashboardUpdate(BaseModel):
    title: Optional[str] = None
    layout_json: Optional[str] = None
    is_favorite: Optional[bool] = None
    thumbnail_path: Optional[str] = None
    widgets: Optional[List[DashboardWidgetCreate]] = None

class DashboardRead(DashboardBase):
    id: str
    created_at: datetime
    updated_at: datetime
    widgets: List[DashboardWidgetRead] = []

class AIWidgetGen(BaseModel):
    label: str
    widget_type: str

class AIDashboardGenRequest(BaseModel):
    description: str

class AIDashboardGenResponse(BaseModel):
    title: str
    widgets: List[AIWidgetGen]

class AINameGenRequest(BaseModel):
    widgets: List[AIWidgetGen]

class AINameGenResponse(BaseModel):
    title: str
