from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ArtifactExportResponse(BaseModel):
    id: str
    filename: str
    file_path: str
    file_size_bytes: int
    created_at: datetime
    source_message_id: Optional[str] = None
    source_session_name: Optional[str] = None
    title: str


class ArtifactChartResponse(BaseModel):
    id: str
    chart_type: str
    title: str
    created_at: datetime
    source_message_id: Optional[str] = None
    source_session_name: Optional[str] = None
    thumbnail_url: Optional[str] = None


class ArtifactsResponse(BaseModel):
    excel_exports: list[ArtifactExportResponse]
    charts: list[ArtifactChartResponse]
