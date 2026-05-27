"""Module containing saved_query_schemas functionality."""

from datetime import datetime

from pydantic import BaseModel


class SavedQueryResponse(BaseModel):
    """Schema or class representation for SavedQueryResponse."""
    id: str
    label: str
    nl_query: str
    sql_query: str
    created_at: datetime
    last_used_at: datetime
    use_count: int
    is_favorite: bool = False


class CreateSavedQueryRequest(BaseModel):
    """Schema or class representation for CreateSavedQueryRequest."""
    label: str
    nl_query: str
    sql_query: str


class UpdateSavedQueryRequest(BaseModel):
    """Schema or class representation for UpdateSavedQueryRequest."""
    label: str
