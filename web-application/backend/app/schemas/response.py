from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    details: str | None = None


class Meta(BaseModel):
    timestamp: str
    request_id: str
    version: str = "1.0.0"


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    message: str
    error: ErrorDetail | None = None
    meta: Meta
