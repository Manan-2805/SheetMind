from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    details: Optional[str] = None


class Meta(BaseModel):
    timestamp: str
    request_id: str
    version: str = "1.0.0"


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    message: str
    error: Optional[ErrorDetail] = None
    meta: Meta
