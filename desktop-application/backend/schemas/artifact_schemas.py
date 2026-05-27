"""Module containing artifact_schemas functionality."""

from datetime import datetime

from pydantic import BaseModel


class ArtifactExportResponse(BaseModel):
    """Schema or class representation for ArtifactExportResponse."""

    id: str
    filename: str
    file_path: str
    file_size_bytes: int
    created_at: datetime
    source_message_id: str | None = None
    source_session_name: str | None = None
    title: str


class ArtifactChartResponse(BaseModel):
    """Schema or class representation for ArtifactChartResponse."""

    id: str
    chart_type: str
    title: str
    created_at: datetime
    source_message_id: str | None = None
    source_session_name: str | None = None
    thumbnail_url: str | None = None


class ArtifactsResponse(BaseModel):
    """Schema or class representation for ArtifactsResponse."""

    excel_exports: list[ArtifactExportResponse]
    charts: list[ArtifactChartResponse]
