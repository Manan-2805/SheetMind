from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SavedQueryResponse(BaseModel):
    id: str
    label: str
    nl_query: str
    sql_query: str
    created_at: datetime
    last_used_at: datetime
    use_count: int


class CreateSavedQueryRequest(BaseModel):
    label: str
    nl_query: str
    sql_query: str
